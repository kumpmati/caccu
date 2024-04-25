export type CaccuOpts = {
	/**
	 * How often (milliseconds) to delete expired items from the cache.
	 * default: 3600000 (1 hour)
	 */
	cleanupInterval?: number;
};

export type CacheEntry<T = any> = {
	val: T;
	exp: number;
	ttl: number;
};

export type UpdateFuncArgs<T> = {
	/**
	 * Key used to store the entry.
	 */
	key: string;

	/**
	 * The TTL number given to `.getOrUpdate`
	 */
	ttl: number;

	/**
	 * Previous value of the cached entry, if it has one. Always `null` on the first update.
	 *
	 * **Note that the previous value cannot be guaranteed to always exist, since
	 * the cache purges expired values occasionally.**
	 */
	prev: T | null;
};

export type UpdateFunc<T> = (args: UpdateFuncArgs<T>) => Promise<T>;

export type Stats = {
	hits: number;
	misses: number;
	items: number;
};
