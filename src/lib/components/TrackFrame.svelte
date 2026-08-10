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
		--track-font-size: clamp(1.9rem, 5vw, 2.7rem);
	}

	.track-frame[data-track='speed-test-practice'] {
		--track-font-family: var(--font-mono);
		--track-font-size: clamp(1.05rem, 2.4vw, 1.35rem);
	}
</style>
