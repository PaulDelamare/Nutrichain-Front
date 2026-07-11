import type { ApiResult } from './client.server';

export type LoadSource = 'api' | 'mock';

export async function loadApiOrMock<T>(
	loader: () => Promise<ApiResult<T>>,
	mock: T
): Promise<{ data: T; source: LoadSource; error?: string }> {
	const res = await loader();
	if (res.ok) {
		return { data: res.data, source: 'api' };
	}
	return { data: mock, source: 'mock', error: res.message };
}
