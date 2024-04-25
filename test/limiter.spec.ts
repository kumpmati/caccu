import { describe, expect, it } from 'vitest';
import { Limiter } from '../src/ratelimit';
import { sleep } from './util';

describe('limiter methods', () => {
	const l = new Limiter();

	describe('.fixedWindow', () => {
		it('should limit within the window', async () => {
			const limit = l.fixedWindow({ limit: 10, interval: 1 }); // 10 requests per second

			for (let i = 0; i < 10; i++) {
				limit('a');
			}

			for (let i = 0; i < 9; i++) {
				limit('b');
			}

			expect(limit('a')).toBe(true);
			expect(limit('b')).toBe(false);

			await sleep(1100);

			// should have reset after window interval
			expect(limit('a')).toBe(false);
		});
	});

	describe('.slidingWindow', () => {
		it.todo('should limit within the window', async () => {
			//
		});
	});
});
