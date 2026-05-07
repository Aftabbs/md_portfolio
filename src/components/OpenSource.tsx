import { motion } from 'framer-motion'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

const PR_ROWS = [
  { num: '#10702', title: 'fix: replace in-place dataclass mutations with dataclasses.replace() — 10 fixes across 6 files', repo: 'deepset-ai/haystack',                     date: 'Mar 2026', status: 'merged' },
  { num: '#60914', title: 'fix(cli): route skills list output to stdout when --json is active — unblocks automation tooling',   repo: 'openclaw/openclaw',                   date: 'Apr 2026', status: 'merged' },
  { num: '#62337', title: 'fix(daemon): skip machine-scope fallback on permission-denied bus errors — merged by Peter Steinberger (founder)', repo: 'openclaw/openclaw',     date: 'Apr 2026', status: 'merged' },
  { num: '#54971', title: 'test(plugins): Feishu re-registration regression guard — "Thanks @Aftabbs!"',                        repo: 'openclaw/openclaw',                   date: 'Apr 2026', status: 'merged' },
  { num: '#11117', title: 'docs: HTML → JSX comments across 45 files — unblocks Docusaurus v4 migration',                      repo: 'deepset-ai/haystack',                 date: 'Apr 2026', status: 'merged' },
  { num: '#3138',  title: 'test(weaviate): replace in-place Document mutations with dataclasses.replace()',                     repo: 'deepset-ai/haystack-core-integrations', date: 'Apr 2026', status: 'merged' },
  { num: '#3199',  title: 'fix(amazon-bedrock): prevent double-wrapping of cachepoint in streaming responses',                  repo: 'deepset-ai/haystack-core-integrations', date: 'Apr 2026', status: 'merged' },
  { num: '#2738',  title: 'fix(wrappers): suppress Pydantic warnings for ParsedBetaMessage — merged by jacoblee93',            repo: 'langchain-ai/langsmith-sdk',          date: 'Apr 2026', status: 'merged' },
  { num: '#3177',  title: 'fix(google-genai): cached_content_token_count in streaming responses',                              repo: 'deepset-ai/haystack-core-integrations', date: 'Apr 2026', status: 'merged' },
]

export default function OpenSource() {
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
            9 merged PRs across 4 organisations — deepset-ai/haystack, haystack-core-integrations,
            openclaw, and langchain-ai/langsmith-sdk. 12+ open PRs across LangChain, LangSmith,
            and haystack-core-integrations.
          </p>
        </motion.div>

        {/* Featured cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"
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
              Pinned on the official AzureCosmosDB GitHub org — 64 stars, 27 forks. Recognised as
              a Microsoft Open Source Contributor.
            </p>
            <div className="flex gap-4 text-xs" style={{ color: 'hsl(0 0% 40%)', fontFamily: 'monospace' }}>
              <span style={{ color: '#ffab00' }}>★ 64 · forks 27</span>
              <span>Python · MCP · Azure</span>
            </div>
          </div>

          {/* Stats card */}
          <div
            className="rounded-2xl border p-6 flex flex-col justify-between"
            style={{ borderColor: 'hsl(0 0% 10%)', background: 'hsl(0 0% 6%)' }}
          >
            <p className="text-xs uppercase tracking-[0.12em] mb-5" style={{ color: '#89aacc', fontFamily: 'monospace' }}>
              // contribution.stats
            </p>
            {[
              { key: 'total_merged',  val: '9 PRs',                     green: true  },
              { key: 'orgs',          val: '4 organisations',            green: false },
              { key: 'haystack',      val: '5 merged (core + integrations)', green: true },
              { key: 'openclaw',      val: '3 merged',                   green: true  },
              { key: 'langsmith_sdk', val: '1 merged',                   green: true  },
              { key: 'open_prs',      val: '12+ across LangChain + more',green: false },
            ].map(({ key, val, green }) => (
              <div
                key={key}
                className="flex justify-between items-center py-2 border-b last:border-b-0"
                style={{ borderColor: 'hsl(0 0% 9%)', fontFamily: 'monospace', fontSize: '12px' }}
              >
                <span style={{ color: 'hsl(0 0% 45%)' }}>{key}</span>
                <span style={{ color: green ? '#00e676' : '#89aacc' }}>{val}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* All 9 PRs table */}
        <motion.div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'hsl(0 0% 10%)', background: 'hsl(0 0% 6%)' }}
          variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          {/* Header */}
          <div
            className="grid px-5 py-3 border-b text-xs uppercase tracking-widest"
            style={{
              borderColor: 'hsl(0 0% 9%)',
              background: 'hsl(0 0% 5%)',
              color: 'hsl(0 0% 35%)',
              fontFamily: 'monospace',
              gridTemplateColumns: '64px 1fr 220px 72px 64px',
            }}
          >
            <span>PR</span><span>Title</span><span className="hidden md:block">Repo</span><span className="hidden md:block">Date</span><span>Status</span>
          </div>
          {PR_ROWS.map((pr, i) => (
            <div
              key={pr.num}
              className="grid items-center gap-3 px-5 py-3.5 transition-colors duration-150"
              style={{
                borderBottom: i < PR_ROWS.length - 1 ? '1px solid hsl(0 0% 8%)' : 'none',
                gridTemplateColumns: '64px 1fr 220px 72px 64px',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(137,170,204,0.03)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span className="text-xs" style={{ color: 'hsl(0 0% 35%)', fontFamily: 'monospace' }}>{pr.num}</span>
              <span className="text-xs leading-5" style={{ color: 'hsl(0 0% 72%)', fontFamily: 'monospace' }}>{pr.title}</span>
              <span className="text-xs hidden md:block truncate" style={{ color: 'hsl(0 0% 38%)', fontFamily: 'monospace' }}>{pr.repo}</span>
              <span className="text-xs hidden md:block" style={{ color: 'hsl(0 0% 35%)', fontFamily: 'monospace' }}>{pr.date}</span>
              <span
                className="text-xs px-2 py-0.5 rounded justify-self-start"
                style={{ background: 'rgba(0,230,118,0.08)', color: '#00e676' }}
              >
                merged
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
