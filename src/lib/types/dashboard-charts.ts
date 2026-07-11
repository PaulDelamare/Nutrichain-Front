export type ChartSegment = {
	label: string;
	value: number;
	color: string;
};

export type ChartSeries = {
	name: string;
	color: string;
	data: number[];
};

export type DashboardCharts = {
	lotStatus: ChartSegment[];
	weeklyMovements: {
		labels: string[];
		series: ChartSeries[];
	};
	alertSeverity: ChartSegment[];
	qualityResults: ChartSegment[];
};
