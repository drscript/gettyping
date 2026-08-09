<script lang="ts">
	import '@fontsource/fredoka/latin-600.css';
	import '@fontsource/fredoka/latin-700.css';
	import '@fontsource/nunito/latin-400.css';
	import '@fontsource/nunito/latin-600.css';
	import '@fontsource/nunito/latin-700.css';
	import '@fontsource/nunito/latin-800.css';
	import '../app.css';
	import CornerFurniture from '$lib/components/CornerFurniture.svelte';

	let { children, data } = $props();
</script>

<CornerFurniture initialMuted={data.muted} />
{@render children()}
