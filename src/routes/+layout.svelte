<script lang="ts">
	import '@fontsource/baloo-2/latin-600.css';
	import '../app.css';
	import CornerFurniture from '$lib/components/CornerFurniture.svelte';

	let { children } = $props();
</script>

<CornerFurniture />
{@render children()}
