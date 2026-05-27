<script lang="ts">
	import RecallStatusBadge from './RecallStatusBadge.svelte';
	import type { Recall } from '$lib/types/recall';

	type Props = {
		recall: Recall;
		onnotify?: () => void;
	};

	let { recall, onnotify }: Props = $props();
</script>

<article class="card">
	<div class="head">
		<h3>{recall.id} — {recall.produit}</h3>
		<RecallStatusBadge statut={recall.statut} />
	</div>

	<p class="meta"><span>Lots :</span> {recall.lots}</p>
	<p class="meta"><span>Sites impactés :</span> {recall.sites}</p>

	<div class="progress-block">
		<div class="progress-head">
			<span>{recall.progressLabel}</span>
			<span class="pct">{recall.progress} %</span>
		</div>
		<div class="track" role="progressbar" aria-valuenow={recall.progress} aria-valuemin="0" aria-valuemax="100">
			<div class="fill" style="width: {recall.progress}%"></div>
		</div>
	</div>

	<div class="step">
		<span class="dot" aria-hidden="true"></span>
		<div>
			<p class="step-label">{recall.etape}</p>
			<p class="step-title">{recall.etapeTitre}</p>
			<p class="step-detail">{recall.etapeDetail}</p>
		</div>
	</div>

	<button type="button" class="notify" onclick={onnotify}>Notifier relance</button>
</article>

<style>
	.card {
		max-width: 40rem;
		padding: 1.25rem 1.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
	}

	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.head h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #0f172a;
	}

	.meta {
		margin: 0 0 0.35rem;
		font-size: 0.875rem;
		color: #334155;
	}

	.meta span {
		color: #64748b;
	}

	.progress-block {
		margin: 1rem 0;
	}

	.progress-head {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.35rem;
		font-size: 0.8125rem;
		color: #64748b;
	}

	.pct {
		font-weight: 600;
		color: #0f172a;
	}

	.track {
		height: 0.5rem;
		border-radius: 9999px;
		background: #e2e8f0;
		overflow: hidden;
	}

	.fill {
		height: 100%;
		border-radius: 9999px;
		background: #1a4d3e;
	}

	.step {
		display: flex;
		gap: 0.625rem;
		margin-bottom: 1.25rem;
	}

	.dot {
		width: 0.5rem;
		height: 0.5rem;
		margin-top: 0.35rem;
		border-radius: 50%;
		background: #22c55e;
		flex-shrink: 0;
	}

	.step-label {
		margin: 0 0 0.15rem;
		font-size: 0.75rem;
		color: #64748b;
	}

	.step-title {
		margin: 0 0 0.15rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #0f172a;
	}

	.step-detail {
		margin: 0;
		font-size: 0.8125rem;
		color: #64748b;
	}

	.notify {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.375rem;
		background: #1a4d3e;
		color: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.notify:hover {
		background: #163f33;
	}
</style>
