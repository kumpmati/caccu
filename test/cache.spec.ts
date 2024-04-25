import { Caccu } from '../src/index';
import { describe, expect, it } from 'vitest';
import { sleep } from './util';

const ERR_KEY_TYPE = 'key must be a string';
const ERR_UPDATE_TYPE = 'update must be a function';

describe('cache methods', () => {
	const c = new Caccu();

	describe('.set()', () => {
		it('is public', () => {
			expect(c.set).toBeTypeOf('function');
		});

		it('throws if key is not string', () => {
			expect(() => {
				const value = { a: 1 };
				c.set(5 as any, value); // not a string
			}).toThrow();
		});

		it('adds an item to the cache', (t) => {
			const before = c.stats().items;
			const value = { a: 1 };
			c.set(t.meta.id, value);
			const after = c.stats().items;

			// number of items should have grown by 1
			expect(after - before).toBe(1);
		});

		it('returns the cached value', (t) => {
			const value = { a: 1 };
			const cachedValue = c.set(t.meta.id, value);

			const isSameReference = value === cachedValue;
			expect(isSameReference).toBe(true);
		});
	});

	describe('.get()', () => {
		it('is public', () => {
			expect(c.get).toBeTypeOf('function');
		});

		it('throws if key is not string', () => {
			expect(() => {
				c.get(5 as any); // not a string
			}).toThrow();
		});

		it('returns the previously cached value', (t) => {
			const value = { a: 1 };
			c.set(t.meta.id, value);

			const cachedValue = c.get(t.meta.id);
			const isSameReference = value === cachedValue;
			expect(isSameReference).toBe(true);
		});

		it('returns null if the value is not found', (t) => {
			const cachedValue = c.get(t.meta.id);
			expect(cachedValue).toBe(null);
		});

		it('returns an item that hasnt expired yet', async (t) => {
			const value = { a: 1 };
			c.set(t.meta.id, value, 1); // expire in 1 second

			await sleep(0.1 * 1000); // wait less than the expiry of the value

			const cachedValue = c.get(t.meta.id);
			expect(cachedValue).toBe(value);
		});

		it('does not return an expired item', async (t) => {
			const value = { a: 1 };
			c.set(t.meta.id, value, 0.1); // expire in .1 seconds

			await sleep(0.2 * 1000); // wait for value to expire

			const cachedValue = c.get(t.meta.id);
			expect(cachedValue).toBe(null);
		});
	});

	describe('.update', () => {
		it('throws if key is not string', () => {
			expect(() => {
				c.update(5 as any, 1); // not a string
			}).toThrow();
		});

		it('updates the value if an existing entry is found', (t) => {
			const value = { a: 1 };
			c.set(t.meta.id, value); // set existing entry

			const updated = { b: 2 };

			const cachedValue = c.update(t.meta.id, updated);
			expect(cachedValue === updated).toBe(true);
			expect(c.get(t.meta.id)).toBe(updated);
		});

		it('does not set the value if an existing entry is not found', (t) => {
			const cachedValue = c.update(t.meta.id, 1);
			expect(cachedValue).toBe(null);
			expect(c.get(t.meta.id)).toBeNull();
		});

		it('does not update the TTL of the existing entry', (t) => {
			c.set(t.meta.id, 'original', 1); // define TTL

			const before = c.getDetails(t.meta.id);
			c.update(t.meta.id, 'updated');
			const after = c.getDetails(t.meta.id);

			expect(before).not.toBeNull();
			expect(after).not.toBeNull();
			expect(before?.exp).toBe(after?.exp);
			expect(before?.ttl).toBe(after?.ttl);
		});
	});

	describe('.getOrUpdate()', () => {
		it('is public', () => {
			expect(c.getOrUpdate).toBeTypeOf('function');
		});

		it('throws if key is not string', () => {
			c.getOrUpdate(5 as any, Promise.resolve).catch((err) => {
				expect(err.message).toBe(ERR_KEY_TYPE);
			});
		});

		it('throws if update is not function', (t) => {
			c.getOrUpdate(t.meta.id, 5 as any).catch((err) => {
				expect(err.message).toBe(ERR_UPDATE_TYPE);
			});
		});

		it('throws if update is not defined', (t) => {
			c.getOrUpdate(t.meta.id, undefined as any).catch((err) => {
				expect(err.message).toBe(ERR_UPDATE_TYPE);
			});
		});

		it('bubbles up any error thrown inside the update function', async (t) => {
			await expect(
				c.getOrUpdate(t.meta.id, async () => {
					throw new Error(t.meta.id);
				})
			).rejects.toThrow(t.meta.id);
		});

		it('does not populate the cache if an error is thrown during update function', async (t) => {
			try {
				await c.getOrUpdate(t.meta.id, async () => {
					throw new Error(t.meta.id);
				});
			} catch (err) {
				const fromCache = c.get(t.meta.id);
				expect(fromCache).toBeNull();
			}
		});

		it('updates the value in the cache using the update function', async (t) => {
			const value = { a: 1 };
			c.set(t.meta.id, value, 0.1); // expire in .25 seconds

			const oldValue = c.get(t.meta.id);

			await sleep(200); // wait half a second

			const newValue = await c.getOrUpdate(t.meta.id, async () => {
				return { b: 2 };
			});

			const afterUpdate = c.get(t.meta.id);

			expect(oldValue === newValue).toBe(false); // should be different
			expect(newValue === afterUpdate).toBe(true); // should be same reference
		});

		it('receives the cached value if not expired', async (t) => {
			const value = { a: 1 };
			c.set(t.meta.id, value, 0.25); // expire in .25 seconds

			const oldValue = c.get(t.meta.id);

			await sleep(100); // wait 250ms

			const newValue = await c.getOrUpdate(t.meta.id, async () => {
				return { b: 2 };
			});

			expect(oldValue).toBe(newValue);
		});

		it('receives the correct arguments in the update function', async (t) => {
			const TTL = 0.1;

			const a = await c.getOrUpdate(
				t.meta.id,
				async ({ key, ttl, prev }) => {
					expect(key).toBe(t.meta.id);
					expect(ttl).toBe(TTL);
					expect(prev).toBeNull();

					return 'a';
				},
				TTL
			);

			await sleep(200); // wait until entry has expired

			const b = await c.getOrUpdate(
				t.meta.id,
				async ({ prev }) => {
					expect(prev).toBe('a');

					return 'b';
				},
				TTL
			);

			expect(a).toBe('a');
			expect(b).toBe('b');
		});
	});

	describe('.has()', () => {
		it('is defined', () => {
			expect(c.has).toBeTypeOf('function');
		});

		it('returns false if the item does not exist', (t) => {
			const exists = c.has(t.meta.id);
			expect(exists).toBe(false);
		});

		it('returns true if the item exists', (t) => {
			c.set(t.meta.id, 'value');
			const exists = c.has(t.meta.id);
			expect(exists).toBe(true);
		});
	});

	describe('.delete()', () => {
		it('is public', () => {
			expect(c.delete).toBeTypeOf('function');
		});

		it('deletes an existing item', (t) => {
			c.set(t.meta.id, 'value');
			c.delete(t.meta.id);

			const value = c.get(t.meta.id);
			expect(value).toBe(null);
		});
	});

	describe('.destroy()', () => {
		it('clears the cache memory', async (t) => {
			c.set(t.meta.id, { a: 1 });
			c.set(t.meta.id + '1', { a: 1 });

			// clear memory
			c.destroy();

			expect(c.stats().items).toBe(0);
		});
	});

	describe('.stats()', () => {
		it('is public', () => {
			expect(c.stats).toBeTypeOf('function');
		});

		it('returns the stats', () => {
			const stats = c.stats();

			expect(stats.hits).toBeTypeOf('number');
			expect(stats.misses).toBeTypeOf('number');
			expect(stats.items).toBeTypeOf('number');
		});

		it('should increment the hits in case of a hit', (t) => {
			const before = c.stats().hits;
			c.set(t.meta.id, 'value');
			c.get(t.meta.id);
			const after = c.stats().hits;

			expect(after - before).toBe(1);
		});

		it('should increment the misses in case of a miss', (t) => {
			const before = c.stats().misses;
			c.get(t.meta.id);
			const after = c.stats().misses;

			expect(after - before).toBe(1);
		});
	});
});
