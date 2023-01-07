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

export type UpdateFunc<T> = () => Promise<T>;

export type Stats = {
	hits: number;
	misses: number;
	items: number;
};
