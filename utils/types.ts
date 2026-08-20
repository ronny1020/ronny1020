import type { Endpoints } from '@octokit/types'

/**
 * Response shapes are derived from `@octokit/types`, which is generated from
 * GitHub's OpenAPI description. `Required<Pick<…>>` narrows each response to the
 * fields the README uses: the generated types mark many of them optional because
 * they are absent from some other endpoint's payload.
 */
type UserResponse = Endpoints['GET /users/{username}']['response']['data']
type RepoResponse =
  Endpoints['GET /users/{username}/repos']['response']['data'][number]
type SearchResponse = Endpoints['GET /search/issues']['response']['data']
type StarredResponse =
  Endpoints['GET /users/{username}/starred']['response']['data'][number]

export type GithubUser = Required<
  Pick<UserResponse, 'created_at' | 'followers' | 'location' | 'public_repos'>
>

export type GithubRepo = Required<
  Pick<
    RepoResponse,
    | 'archived'
    | 'description'
    | 'fork'
    | 'forks_count'
    | 'homepage'
    | 'html_url'
    | 'language'
    | 'name'
    | 'pushed_at'
    | 'stargazers_count'
    | 'topics'
  >
>

export type PullRequest = Required<
  Pick<
    SearchResponse['items'][number],
    'html_url' | 'pull_request' | 'repository_url' | 'title' | 'updated_at'
  >
>

export type PullRequestSearch = Required<
  Pick<SearchResponse, 'total_count'>
> & {
  items: PullRequest[]
}

export type StarredRepo = Required<
  Pick<
    Extract<StarredResponse, { full_name: string }>,
    | 'description'
    | 'full_name'
    | 'html_url'
    | 'language'
    | 'private'
    | 'stargazers_count'
  >
>

export type NpmPackage = {
  name: string
  description: string | null
}

/** The subset of an npm manifest the README needs. */
export type NpmManifest = Partial<NpmPackage> & {
  repository?: string | { url?: string }
}

/** npm metadata and reachable demo links, both keyed by repository name. */
export type RepoLinks = {
  npmPackages: Map<string, NpmPackage>
  siteLinks: Map<string, string>
}
