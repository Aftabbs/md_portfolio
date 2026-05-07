import { motion } from 'framer-motion'

const ARTICLES = [
  {
    num: '// 001',
    title: 'Beyond RAG: LLM-as-Judge, Neuro-Symbolic Reasoning & What Comes Next',
    excerpt: 'A technical survey of post-RAG paradigms — evaluation frameworks, neuro-symbolic hybrids, and architectural primitives reshaping production LLM systems.',
    tag: 'Agentic AI · RAG · Research',
    url: 'https://medium.com/@aftab001x',
  },
  {
    num: '// 002',
    title: 'Building Production Guardrails: PII, Injection & Compliance at Scale',
    excerpt: 'Field notes from designing a 5-guardrail SLM-based system — architecture decisions, HuggingFace model selection, and latency trade-offs in production.',
    tag: 'Guardrails · MLOps · Production',
    url: 'https://medium.com/@aftab001x',
  },
  {
    num: '// 003',
    title: 'DeepSeek, AI Investment Dynamics & The Capital Moat Question',
    excerpt: "Analyzing how DeepSeek's efficiency-first architecture challenges the \"scale is all you need\" orthodoxy and what it means for enterprise AI investment.",
    tag: 'LLM Architecture · Investment',
    url: 'https://medium.com/@aftab001x',
  },
  {
    num: '// 004',
    title: 'Model Context Protocol: The USB-C Moment for AI Agent Integration',
    excerpt: "A deep dive into MCP's architecture, why it's becoming the standard for AI tool integration, and how to build production-grade MCP servers in Python.",
    tag: 'MCP · Agentic AI · Azure',
    url: 'https://medium.com/@aftab001x',
  },
]

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

export default function Articles() {
  return (
    <section id="articles" className="py-20 md:py-28 px-6 md:px-10 lg:px-16" style={{ background: 'hsl(0 0% 6%)' }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-px" style={{ background: 'hsl(0 0% 12%)' }} />
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: 'hsl(0 0% 53%)' }}>05 · medium.feed</span>
        </div>

        <motion.div
          className="flex items-end justify-between mb-6"
          variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: 'hsl(0 0% 96%)' }}>
              Technical{' '}
              <span className="italic" style={{ fontFamily: "'Instrument Serif', serif" }}>Writing</span>
            </h2>
            <p className="text-sm mt-2" style={{ color: 'hsl(0 0% 40%)' }}>Deep-dives on LLMs, agents, and AI infrastructure.</p>
          </div>
          <a
            href="https://medium.com/@aftab001x"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex text-xs uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: '#89aacc' }}
          >
            View all on Medium ↗
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="flex gap-10 mb-10"
          variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          {[['50+', 'Published'], ['2×', 'Per Week'], ['High', 'Readership']].map(([n, l]) => (
            <div key={l}>
              <p
                className="text-3xl font-semibold"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  background: 'linear-gradient(90deg, #89aacc, #4e85bf)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {n}
              </p>
              <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: 'hsl(0 0% 40%)' }}>{l}</p>
            </div>
          ))}
        </motion.div>

        {/* Article cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
          variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          {ARTICLES.map((a) => (
            <a
              key={a.num}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-0.5 no-underline"
              style={{ borderColor: 'hsl(0 0% 10%)', background: 'hsl(0 0% 7%)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(137,170,204,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(0 0% 10%)' }}
            >
              <p className="text-xs mb-2" style={{ color: 'hsl(0 0% 35%)', fontFamily: 'monospace' }}>{a.num}</p>
              <p className="text-sm font-semibold mb-2 leading-snug" style={{ color: 'hsl(0 0% 88%)' }}>{a.title}</p>
              <p className="text-xs leading-6 flex-1 mb-3" style={{ color: 'hsl(0 0% 48%)' }}>{a.excerpt}</p>
              <p className="text-xs" style={{ color: '#89aacc', opacity: 0.6 }}>{a.tag}</p>
            </a>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          <a
            href="https://medium.com/@aftab001x"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full text-sm px-7 py-3 border transition-all duration-200 hover:scale-105"
            style={{ borderColor: 'hsl(0 0% 15%)', color: 'hsl(0 0% 80%)', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(137,170,204,0.4)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(0 0% 15%)' }}
          >
            Read All 50+ Articles on Medium →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
