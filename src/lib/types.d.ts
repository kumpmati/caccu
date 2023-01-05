type CaccuOpts = {
	/**
	 * How often (milliseconds) to delete expired items from the cache.
	 * default: 3600000 (1 hour)
	 */
	cleanupInterval?: number;
};

type CacheEntry<T = any> = {
	val: T;
	exp: number;
	ttl: number;
};

type UpdateFunc<T> = () => Promise<T>;

type Stats = {
	hits: number;
	misses: number;
	items: number;
};
