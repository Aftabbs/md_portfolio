import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Repo {
  id: number
  name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
  fork: boolean
  _bucket?: 'starred' | 'recent'
}

type Tab = 'all' | 'starred' | 'recent'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5', TypeScript: '#3178c6', JavaScript: '#f1e05a',
  Java: '#b07219', Go: '#00ADD8', HTML: '#e34c26',
}

function RepoCard({ repo }: { repo: Repo }) {
  const badge = repo._bucket === 'starred' ? '⭐ Top Starred' : repo._bucket === 'recent' ? '🕐 Recent' : null
  const langColor = repo.language ? (LANG_COLORS[repo.language] ?? '#89aacc') : '#89aacc'
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 no-underline"
      style={{ borderColor: 'hsl(0 0% 10%)', background: 'hsl(0 0% 6%)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(137,170,204,0.22)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(0 0% 10%)' }}
    >
      {/* top accent line */}
      <div className="absolute top-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 accent-gradient" />

      <div className="flex items-start justify-between mb-2 gap-2">
        <p className="text-sm font-semibold leading-snug" style={{ color: 'hsl(0 0% 88%)' }}>{repo.name}</p>
        {badge && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
            style={repo._bucket === 'starred'
              ? { background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }
              : { background: 'rgba(137,170,204,0.1)', color: '#89aacc', border: '1px solid rgba(137,170,204,0.2)' }
            }
          >
            {badge}
          </span>
        )}
      </div>

      <p className="text-xs leading-5 flex-1 mb-4" style={{ color: 'hsl(0 0% 48%)' }}>
        {repo.description || 'No description'}
      </p>

      <div className="flex items-center gap-4">
        {repo.language && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(0 0% 45%)' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: langColor }} />
            {repo.language}
          </span>
        )}
        <span className="text-xs" style={{ color: 'hsl(0 0% 42%)' }}>★ {repo.stargazers_count}</span>
        {repo.forks_count > 0 && (
          <span className="text-xs" style={{ color: 'hsl(0 0% 38%)' }}>⑂ {repo.forks_count}</span>
        )}
        <span className="ml-auto text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#89aacc' }}>
          GitHub ↗
        </span>
      </div>
    </a>
  )
}

export default function Projects() {
  const [allRepos, setAllRepos] = useState<Repo[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({ all: 0, starred: 0, recent: 0 })

  useEffect(() => {
    const username = 'Aftabbs'
    Promise.all([
      fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`).then(r => r.json()),
      fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=100`).then(r => r.json()),
    ])
      .then(([recentData, starData]: [Repo[], Repo[]]) => {
        if (!Array.isArray(recentData) || !Array.isArray(starData)) return

        // Top 5 starred (non-fork, with at least 1 star)
        const starred5 = starData
          .filter(r => r.name !== username && !r.fork && r.stargazers_count > 0)
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 5)
          .map(r => ({ ...r, _bucket: 'starred' as const }))

        const starredNames = new Set(starred5.map(r => r.name))

        // 5 most recent from what's left (not already in starred)
        const recent5 = recentData
          .filter(r => r.name !== username && !r.fork && !starredNames.has(r.name))
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5)
          .map(r => ({ ...r, _bucket: 'recent' as const }))

        const combined: Repo[] = [...starred5, ...recent5]
        setAllRepos(combined)
        setCounts({ all: combined.length, starred: starred5.length, recent: recent5.length })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const visible = tab === 'all' ? allRepos
    : allRepos.filter(r => r._bucket === tab)

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'all',     label: 'All',          count: counts.all     },
    { key: 'starred', label: '⭐ Top Starred', count: counts.starred },
    { key: 'recent',  label: '🕐 Most Recent', count: counts.recent  },
  ]

  return (
    <section id="projects" className="py-20 md:py-28 px-6 md:px-10 lg:px-16" style={{ background: 'hsl(0 0% 6%)' }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-px" style={{ background: 'hsl(0 0% 12%)' }} />
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: 'hsl(0 0% 53%)' }}>03 · projects[]</span>
        </div>

        <motion.div
          className="flex items-end justify-between mb-8"
          variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: 'hsl(0 0% 96%)' }}>
              Featured{' '}
              <span className="italic" style={{ fontFamily: "'Instrument Serif', serif" }}>projects</span>
            </h2>
            <p className="text-sm mt-2" style={{ color: 'hsl(0 0% 40%)' }}>
              AI systems I've built — from concept to production.
            </p>
          </div>
          <a
            href="https://github.com/Aftabbs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: '#89aacc' }}
          >
            github.com/Aftabbs ↗
          </a>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex gap-2 mb-8"
          variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 border"
              style={tab === key
                ? { background: 'rgba(255,255,255,0.10)', color: 'hsl(0 0% 92%)', borderColor: 'rgba(137,170,204,0.3)' }
                : { background: 'transparent', color: 'hsl(0 0% 50%)', borderColor: 'hsl(0 0% 12%)' }
              }
            >
              {label}{count > 0 ? ` (${count})` : ''}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border h-36 animate-pulse"
                style={{ borderColor: 'hsl(0 0% 9%)', background: 'hsl(0 0% 6%)' }} />
            ))}
          </div>
        ) : (
          <motion.div
            key={tab}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {visible.map(repo => (
              <div key={repo.id} className="relative">
                <RepoCard repo={repo} />
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
