import type { ServerLoad } from '@sveltejs/kit';
import { Caccu } from '../lib';

const cache = new Caccu({ cleanupInterval: 1000 });

export const load: ServerLoad = async () => {
	return {
		items: await cache.getOrUpdate('key', expensiveDatabaseCall, 20)
	};
};

const expensiveDatabaseCall = async (): Promise<number[]> => {
	return new Promise((resolve) => {
		setTimeout(() => resolve([1, 2, 3, 4, 5]), 5 * 1000);
	});
};
