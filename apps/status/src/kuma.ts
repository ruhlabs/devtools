/** The parts of Uptime Kuma's public status-page API that this app reads. */

export interface KumaMonitor {
	id: number;
	name: string;
}

export interface KumaGroup {
	id: number;
	name: string;
	weight: number;
	monitorList: KumaMonitor[];
}

export interface KumaIncident {
	title: string;
	content: string;
	style: string;
	createdDate: string;
	lastUpdatedDate?: string | null;
}

export interface KumaMaintenance {
	id: number;
	title: string;
	description?: string;
}

export interface KumaPage {
	config: { title: string; description?: string | null };
	/** Uptime Kuma 1.x: one pinned incident */
	incident?: KumaIncident | null;
	/** Uptime Kuma 2.x: pinned incidents */
	incidents?: KumaIncident[];
	publicGroupList: KumaGroup[];
	maintenanceList?: KumaMaintenance[];
}

/** Kuma heartbeat statuses */
export const DOWN = 0;
export const UP = 1;
export const PENDING = 2;
export const MAINTENANCE = 3;

export interface Beat {
	status: number;
	/** "YYYY-MM-DD HH:mm:ss.SSS", in UTC */
	time: string;
	msg?: string;
	ping: number | null;
}

export interface KumaHeartbeats {
	heartbeatList: Record<string, Beat[]>;
	uptimeList: Record<string, number>;
}

/** Kuma's timestamps are UTC without a zone marker. */
export function parseKumaTime(time: string): number {
	return Date.parse(`${time.trim().replace(' ', 'T')}Z`);
}

async function getJson<T>(url: string): Promise<T> {
	const response = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { accept: 'application/json' } });
	if (!response.ok) throw new Error(`${url} answered ${response.status}`);
	return (await response.json()) as T;
}

export async function fetchKuma(base: string, slug: string): Promise<{ page: KumaPage; beats: KumaHeartbeats }> {
	const [page, beats] = await Promise.all([
		getJson<KumaPage>(`${base}/api/status-page/${encodeURIComponent(slug)}`),
		getJson<KumaHeartbeats>(`${base}/api/status-page/heartbeat/${encodeURIComponent(slug)}`)
	]);
	return { page, beats };
}
