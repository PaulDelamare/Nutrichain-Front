<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import PageHead from '$lib/components/page/PageHead.svelte';
	import BarcodeScanner from '$lib/components/scan/BarcodeScanner.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let manual = $state('');
	let pending = $state(false);

	$effect(() => {
		if (form?.code) manual = form.code;
	});

	function onDetect(code: string) {
		manual = code;
		const formEl = document.getElementById('scan-resolve') as HTMLFormElement | null;
		formEl?.requestSubmit();
	}
</script>

<PageHead
	heading="Scan de code-barres"
	description="Scannez un numéro de lot GS1 (ou un GTIN) pour ouvrir la fiche via l’API."
/>

<div class="layout">
	<section class="panel">
		<h3>Caméra</h3>
		<BarcodeScanner ondetect={onDetect} />

		<form
			id="scan-resolve"
			method="POST"
			action="?/resolve"
			class="manual"
			use:enhance={() => {
				pending = true;
				return async ({ update }) => {
					pending = false;
					await update();
				};
			}}
		>
			<label for="code">Saisie manuelle</label>
			<div class="row">
				<input
					id="code"
					name="code"
					type="text"
					placeholder="N° de lot ou GTIN"
					bind:value={manual}
					autocomplete="off"
					required
				/>
				<button type="submit" class="btn" disabled={pending}>
					{pending ? 'Recherche…' : 'Rechercher'}
				</button>
			</div>
		</form>
	</section>

	<section class="panel">
		<h3>Résultat</h3>
		{#if form?.resolveError}
			<p class="empty">{form.resolveError}</p>
		{:else}
			<p class="empty">Scannez ou saisissez un code pour ouvrir la fiche lot.</p>
		{/if}

		{#if form?.candidates?.length}
			<ul class="hits">
				{#each form.candidates as lot (lot.id)}
					<li class="hit">
						<div>
							<p class="hit-produit">{lot.produit}</p>
							<p class="hit-meta">Lot {lot.lotNumber} · GTIN {lot.gtin}</p>
						</div>
						<a
							class="btn"
							href={resolve('/(app)/fiche-lot/[lotId]', {
								lotId: encodeURIComponent(lot.id)
							})}
						>
							Ouvrir
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}

	.panel {
		padding: 1rem 1.25rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.panel h3 {
		margin: 0 0 0.75rem;
		font-size: 0.9375rem;
	}

	.manual {
		margin-top: 1rem;
	}

	.manual label {
		display: block;
		margin-bottom: 0.35rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--nc-text-muted);
	}

	.row {
		display: flex;
		gap: 0.5rem;
	}

	.row input {
		flex: 1;
		padding: 0.45rem 0.55rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.btn {
		padding: 0.45rem 0.75rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
		white-space: nowrap;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.empty {
		margin: 0;
		font-size: 0.875rem;
		color: var(--nc-text-muted);
	}

	.hits {
		margin: 0.75rem 0 0;
		padding: 0;
		list-style: none;
	}

	.hit {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0;
		border-top: 1px solid #f1f5f9;
	}

	.hit-produit {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.hit-meta {
		margin: 0.15rem 0 0;
		font-size: 0.75rem;
		color: var(--nc-text-muted);
	}
</style>
