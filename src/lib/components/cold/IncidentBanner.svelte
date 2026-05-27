<script lang="ts">
	import type { ColdIncident } from '$lib/types/cold';

	type Props = {
		incident: ColdIncident;
	};

	let { incident }: Props = $props();
</script>

<div class="banner" role="alert">
	<span class="icon" aria-hidden="true">⚠</span>
	<p>
		<strong>Incident {incident.id}</strong>
		— {incident.message}
	</p>
</div>

<style>
	.banner {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		margin-bottom: 1rem;
		padding: 0.875rem 1rem;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		background: #fef2f2;
	}

	.icon {
		font-size: 1rem;
		line-height: 1.4;
	}

	.banner p {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.45;
		color: #7f1d1d;
	}

	.banner strong {
		font-weight: 600;
		color: #991b1b;
	}
</style>
