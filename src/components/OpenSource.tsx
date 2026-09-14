import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { orgDisplayName, useContributions, type Status } from '../hooks/useContributions'
import { useGithubStats } from '../hooks/useGithubStats'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

const PAGE_SIZE = 4

export default function OpenSource() {
  const { contributions, loading } = useContributions()
  const { featuredStars, featuredForks } = useGithubStats()
  const [statusTab, setStatusTab] = useState<'all' | Status>('all')
  const [orgTab, setOrgTab] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const orgCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    contributions.forEach(c => {
      const org = orgDisplayName(c.repo)
      counts[org] = (counts[org] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [contributions])

  const openCount = contributions.filter(c => c.status === 'open').length
  const mergedCount = contributions.filter(c => c.status === 'merged').length
  const repoCount = new Set(contributions.map(c => c.repo)).size

  const visibleItems = contributions.filter(
    c => (statusTab === 'all' || c.status === statusTab) && (orgTab === 'all' || orgDisplayName(c.repo) === orgTab)
  )
  const page = visibleItems.slice(0, visibleCount)
  const remaining = visibleItems.length - page.length

  function selectStatus(tab: 'all' | Status) {
    setStatusTab(tab)
    setVisibleCount(PAGE_SIZE)
  }

  function selectOrg(org: string) {
    setOrgTab(org)
    // Most orgs only have a couple of contributions, often all in one status
    // bucket — leaving a narrow status tab active meant picking most orgs
    // landed on a silent empty grid. Jump to "All" so every org selection
    // shows something; status tabs remain there to narrow down from there.
    setStatusTab('all')
    setVisibleCount(PAGE_SIZE)
  }

  const STATUS_TABS: { key: 'all' | Status; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: contributions.length },
    { key: 'open', label: 'Open PRs', count: openCount },
    { key: 'merged', label: 'Merged', count: mergedCount },
  ]

  return (
    <section id="opensource" className="py-20 md:py-28 px-6 md:px-10 lg:px-16" style={{ background: 'hsl(0 0% 4%)' }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-px" style={{ background: 'hsl(0 0% 12%)' }} />
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: 'hsl(0 0% 53%)' }}>04 · contrib.log</span>
        </div>

        <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3" style={{ color: 'hsl(0 0% 96%)' }}>
            Open Source{' '}
            <span className="italic" style={{ fontFamily: "'Instrument Serif', serif" }}>Contributions</span>
          </h2>
          <p className="text-sm max-w-xl mb-10" style={{ color: 'hsl(0 0% 45%)', lineHeight: 1.7 }}>
            {loading
              ? 'Loading live contribution history from GitHub...'
              : `${mergedCount} merged PR${mergedCount === 1 ? '' : 's'} and ${openCount} open across ${orgCounts.length} organisation${orgCounts.length === 1 ? '' : 's'} — pulled live from GitHub, newest activity first.`}
          </p>
        </motion.div>

        {/* Featured cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
          variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          {/* Microsoft card */}
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: 'rgba(255,171,0,0.2)', background: 'hsl(0 0% 6%)' }}
          >
            <span
              className="inline-block text-xs px-3 py-1 rounded-full mb-4 border"
              style={{ background: 'rgba(255,171,0,0.07)', color: '#ffab00', borderColor: 'rgba(255,171,0,0.2)' }}
            >
              Microsoft · Official Contributor
            </span>
            <p className="text-xs mb-1" style={{ color: 'hsl(0 0% 40%)', fontFamily: 'monospace' }}>
              AzureCosmosDB / azure-cosmos-mcp-server-samples
            </p>
            <p className="text-sm font-semibold mb-2" style={{ color: 'hsl(0 0% 90%)' }}>
              First Python MCP Servers for Azure Cosmos DB
            </p>
            <p className="text-xs leading-6 mb-4" style={{ color: 'hsl(0 0% 50%)' }}>
              Built the first-ever Python-based Model Context Protocol servers for Azure Cosmos DB.
              Pinned on the official AzureCosmosDB GitHub org — {featuredStars ?? '…'} stars, {featuredForks ?? '…'} forks. Recognised as
              a Microsoft Open Source Contributor.
            </p>
            <div className="flex gap-4 text-xs" style={{ color: 'hsl(0 0% 40%)', fontFamily: 'monospace' }}>
              <span style={{ color: '#ffab00' }}>★ {featuredStars ?? '…'} · forks {featuredForks ?? '…'}</span>
              <span>Python · MCP · Azure</span>
            </div>
          </div>

          {/* Stats card — live counts from the fetch above */}
          <div
            className="rounded-2xl border p-6 flex flex-col justify-between"
            style={{ borderColor: 'hsl(0 0% 10%)', background: 'hsl(0 0% 6%)' }}
          >
            <p className="text-xs uppercase tracking-[0.12em] mb-5" style={{ color: '#89aacc', fontFamily: 'monospace' }}>
              // contribution.stats
            </p>
            {[
              { key: 'total_open+merged', val: `${contributions.length} PRs`, green: false },
              { key: 'merged', val: `${mergedCount} merged`, green: true },
              { key: 'open', val: `${openCount} open`, green: false },
              { key: 'organisations', val: `${orgCounts.length}`, green: false },
              { key: 'repos_touched', val: `${repoCount}`, green: false },
            ].map(({ key, val, green }) => (
              <div
                key={key}
                className="flex justify-between items-center py-2 border-b last:border-b-0"
                style={{ borderColor: 'hsl(0 0% 9%)', fontFamily: 'monospace', fontSize: '12px' }}
              >
                <span style={{ color: 'hsl(0 0% 45%)' }}>{key}</span>
                <span style={{ color: green ? '#00e676' : '#89aacc' }}>{loading ? '…' : val}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Status tabs */}
        <motion.div className="flex flex-wrap gap-2 mb-3" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {STATUS_TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => selectStatus(key)}
              className="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 border"
              style={statusTab === key
                ? { background: 'rgba(255,255,255,0.10)', color: 'hsl(0 0% 92%)', borderColor: 'rgba(137,170,204,0.3)' }
                : { background: 'transparent', color: 'hsl(0 0% 50%)', borderColor: 'hsl(0 0% 12%)' }
              }
            >
              {label}{count > 0 ? ` (${count})` : ''}
            </button>
          ))}
        </motion.div>

        {/* Org tabs */}
        {orgCounts.length > 0 && (
          <motion.div className="flex flex-wrap gap-2 mb-8" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <button
              onClick={() => selectOrg('all')}
              className="rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-200 border"
              style={orgTab === 'all'
                ? { background: 'rgba(137,170,204,0.12)', color: '#89aacc', borderColor: 'rgba(137,170,204,0.3)' }
                : { background: 'transparent', color: 'hsl(0 0% 42%)', borderColor: 'hsl(0 0% 10%)' }
              }
            >
              All orgs ({contributions.length})
            </button>
            {orgCounts.map(([org, count]) => (
              <button
                key={org}
                onClick={() => selectOrg(org)}
                className="rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-200 border"
                style={orgTab === org
                  ? { background: 'rgba(137,170,204,0.12)', color: '#89aacc', borderColor: 'rgba(137,170,204,0.3)' }
                  : { background: 'transparent', color: 'hsl(0 0% 42%)', borderColor: 'hsl(0 0% 10%)' }
                }
              >
                {org} ({count})
              </button>
            ))}
          </motion.div>
        )}

        {/* Contribution grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border h-32 animate-pulse" style={{ borderColor: 'hsl(0 0% 9%)', background: 'hsl(0 0% 6%)' }} />
            ))}
          </div>
        ) : page.length === 0 ? (
          <div
            className="rounded-2xl border p-8 text-center text-sm"
            style={{ borderColor: 'hsl(0 0% 10%)', background: 'hsl(0 0% 6%)', color: 'hsl(0 0% 40%)' }}
          >
            No {statusTab === 'all' ? '' : `${statusTab} `}items{orgTab === 'all' ? '' : ` for ${orgTab}`} yet — try another tab above.
          </div>
        ) : (
          <>
            <motion.div
              key={`${statusTab}-${orgTab}`}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {page.map(item => (
                <a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 no-underline"
                  style={{ borderColor: 'hsl(0 0% 10%)', background: 'hsl(0 0% 6%)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(137,170,204,0.22)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(0 0% 10%)' }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs truncate" style={{ color: 'hsl(0 0% 40%)', fontFamily: 'monospace' }}>{item.repo}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded shrink-0"
                      style={item.status === 'merged'
                        ? { background: 'rgba(0,230,118,0.08)', color: '#00e676' }
                        : { background: 'rgba(137,170,204,0.1)', color: '#89aacc' }
                      }
                    >
                      {item.status === 'merged' ? 'Merged' : 'Open'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-snug mb-2" style={{ color: 'hsl(0 0% 88%)' }}>{item.title}</p>
                  <p className="text-xs leading-5 flex-1" style={{ color: 'hsl(0 0% 48%)' }}>{item.desc}</p>
                  <span className="mt-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#89aacc' }}>
                    View pull request ↗
                  </span>
                </a>
              ))}
            </motion.div>

            {remaining > 0 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                  className="flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-medium border transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'hsl(0 0% 75%)', borderColor: 'rgba(255,255,255,0.14)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'hsl(0 0% 75%)' }}
                >
                  More ({remaining})
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
