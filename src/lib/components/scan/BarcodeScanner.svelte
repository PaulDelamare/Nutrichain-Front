<script lang="ts">
	import { onDestroy } from 'svelte';

	type Props = {
		ondetect: (code: string) => void;
	};

	let { ondetect }: Props = $props();

	const FORMATS = ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'];

	const supported = $derived(
		typeof window !== 'undefined' &&
			'BarcodeDetector' in window &&
			!!navigator.mediaDevices?.getUserMedia
	);

	let active = $state(false);
	let error = $state<string | null>(null);
	let video = $state<HTMLVideoElement | null>(null);

	let stream: MediaStream | null = null;
	let detector: BarcodeDetector | null = null;
	let rafId: number | null = null;

	async function start() {
		error = null;

		if (!supported || !window.BarcodeDetector) {
			error =
				"La détection caméra n'est pas supportée par ce navigateur. Utilisez la saisie manuelle.";
			return;
		}

		try {
			detector = new window.BarcodeDetector({ formats: FORMATS });
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' }
			});

			active = true;

			// Attendre que l'élément <video> soit rendu (active déclenche le bloc {#if}).
			await Promise.resolve();
			if (video) {
				video.srcObject = stream;
				await video.play();
				loop();
			}
		} catch (e) {
			active = false;
			error =
				e instanceof DOMException && e.name === 'NotAllowedError'
					? 'Accès caméra refusé. Autorisez la caméra ou utilisez la saisie manuelle.'
					: 'Impossible de démarrer la caméra. Utilisez la saisie manuelle.';
			stop();
		}
	}

	async function loop() {
		if (!active || !detector || !video) return;

		try {
			const codes = await detector.detect(video);
			if (codes.length > 0 && codes[0].rawValue) {
				const value = codes[0].rawValue.trim();
				stop();
				ondetect(value);
				return;
			}
		} catch {
			// Une frame illisible ne doit pas interrompre la boucle.
		}

		rafId = requestAnimationFrame(loop);
	}

	function stop() {
		active = false;
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		if (stream) {
			stream.getTracks().forEach((t) => t.stop());
			stream = null;
		}
		if (video) video.srcObject = null;
	}

	onDestroy(stop);
</script>

<div class="scanner">
	{#if active}
		<div class="viewport">
			<video bind:this={video} playsinline></video>
			<div class="reticle" aria-hidden="true"></div>
		</div>
		<button type="button" class="ghost btn" onclick={stop}>Arrêter la caméra</button>
	{:else}
		<button type="button" class="btn" onclick={start} disabled={!supported}>
			Démarrer le scan caméra
		</button>
		{#if !supported}
			<p class="hint">
				Détection caméra indisponible sur ce navigateur — la saisie manuelle reste possible
				ci-dessous.
			</p>
		{/if}
	{/if}

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}
</div>

<style>
	.scanner {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.viewport {
		position: relative;
		width: 100%;
		max-width: 28rem;
		aspect-ratio: 4 / 3;
		border-radius: 0.5rem;
		overflow: hidden;
		background: #0f172a;
	}

	.viewport video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.reticle {
		position: absolute;
		inset: 18% 12%;
		border: 2px solid var(--nc-brand-light);
		border-radius: 0.5rem;
		box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.35);
	}

	.btn {
		align-self: flex-start;
		padding: 0.55rem 1.1rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn:hover:not(:disabled) {
		background: var(--nc-brand-hover);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn.ghost {
		background: #fff;
		color: var(--nc-text);
		border: 1px solid #e2e8f0;
	}

	.hint {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
	}

	.error {
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		background: #fee2e2;
		color: #991b1b;
		font-size: 0.8125rem;
	}
</style>
