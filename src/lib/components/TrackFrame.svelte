<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TrackFlex } from '$lib/ui/types';

	let { track, children }: { track: TrackFlex; children: Snippet } = $props();
</script>

<div class="track-frame" data-track={track}>
	{@render children()}
</div>

<style>
	.track-frame[data-track='learn'] {
		--track-font-family: var(--font-rounded);
		--track-font-size: 1.875rem;
	}

	.track-frame[data-track='speed-test-practice'] {
		--track-font-family: var(--font-mono);
		--track-font-size: 1.0625rem;
	}
</style>
