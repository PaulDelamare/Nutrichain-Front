<script lang="ts">
	import { coldStatusLabel } from '$lib/utils/cold/statusLabel';
	import type { ColdAlertStatus } from '$lib/types/cold';

	type Props = {
		statut: ColdAlertStatus;
	};

	let { statut }: Props = $props();
</script>

<span class="badge" class:critique={statut === 'critique'} class:investigation={statut === 'investigation'}>
	{coldStatusLabel(statut)}
</span>

<style>
	.badge {
		display: inline-block;
		padding: 0.2rem 0.55rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.critique {
		background: #fee2e2;
		color: #991b1b;
	}

	.investigation {
		background: #fef9c3;
		color: #854d0e;
	}
</style>
