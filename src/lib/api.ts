import { MEMBERS } from './constants/members';

export interface GithubOrgMember {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
}

export const fetchGithubOrgMembers = async (
	orgName: string,
	page: number = 1
): Promise<GithubOrgMember[]> => {
	try {
		const response = await fetch(`https://api.github.com/orgs/${orgName}/members?page=${page}`);
		if (!response.ok) {
			throw new Error(response.statusText);
		}
		return (await response.json()) as GithubOrgMember[];
	} catch {
		// no auth for now
		return MEMBERS;
	}
};
