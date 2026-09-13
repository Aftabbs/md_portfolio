import { useEffect, useState } from 'react'
import { GITHUB_USERNAME } from './useContributions'

const FEATURED_REPO = 'AzureCosmosDB/azure-cosmos-mcp-server-samples'

export interface GithubStats {
  publicRepos: number | null
  featuredStars: number | null
  featuredForks: number | null
  loading: boolean
}

interface CachedStats {
  publicRepos: number
  featuredStars: number
  featuredForks: number
}

// Module-level cache — shared across every component using this hook so a
// page render only hits the GitHub REST API once per stat, not once per use.
let cached: CachedStats | null = null
let inFlight: Promise<CachedStats> | null = null

function fetchStats(): Promise<CachedStats> {
  if (cached) return Promise.resolve(cached)
  if (inFlight) return inFlight

  inFlight = Promise.all([
    fetch(`https://api.github.com/users/${GITHUB_USERNAME}`).then(r => r.json()),
    fetch(`https://api.github.com/repos/${FEATURED_REPO}`).then(r => r.json()),
  ])
    .then(([profile, repo]) => {
      const result: CachedStats = {
        publicRepos: typeof profile.public_repos === 'number' ? profile.public_repos : 0,
        featuredStars: typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0,
        featuredForks: typeof repo.forks_count === 'number' ? repo.forks_count : 0,
      }
      cached = result
      return result
    })
    .catch(() => {
      const result: CachedStats = { publicRepos: 0, featuredStars: 0, featuredForks: 0 }
      cached = result
      return result
    })

  return inFlight
}

export function useGithubStats(): GithubStats {
  const [stats, setStats] = useState<CachedStats | null>(cached)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (cached) return // already synced via the initial state above
    let cancelled = false
    fetchStats().then(result => {
      if (!cancelled) {
        setStats(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    publicRepos: stats?.publicRepos ?? null,
    featuredStars: stats?.featuredStars ?? null,
    featuredForks: stats?.featuredForks ?? null,
    loading,
  }
}
