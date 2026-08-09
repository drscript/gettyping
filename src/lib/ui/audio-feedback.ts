import { get } from 'svelte/store';
import { mutePreference } from './mute-preference';

let audioContext: AudioContext | undefined;

function contextForPlayback(): AudioContext | undefined {
	if (typeof window === 'undefined' || get(mutePreference) || !('AudioContext' in window)) {
		return undefined;
	}

	try {
		audioContext ??= new AudioContext();
		if (audioContext.state === 'suspended') void audioContext.resume().catch(() => undefined);
		return audioContext;
	} catch {
		return undefined;
	}
}

function playErrorTick(accuracyHighWater: number): void {
	const context = contextForPlayback();
	if (!context) return;

	try {
		const now = context.currentTime;
		const oscillator = context.createOscillator();
		const gain = context.createGain();
		const attenuation = 1 - Math.min(1, Math.max(0, accuracyHighWater)) * 0.55;
		oscillator.type = 'triangle';
		oscillator.frequency.setValueAtTime(190, now);
		gain.gain.setValueAtTime(0.018 * attenuation, now);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
		oscillator.connect(gain).connect(context.destination);
		oscillator.start(now);
		oscillator.stop(now + 0.035);
	} catch {
		// Sound is strictly redundant; a blocked or unavailable context changes nothing visible.
	}
}

export function createAttemptAudioFeedback() {
	let accuracyHighWater = 0;

	return {
		recordKey(correct: boolean, accuracy: number): void {
			accuracyHighWater = Math.max(accuracyHighWater, accuracy);
			if (!correct) playErrorTick(accuracyHighWater);
		}
	};
}

export function playCompletionSound(): void {
	const context = contextForPlayback();
	if (!context) return;

	try {
		const now = context.currentTime;
		for (const [frequency, delay] of [
			[392, 0],
			[523.25, 0.07]
		] as const) {
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			oscillator.type = 'sine';
			oscillator.frequency.setValueAtTime(frequency, now + delay);
			gain.gain.setValueAtTime(0.0001, now + delay);
			gain.gain.linearRampToValueAtTime(0.035, now + delay + 0.012);
			gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.16);
			oscillator.connect(gain).connect(context.destination);
			oscillator.start(now + delay);
			oscillator.stop(now + delay + 0.16);
		}
	} catch {
		// Completion is already fully expressed by the visible result state.
	}
}
