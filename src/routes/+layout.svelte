<script lang="ts">
	import '@fontsource/fredoka/latin-600.css';
	import '@fontsource/fredoka/latin-700.css';
	import '@fontsource/nunito/latin-400.css';
	import '@fontsource/nunito/latin-600.css';
	import '@fontsource/nunito/latin-700.css';
	import '@fontsource/nunito/latin-800.css';
	import '../app.css';
	import { page } from '$app/state';
	import CornerFurniture from '$lib/components/CornerFurniture.svelte';

	let { children, data } = $props();
	// The mute toggle and grown-ups link are Player-facing controls with nothing to do
	// in the internal admin area.
	let isAdminRoute = $derived(page.url.pathname.startsWith('/admin'));
</script>

{#if !isAdminRoute}
	<CornerFurniture initialMuted={data.muted} />
{/if}
{@render children()}
