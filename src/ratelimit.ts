import { Caccu } from './cache';

/**
 * If this function returns true, the given key has exceeded the
 * configured rate limit and should be prevented from making any more requests.
 */
export type LimiterFunc = (key: string) => boolean;

export type FixedWindowOptions = {
	limit: number;
	interval: number;
};

export type SlidingWindowOptions = {
	limit: number;
	interval: number;
};

/**
 * Wrapper class to use in rate limiting cases
 */
export class Limiter {
	private cache: Caccu;

	/**
	 *
	 * @param cache optional Caccu
	 */
	constructor(cache?: Caccu) {
		this.cache = cache ?? new Caccu();
	}

	/**
	 * Returns a function that can be used for rate limiting using a fixed window algorithm.
	 *
	 * @param limit Max number of calls allowed for each key before hitting the limit
	 * @param interval interval in seconds when to reset the usage
	 * @returns limiter function
	 */
	public fixedWindow = (opts: FixedWindowOptions) => {
		/**
		 * Each call to this function will increment the current usage associated with the given `key`.
		 */
		return (key: string) => {
			const usage = (this.cache.get<number>(key) ?? 0) + 1;

			if (usage > opts.limit) {
				return true;
			}

			if (this.cache.has(key)) {
				this.cache.update(key, usage);
			} else {
				this.cache.set(key, usage, opts.interval);
			}

			return false;
		};
	};

	/**
	 * Returns a function that can be used for rate limiting using a sliding window algorithm.
	 *
	 * @param limit Max number of calls allowed for each key before hitting the limit
	 * @param interval length of the window in seconds
	 * @returns limiter function
	 */
	public slidingWindow = (opts: SlidingWindowOptions) => {
		return (key: string) => {
			const timestamps = this.cache.get<number[]>(key) ?? [];

			// filter out expired timestamps before checking limit
			const validTimestamps = timestamps.filter((t) => t + opts.interval * 1000 < Date.now());
			validTimestamps.push(Date.now());

			if (validTimestamps.length > opts.limit) {
				return true;
			}

			this.cache.set(key, validTimestamps, opts.interval * 2); // expire after 2x the length of the window has passed

			return false;
		};
	};
}
