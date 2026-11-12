/**
 * Past incidents, newest first. Add one here when something goes wrong and redeploy.
 * Ongoing incidents are posted in Uptime Kuma instead (pin an incident on the status page),
 * so they appear here within a minute without a deploy.
 */
export interface PastIncident {
	/** Day it started, Maldives time (YYYY-MM-DD) */
	date: string;
	title: string;
	/** How long it lasted, in words */
	duration: string;
	body: string;
}

export const PAST_INCIDENTS: PastIncident[] = [
	{
		date: '2026-11-12',
		title: 'SET25 and Study IAL were unreachable',
		duration: 'about 5 hours',
		body: "Our previous hosting provider paused both sites after a usage limit. We moved them to our own servers, and they've been up since."
	}
];
