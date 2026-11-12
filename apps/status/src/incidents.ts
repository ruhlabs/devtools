/**
 * A past incident, listed on the page for 90 days. Add them per brand in brands.ts and redeploy.
 * Ongoing incidents are posted in Uptime Kuma instead (pin an incident on the status page),
 * so they appear within a minute without a deploy.
 */
export interface PastIncident {
	/** Day it started, Maldives time (YYYY-MM-DD) */
	date: string;
	title: string;
	/** How long it lasted, in words */
	duration?: string;
	body: string;
}
