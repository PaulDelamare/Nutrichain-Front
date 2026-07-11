<script lang="ts">
	import { syncLabel } from '$lib/utils/integration/syncLabel';
	import type { SyncState } from '$lib/types/integration';

	type Props = {
		statut: SyncState;
	};

	let { statut }: Props = $props();
</script>

<span class="badge" class:ok={statut === 'ok'} class:latence={statut === 'latence'}>
	{syncLabel(statut)}
</span>

<style>
	.badge {
		display: inline-block;
		padding: 0.2rem 0.55rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.ok {
		background: #dcfce7;
		color: var(--nc-brand-dark);
	}

	.latence {
		background: #fef9c3;
		color: #854d0e;
	}
</style>
