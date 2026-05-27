<script lang="ts">
	import { page } from '$app/stores';
	import { APP_FOOTER, APP_NAME, APP_TAGLINE } from '$lib/config/app';
	import { navGroups } from '$lib/config/nav';

	type Props = {
		collapsed?: boolean;
		ontoggle?: () => void;
	};

	let { collapsed = false, ontoggle }: Props = $props();

	function isActive(href: string, pathname: string): boolean {
		return pathname === href || pathname.startsWith(`${href}/`);
	}
</script>

<aside class="sidenav" class:collapsed>
	<div class="sidenav-brand">
		<div class="logo" aria-hidden="true">N</div>
		{#if !collapsed}
			<div class="brand-text">
				<span class="brand-name">{APP_NAME}</span>
				<span class="brand-tag">{APP_TAGLINE}</span>
			</div>
		{/if}
	</div>

	<nav class="sidenav-nav">
		{#each navGroups as group}
			{#if !collapsed}
				<p class="group-label">{group.label}</p>
			{/if}
			<ul class="group-list">
				{#each group.items as item}
					<li>
						<a
							href={item.href}
							class="nav-link"
							class:active={isActive(item.href, $page.url.pathname)}
							title={collapsed ? item.label : undefined}
						>
							{#if collapsed}
								<span class="nav-abbr">{item.label.slice(0, 1)}</span>
							{:else}
								{item.label}
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/each}
	</nav>

	<div class="sidenav-foot">
		{#if !collapsed}
			<p class="version">{APP_FOOTER}</p>
		{/if}
		<button type="button" class="toggle" onclick={ontoggle} aria-label={collapsed ? 'Ouvrir le menu' : 'Replier le menu'}>
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d={collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</div>
</aside>

<style>
	.sidenav {
		display: flex;
		flex-direction: column;
		width: 15.5rem;
		min-height: 100vh;
		background: #1a2332;
		color: #cbd5e1;
		transition: width 0.2s ease;
		flex-shrink: 0;
	}

	.sidenav.collapsed {
		width: 4.25rem;
	}

	.sidenav-brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1.25rem 1rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.logo {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		background: #22c55e;
		color: #fff;
		font-weight: 700;
		font-size: 1.125rem;
		flex-shrink: 0;
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.brand-name {
		font-weight: 600;
		font-size: 0.9375rem;
		color: #f8fafc;
	}

	.brand-tag {
		font-size: 0.6875rem;
		color: #94a3b8;
	}

	.sidenav-nav {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem 0.5rem 1rem;
	}

	.group-label {
		margin: 1rem 0.5rem 0.35rem;
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #64748b;
	}

	.group-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.nav-link {
		display: block;
		margin: 0.125rem 0;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		color: #cbd5e1;
		text-decoration: none;
		transition: background 0.15s, color 0.15s;
	}

	.nav-link:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #f8fafc;
	}

	.nav-link.active {
		background: rgba(34, 197, 94, 0.15);
		color: #4ade80;
	}

	.collapsed .nav-link {
		text-align: center;
		padding: 0.5rem;
	}

	.nav-abbr {
		font-weight: 600;
		text-transform: uppercase;
	}

	.sidenav-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.75rem 1rem 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.version {
		margin: 0;
		font-size: 0.625rem;
		line-height: 1.4;
		color: #64748b;
	}

	.toggle {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		margin-left: auto;
		border: none;
		border-radius: 0.375rem;
		background: rgba(255, 255, 255, 0.06);
		color: #94a3b8;
		cursor: pointer;
		flex-shrink: 0;
	}

	.toggle:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #e2e8f0;
	}

	.toggle svg {
		width: 1rem;
		height: 1rem;
	}

	.collapsed .sidenav-foot {
		flex-direction: column;
		padding-inline: 0.5rem;
	}
</style>
