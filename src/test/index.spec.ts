import CaccuDefaultExport, { Caccu as CaccuNamedExport } from '$lib';
import { describe, expect, it } from 'vitest';

describe('exports & general', () => {
	it('is exported as default', () => {
		expect(CaccuDefaultExport).toBeDefined();
	});

	it('is exported as named export', () => {
		expect(CaccuNamedExport).toBeDefined();
	});

	it('is created successfully with no options', () => {
		const c = new CaccuDefaultExport();

		expect(c).toBeInstanceOf(CaccuDefaultExport);
	});

	it('is created successfully with cleanupInterval', () => {
		const c = new CaccuDefaultExport({ cleanupInterval: 1000 });
		expect(c).toBeInstanceOf(CaccuDefaultExport);
	});

	it('throws if cleanupInterval is <= 0', () => {
		expect(() => {
			new CaccuDefaultExport({ cleanupInterval: 0 });
		}).toThrow();
	});
});
