<script lang="ts">
	import { ncStatusLabel } from '$lib/utils/nc/statusLabel';
	import type { NcStatus } from '$lib/types/nc';

	type Props = {
		statut: NcStatus;
	};

	let { statut }: Props = $props();
</script>

<span
	class="badge"
	class:en_cours={statut === 'en_cours'}
	class:quarantaine={statut === 'quarantaine'}
>
	{ncStatusLabel(statut)}
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

	.quarantaine {
		background: #fee2e2;
		color: #991b1b;
	}
</style>
