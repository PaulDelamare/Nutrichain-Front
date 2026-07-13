<script lang="ts">
	import { lotStatusLabel } from '$lib/utils/lots/lotStatusLabel';
	import type { LotStatus } from '$lib/types/lot';

	type Props = {
		statut: LotStatus;
	};

	let { statut }: Props = $props();
</script>

<span
	class="badge"
	class:conforme={statut === 'conforme'}
	class:attente={statut === 'attente_qc'}
	class:surveillance={statut === 'surveillance'}
	class:quarantaine={statut === 'quarantaine'}
	class:perime={statut === 'perime'}
	class:neutre={statut === 'expedie' || statut === 'inconnu'}
>
	{lotStatusLabel(statut)}
</span>

<style>
	.badge {
		display: inline-block;
		padding: 0.2rem 0.55rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.conforme {
		background: #dcfce7;
		color: var(--nc-brand-dark);
	}

	.attente {
		background: #e0e7ff;
		color: #3730a3;
	}

	.surveillance {
		background: #fef9c3;
		color: #854d0e;
	}

	.quarantaine {
		background: #fee2e2;
		color: #991b1b;
	}

	.perime {
		background: #fee2e2;
		color: #7f1d1d;
	}

	.neutre {
		background: #e2e8f0;
		color: #475569;
	}
</style>
