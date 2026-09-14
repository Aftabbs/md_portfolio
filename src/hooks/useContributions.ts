import { useEffect, useState } from 'react'

export const GITHUB_USERNAME = 'Aftabbs'

// Maps a repo's GitHub org/login to the umbrella name used for grouping
// (a company can span several orgs). Unlisted orgs fall back to their raw
// login, so a contribution to a new org never disappears from the tabs.
const ORG_DISPLAY_NAMES: Record<string, string> = {
  'deepset-ai': 'deepset (Haystack)',
  openclaw: 'OpenClaw',
  'langchain-ai': 'LangChain',
  AzureCosmosDB: 'Microsoft Azure',
  microsoft: 'Microsoft',
  Microsoft: 'Microsoft',
}

export function orgDisplayName(repo: string): string {
  const org = repo.split('/')[0]
  return ORG_DISPLAY_NAMES[org] || org
}

export type Status = 'open' | 'merged'

export interface Contribution {
  status: Status
  repo: string
  title: string
  desc: string
  url: string
  updated: string
}

interface GithubSearchItem {
  repository_url: string
  title: string
  body: string | null
  html_url: string
  state: string
  updated_at: string
  pull_request?: { merged_at: string | null }
}

// Turns a PR body's Markdown into one plain-text line for the card. Prefers
// the paragraph under a "## Summary" heading (the convention used across
// these PRs); falls back to the first real paragraph otherwise.
function extractDesc(body: string | null): string {
  if (!body) return 'No description provided.'
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const isSkippable = (l: string) =>
    l === '' || /^#{1,6}\s/.test(l) || /^fixes\s+#\d+\.?$/i.test(l) || /^>/.test(l) || /^```/.test(l)

  const collectParagraph = (from: number): string[] => {
    const buf: string[] = []
    for (let i = from; i < lines.length; i++) {
      const line = lines[i].trim()
      if (isSkippable(line)) {
        if (buf.length) break
        else continue
      }
      buf.push(line)
    }
    return buf
  }

  const summaryIdx = lines.findIndex(l => /^#{1,6}\s*summary\b/i.test(l.trim()))
  let buf = summaryIdx >= 0 ? collectParagraph(summaryIdx + 1) : []
  if (!buf.length) buf = collectParagraph(0)

  let text = buf
    .join(' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  if (text.length > 160) text = text.slice(0, 157).trimEnd() + '…'
  return text || 'No description provided.'
}

// Module-level cache so every component using this hook shares one fetch
// instead of hitting the GitHub search API once per mount.
let cachedContributions: Contribution[] | null = null
let inFlight: Promise<Contribution[]> | null = null

function fetchContributions(): Promise<Contribution[]> {
  if (cachedContributions) return Promise.resolve(cachedContributions)
  if (inFlight) return inFlight

  const ownRepoPrefix = GITHUB_USERNAME.toLowerCase() + '/'

  inFlight = fetch(`https://api.github.com/search/issues?q=author:${GITHUB_USERNAME}+type:pr&per_page=100&sort=updated`)
    .then(r => r.json())
    .then((data: { items?: GithubSearchItem[] }) => {
      if (!Array.isArray(data.items)) throw new Error('Unexpected API response')

      const entries: Contribution[] = []
      data.items.forEach(item => {
        const repo = item.repository_url.replace('https://api.github.com/repos/', '')
        // Contributions to other people's projects only — skip PRs against
        // my own repos, which this author-search otherwise pulls in too.
        if (repo.toLowerCase().startsWith(ownRepoPrefix)) return
        const isMerged = !!item.pull_request?.merged_at
        if (!isMerged && item.state !== 'open') return // closed, unmerged

        entries.push({
          status: isMerged ? 'merged' : 'open',
          repo,
          title: item.title,
          desc: extractDesc(item.body),
          url: item.html_url,
          updated: item.updated_at,
        })
      })

      // Sort open+merged together by real update date so "All" (and any
      // org filter spanning both) shows the truly latest activity first,
      // instead of every open PR listed before every merged one.
      entries.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
      cachedContributions = entries
      return entries
    })
    .catch(() => {
      cachedContributions = []
      return []
    })

  return inFlight
}

export function useContributions() {
  const [contributions, setContributions] = useState<Contribution[]>(cachedContributions ?? [])
  const [loading, setLoading] = useState(!cachedContributions)

  useEffect(() => {
    if (cachedContributions) return // already synced via the initial state above
    let cancelled = false
    fetchContributions().then(entries => {
      if (!cancelled) {
        setContributions(entries)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { contributions, loading }
}
