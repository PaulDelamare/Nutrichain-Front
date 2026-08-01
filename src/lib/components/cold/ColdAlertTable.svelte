<script lang="ts">
	import { resolve } from '$app/paths';
	import ColdStatusBadge from './ColdStatusBadge.svelte';
	import ActionReservee from '$lib/components/ui/ActionReservee.svelte';
	import { peutDeciderQualite, type KnownRole } from '$lib/config/roles';
	import type { ColdAlertRow } from '$lib/types/cold';

	type ResolveFeedback = {
		resolved?: boolean;
		resolveError?: string;
		alertId?: string;
	};

	type Props = {
		rows: ColdAlertRow[];
		role: KnownRole;
		form?: ResolveFeedback | null;
	};

	let { rows, role, form = null }: Props = $props();

	const peutCloturer = $derived(peutDeciderQualite(role));
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th>ID</th>
				<th>Site</th>
				<th>Zone</th>
				<th>Temp. actuelle</th>
				<th>Lots impactés</th>
				<th>Depuis</th>
				<th>Statut</th>
				<th>Action</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.alertId)}
				<tr>
					<td class="id">{row.id}</td>
					<td>{row.site}</td>
					<td>{row.zone}</td>
					<td>{row.tempActuelle}</td>
					<td class="lots">
						{#if row.lotsImpactes.length === 0}
							<span class="none">—</span>
						{:else}
							<!-- Une liste, pas une suite de `span` : plusieurs lots du même produit se lisaient
							     « Bouteille de Lait 1L Bouteille de Lait 1L », collés et indiscernables. -->
							<ul class="lots-list">
								{#each row.lotsImpactes as lot (lot.id)}
									<li class="lot">
										<a
											href={resolve('/(app)/fiche-lot/[lotId]', {
												lotId: encodeURIComponent(lot.id)
											})}
										>
											{lot.produit} — {lot.numeroLot}
										</a>
										{#if !lot.levable}
											<span
												class="blocked"
												title={lot.motifBlocage
													? `Non levable — ${lot.motifBlocage}`
													: 'Non levable via cette alerte'}
											>
												non levable{#if lot.motifBlocage}
													({lot.motifBlocage}){/if}
											</span>
										{/if}
									</li>
								{/each}
							</ul>
						{/if}
					</td>
					<td>{row.depuis}</td>
					<td><ColdStatusBadge statut={row.statut} /></td>
					<td class="action">
						{#if peutCloturer}
							<form method="POST" action="?/resolve" class="resolve">
								<input type="hidden" name="alertId" value={row.alertId} />
								<input
									type="text"
									name="note"
									placeholder="Motif de clôture"
									required
									minlength="3"
									maxlength="500"
									aria-label="Motif de clôture pour {row.id}"
								/>
								<button type="submit">Clôturer</button>
							</form>
						{/if}
						{#if form?.resolved && form.alertId === row.alertId}
							<p class="feedback ok" role="status">Alerte clôturée.</p>
						{:else if form?.resolveError && form.alertId === row.alertId}
							<p class="feedback err" role="status">{form.resolveError}</p>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if !peutCloturer && rows.length > 0}
	<ActionReservee action="La clôture d'une alerte froid" {role} />
{/if}

<style>
	.table-wrap {
		overflow-x: auto;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	th {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e2e8f0;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--nc-text-muted);
		background: #f8fafc;
		white-space: nowrap;
	}

	td {
		padding: 0.875rem 1rem;
		border-bottom: 1px solid #f1f5f9;
		color: var(--nc-text-muted);
		vertical-align: middle;
	}

	tr:last-child td {
		border-bottom: none;
	}

	.id {
		font-weight: 500;
		color: var(--nc-text);
	}

	.lots {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	/* Une ligne par lot : côte à côte, deux lots du même produit se lisaient comme un seul libellé. */
	.lots-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.lot {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem;
	}

	.lots a {
		color: var(--nc-brand);
		text-decoration: none;
		font-weight: 500;
	}

	.lots a:hover {
		text-decoration: underline;
	}

	.blocked {
		font-size: 0.75rem;
		color: #b45309;
	}

	.none {
		color: var(--nc-text-subtle);
	}

	.action {
		min-width: 14rem;
	}

	.resolve {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: center;
	}

	.resolve input {
		flex: 1 1 8rem;
		min-width: 0;
		padding: 0.35rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
	}

	.resolve button {
		padding: 0.35rem 0.7rem;
		border: none;
		border-radius: 0.375rem;
		background: var(--nc-brand-dark);
		color: #fff;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
	}

	.resolve button:hover {
		background: var(--nc-brand-hover);
	}

	.feedback {
		margin: 0.35rem 0 0;
		font-size: 0.75rem;
	}

	.feedback.ok {
		color: #166534;
	}

	.feedback.err {
		color: #b91c1c;
	}
</style>
