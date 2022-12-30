<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

{#each data.items as item}
	<li>{item}</li>
{/each}
