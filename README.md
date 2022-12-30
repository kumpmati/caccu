# Caccu

**This package is in a very early stage**

Caccu is a small in-memory cache that works in both Node.js and in a browser. It has no dependencies.

## Examples

Here's a basic example of how to create a cache, write to it and read from it.

```js
import { Caccu } from 'caccu';

const cache = new Caccu();

// add an entry to the cache with the key `key-1`, that never expires.
cache.set('key-1', { a: 5 });

// retrieve the value from the cache
const value = cache.get('key-1');
```

You can optionally define a TTL (time to live) for the entries
to automatically remove them from the cache after a certain period of timer.

```js
// add an entry to the cache that will expire in 10 seconds
cache.set('key-2', { b: 5 }, 10);

const value1 = cache.get('key-2');
console.log(value1); // { b: 5 }

// wait 11 seconds before attempting to retrieve
setTimeout(() => {
	const value2 = cache.get('key-2');
	console.log(value2); // null
}, 1000 * 11);
```

There is also a `getOrUpdate` function that automatically updates the cache if the key is not found.
It also prevents multiple simultaneous updates of the same key.

```js
// example of using the `getOrUpdate` function in an express handler
const myHandler: RequestHandler = async (req, res, next) => {
	const update = async () => {
		return expensiveDatabaseCall();
	};

	const value = await cache.getOrUpdate('key-3', update, 10);

	return res.status(200).json(value);
};
```
