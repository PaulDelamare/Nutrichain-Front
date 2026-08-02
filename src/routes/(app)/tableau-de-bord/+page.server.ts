import type { PageServerLoad } from './$types';
import { getBatches, MAX_BATCH_PAGE_SIZE } from '$lib/Api/traceability.server';
import {
	getAlerts,
	getQualityControls,
	getQuarantineBatches,
	getMovements
} from '$lib/Api/organization.server';
import {
	buildDashboardKpis,
	buildDashboardTasks,
	movementsToActivity
} from '$lib/utils/org/mappers';
import { buildDashboardCharts } from '$lib/utils/org/dashboardCharts';
import { openQualityIssues } from '$lib/utils/org/quality';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const [batches, alerts, quality, quarantine, movements] = await Promise.all([
		getBatches(fetch, cookies, { limit: MAX_BATCH_PAGE_SIZE }),
		getAlerts(fetch, cookies),
		getQualityControls(fetch, cookies),
		getQuarantineBatches(fetch, cookies),
		getMovements(fetch, cookies, { limit: 100 })
	]);

	const batchList = batches.ok ? batches.data.data : [];
	// Le décompte des lots suivis vient du total de l'API, pas de la page reçue : les deux ne
	// coïncident qu'en deçà du plafond de volumétrie.
	const totalBatches = batches.ok ? batches.data.pagination.total : 0;
	const alertList = alerts.ok ? alerts.data : [];
	const qualityList = quality.ok ? quality.data : [];
	const quarantineList = quarantine.ok ? quarantine.data : [];
	const movementList = movements.ok ? movements.data : [];

	const error = [batches, alerts, quality, quarantine, movements].find((r) => !r.ok)?.message;

	const openIssues = openQualityIssues(qualityList).length;

	return {
		kpis: buildDashboardKpis(
			totalBatches,
			alertList,
			openIssues,
			quarantineList.length,
			batchList.filter((b) => b.statut === 'ALERTE').length
		),
		charts: buildDashboardCharts(batchList, alertList, movementList, qualityList),
		// La répartition ne porte que sur les lots effectivement reçus. Au-delà du plafond, le dire
		// vaut mieux que de laisser croire que le camembert couvre tout le catalogue.
		lotStatusSubtitle:
			totalBatches > batchList.length
				? `Par statut — ${batchList.length} lots les plus récents sur ${totalBatches}`
				: 'Par statut opérationnel',
		// Le catalogue sert aussi à nommer les lots de l'activité récente : l'API ne joint pas le
		// numéro d'étiquette à ses mouvements, et la page affichait donc des UUID (#81).
		recentActivity: movementsToActivity(movementList.slice(0, 5), batchList),
		tasks: buildDashboardTasks(alertList, openIssues),
		error
	};
};
