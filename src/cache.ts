import type { CaccuOpts, CacheEntry, Stats, UpdateFunc } from './types';
import { func, str } from './util';

const DEFAULT_GC_INTERVAL = 1000 * 60 * 60; // 60 minutes
const ERR_KEY_TYPE = 'key must be a string';

export class Caccu {
	private _mem: Map<string, CacheEntry>;
	private _promises: Map<string, Promise<any>>;
	private _interval: any | null;
	private _statistics: Stats;

	constructor(opts?: CaccuOpts) {
		validateOpts(opts);

		this._mem = new Map();
		this._promises = new Map();
		this._statistics = {
			hits: 0,
			misses: 0,
			items: 0
		};

		// interval to clear out expired entries
		this._interval = setInterval(this.gc, opts?.cleanupInterval ?? DEFAULT_GC_INTERVAL);
	}

	/**
	 * Internal garbage collection.
	 */
	private gc = () => {
		for (const [key, value] of Array.from(this._mem.entries())) {
			if (!alive(value)) this.delete(key);
		}
	};

	/**
	 * Adds a value into the cache under the given key.
	 * An optional `ttl` (time to live) can be specified.
	 * A ttl of 0 means the value will never expire.
	 * @param key Key used to retrieve value from cache
	 * @param value Value to store in cache
	 * @param ttl How long to store value in cache (seconds)
	 * @returns Cached value
	 */
	set = <T = any>(key: string, value: T, ttl = 0): T => {
		if (!str(key)) throw new TypeError(ERR_KEY_TYPE);
		if (ttl < 0) throw new Error('ttl cannot be below 0');

		this._mem.set(key, {
			val: value,
			exp: ttl === 0 ? 0 : Date.now() + ttl * 1000,
			ttl
		});

		return value;
	};

	/**
	 * Retrieves a value from the cache, if it exists.
	 * @param key Key used to retrieve value from cache
	 * @returns Cached value
	 */
	get = <T = any>(key: string): T | null => {
		if (!str(key)) throw new TypeError(ERR_KEY_TYPE);

		const entry = this._mem.get(key);
		if (!alive(entry)) {
			this._statistics.misses += 1;
			return null;
		}

		this._statistics.hits += 1;

		return entry.val;
	};

	/**
	 * Behaves like an async version of `get`, with the exception that cache misses are
	 * handled by calling the `update` function to get the value. The return value of `update`
	 * is then cached.
	 * @param key Key used to retrieve value from cache
	 * @param update function to update value in cache in case of a miss
	 * @returns Promise resolving to cached value
	 */
	getOrUpdate = async <T = any>(key: string, update: UpdateFunc<T>, ttl = 0): Promise<T> => {
		if (!str(key)) throw new TypeError(ERR_KEY_TYPE);
		if (!func(update)) throw new TypeError('update must be a function');

		// wait for any pending updates to finish before accessing cache
		const pending = this._promises.get(key);
		if (pending) await pending;

		const entry = this._mem.get(key);
		if (alive(entry)) {
			this._statistics.hits += 1;
			return entry.val;
		}

		const promise = update()
			.catch((err) => {
				throw err;
			})
			.then((v) => {
				this.set(key, v, ttl); // update cache with latest value
				this._promises.delete(key); // remove pending promise
				return v;
			});

		this._promises.set(key, promise);
		this._statistics.misses += 1;

		return await promise;
	};

	/**
	 * Returns `true` if cache contains a value for the given `key`.
	 * This does not affect the cache statistics.
	 * @param key key to check
	 * @returns
	 */
	has = (key: string): boolean => {
		if (!str(key)) throw new TypeError(ERR_KEY_TYPE);

		return alive(this._mem.get(key));
	};

	/**
	 * Removes the given item from the cache.
	 * @param key
	 */
	delete = (key: string) => {
		if (!str(key)) throw new TypeError(ERR_KEY_TYPE);

		this._promises.delete(key);
		this._mem.delete(key);
	};

	/**
	 * Removes all items from the cache.
	 */
	clear = () => {
		this._mem.clear();
	};

	/**
	 * Stops the garbage collection and clears the in-memory cache.
	 */
	destroy = () => {
		this._mem.clear();
		this._promises.clear();
		clearInterval(this._interval);
	};

	/**
	 * Returns a read-only copy of the current statistics for the cache
	 */
	stats = (): Readonly<Stats> => {
		this._statistics.items = this._mem.size;
		return this._statistics;
	};
}

// the entry is valid if it exists and has not expired (ttl=0: never expires)
const alive = <T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> => {
	return !!entry && (entry.ttl === 0 || Date.now() < entry.exp);
};

const validateOpts = (opts?: CaccuOpts) => {
	if (!opts) return true;

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	if (Object.prototype.hasOwnProperty.call(opts, 'cleanupInterval') && opts.cleanupInterval! <= 0)
		throw new Error('cleanupInterval must be above 0');

	return true;
};
