<script lang="ts">
	import { recallStatusLabel } from '$lib/utils/recall/statusLabel';
	import type { RecallStatus } from '$lib/types/recall';

	type Props = {
		statut: RecallStatus;
	};

	let { statut }: Props = $props();
</script>

<span class="badge" class:en_cours={statut === 'en_cours'} class:cloture={statut === 'cloture'}>
	{recallStatusLabel(statut)}
</span>

<style>
	.badge {
		display: inline-block;
		padding: 0.2rem 0.55rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.en_cours {
		background: #fef9c3;
		color: #854d0e;
	}

	.cloture {
		background: #e2e8f0;
		color: var(--nc-text-muted);
	}
</style>
