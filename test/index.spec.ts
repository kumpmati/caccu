import { Caccu } from '../src/index';
import { describe, expect, it } from 'vitest';

describe('exports & general', () => {
	it('is exported as named export', () => {
		expect(Caccu).toBeDefined();
	});

	it('is created successfully with no options', () => {
		const c = new Caccu();

		expect(c).toBeInstanceOf(Caccu);
	});

	it('is created successfully with cleanupInterval', () => {
		const c = new Caccu({ cleanupInterval: 1000 });
		expect(c).toBeInstanceOf(Caccu);
	});

	it('throws if cleanupInterval is <= 0', () => {
		expect(() => {
			new Caccu({ cleanupInterval: 0 });
		}).toThrow();
	});
});
