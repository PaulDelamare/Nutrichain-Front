<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { LotMapPin } from '$lib/types/lot-map';
	import { defaultZoomForPin } from '$lib/utils/lots/resolveLotMapLocation';

	type Props = {
		pin: LotMapPin | null;
		lotId?: string;
	};

	let { pin, lotId }: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let mapError = $state<string | null>(null);
	let mapReady = $state(false);

	onMount(() => {
		if (!browser || !container || !pin) return;

		let map: import('leaflet').Map | undefined;
		let cancelled = false;

		(async () => {
			try {
				const L = await import('leaflet');
				await import('leaflet/dist/leaflet.css');

				if (cancelled || !container) return;

				const zoom = defaultZoomForPin(pin);

				map = L.map(container, {
					zoomControl: true,
					scrollWheelZoom: false
				}).setView([pin.lat, pin.lng], zoom);

				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
					maxZoom: 19
				}).addTo(map);

				const markerHtml = pin.precise
					? '<span class="lot-pin lot-pin--precise" aria-hidden="true"></span>'
					: '<span class="lot-pin lot-pin--approx" aria-hidden="true"></span>';

				const icon = L.divIcon({
					className: 'lot-map-marker-wrap',
					html: markerHtml,
					iconSize: [28, 28],
					iconAnchor: [14, 14]
				});

				const popupLines = [
					`<strong>${escapeHtml(pin.label)}</strong>`,
					pin.sublabel ? escapeHtml(pin.sublabel) : null,
					lotId ? `Lot ${escapeHtml(lotId)}` : null,
					pin.precise ? null : '<em>Position approximative (site)</em>'
				]
					.filter(Boolean)
					.join('<br />');

				L.marker([pin.lat, pin.lng], { icon }).addTo(map).bindPopup(popupLines);

				mapReady = true;
				requestAnimationFrame(() => map?.invalidateSize());
			} catch (err) {
				mapError = err instanceof Error ? err.message : 'Impossible de charger la carte.';
			}
		})();

		return () => {
			cancelled = true;
			map?.remove();
		};
	});

	function escapeHtml(value: string): string {
		return value
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;');
	}
</script>

<div class="lot-map" class:lot-map--ready={mapReady}>
	{#if !pin}
		<div class="lot-map-empty">
			<p>Emplacement indisponible</p>
			<span>Les coordonnées GPS seront affichées dès qu'elles seront renseignées.</span>
		</div>
	{:else if mapError}
		<div class="lot-map-empty">
			<p>Carte indisponible</p>
			<span>{mapError}</span>
		</div>
	{:else}
		<div
			class="map-host"
			bind:this={container}
			role="application"
			aria-label="Carte de localisation du lot"
		></div>
		{#if !mapReady}
			<div class="lot-map-loading">Chargement de la carte…</div>
		{/if}
		{#if pin && !pin.precise}
			<p class="lot-map-hint">Position approximative — coordonnées GPS à venir.</p>
		{/if}
	{/if}
</div>

<style>
	.lot-map {
		position: relative;
		flex: 1;
		min-height: 11rem;
		border-radius: 0.375rem;
		overflow: hidden;
		border: 1px solid #e2e8f0;
		background: #f8fafc;
	}

	.map-host {
		width: 100%;
		height: 100%;
		min-height: 11rem;
	}

	.lot-map-loading {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-size: 0.8125rem;
		color: var(--nc-text-muted);
		background: rgba(248, 250, 252, 0.85);
		pointer-events: none;
	}

	.lot-map--ready .lot-map-loading {
		display: none;
	}

	.lot-map-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		height: 100%;
		min-height: 11rem;
		padding: 1rem;
		text-align: center;
	}

	.lot-map-empty p {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--nc-text);
	}

	.lot-map-empty span {
		font-size: 0.75rem;
		color: var(--nc-text-subtle);
		max-width: 14rem;
	}

	.lot-map-hint {
		position: absolute;
		left: 0.5rem;
		right: 0.5rem;
		bottom: 0.5rem;
		margin: 0;
		padding: 0.35rem 0.5rem;
		border-radius: 0.25rem;
		background: rgba(255, 255, 255, 0.92);
		font-size: 0.6875rem;
		color: var(--nc-text-muted);
		box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
		pointer-events: none;
	}

	:global(.lot-map-marker-wrap) {
		background: transparent;
		border: none;
	}

	:global(.lot-pin) {
		display: block;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 999px;
		border: 3px solid #fff;
		box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25);
	}

	:global(.lot-pin--precise) {
		background: var(--nc-brand);
	}

	:global(.lot-pin--approx) {
		background: var(--nc-text-subtle);
	}

	:global(.lot-map .leaflet-control-attribution) {
		font-size: 0.625rem;
	}
</style>
