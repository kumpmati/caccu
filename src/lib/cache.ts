type CacheEntry<T> = {
	val: T;
	exp: number;
	ttl: number;
};

type UpdateFunc<T> = () => Promise<T>;

export class Caccu {
	private mem: Map<string, CacheEntry<any>>;
	private promises: Map<string, Promise<any>>;
	private interval: any | null;

	constructor() {
		this.mem = new Map();
		this.promises = new Map();

		// interval to clear out expired entries
		this.interval = setInterval(() => {
			this.mem.forEach((value, key) => {
				if (!isValid(value)) this.delete(key);
			});
		}, 1000 * 60 * 60); // 60 min
	}

	/**
	 * Adds a value into the cache under the given key.
	 * An optional `ttl` (time to live) can be specified.
	 * A ttl of 0 means the value will never expire.
	 * @param key Key used to retrieve value from cache
	 * @param value Value to store in cache
	 * @param ttl Time to live in seconds
	 * @returns
	 */
	set = <T = any>(key: string, value: T, ttl = 0): T => {
		if (!str(key)) throw new TypeError('key must be a string');
		if (ttl < 0) throw new Error('ttl cannot be below 0');

		this.mem.set(key, {
			val: value,
			exp: ttl === 0 ? -1 : Date.now() + ttl * 1000,
			ttl
		});

		return value;
	};

	/**
	 * Retrieves a value from the cache, if it exists.
	 * @param key
	 */
	get = <T = any>(key: string): T | null => {
		if (!str(key)) throw new TypeError('key must be a string');

		const entry = this.mem.get(key);
		if (!isValid(entry)) return null;

		return entry.val;
	};

	/**
	 *
	 * @param key
	 * @param update
	 */
	getOrUpdate = async <T = any>(key: string, update: UpdateFunc<T>, ttl = 0): Promise<T> => {
		if (!str(key)) throw new TypeError('key must be a string');
		if (!func(update)) throw new TypeError('update must be a function');

		// wait for any pending updates to finish before accessing cache
		const pending = this.promises.get(key);
		if (pending) await pending;

		const entry = this.mem.get(key);
		if (isValid(entry)) {
			return entry.val;
		}

		const promise = update().then((v) => {
			this.set(key, v, ttl); // update cache with latest value
			this.promises.delete(key); // remove pending promise
			return v;
		});

		this.promises.set(key, promise);

		return await promise;
	};

	/**
	 * Returns `true` if cache contains a value for the given `key`.
	 * @param key key to check
	 * @returns
	 */
	has = (key: string): boolean => {
		if (!str(key)) throw new TypeError('key must be a string');

		return isValid(this.mem.get(key));
	};

	/**
	 * Removes the given key from the cache.
	 * @param key
	 */
	delete = (key: string) => {
		if (!str(key)) throw new TypeError('key must be a string');

		this.promises.delete(key);
		this.mem.delete(key);
	};

	/**
	 * Destroys the cache.
	 */
	destroy = () => {
		this.mem.clear();
		this.promises.clear();
		clearInterval(this.interval);
	};
}

const str = (v: unknown): v is string => typeof v === 'string';

const func = (v: unknown): v is string => typeof v === 'function';

// the entry is valid if it exists and has not expired (ttl=0: never expires)
const isValid = <T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> => {
	return !!entry && (entry.ttl === 0 || Date.now() < entry.exp);
};
