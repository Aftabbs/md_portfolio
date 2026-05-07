import { motion } from 'framer-motion'

const CHIPS = [
  'LLM Engineering', 'Agentic Systems', 'RAG Architecture', 'AI Guardrails',
  'MLOps', 'Azure', 'Fine-Tuning', 'LangGraph', 'MCP', 'AI Evaluation',
  'HuggingFace', 'Vector Search', 'GraphRAG', 'NL2SQL',
]

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] } },
}

export default function About() {
  return (
    <section
      id="about"
      className="py-20 md:py-32 px-6 md:px-10 lg:px-16"
      style={{ background: 'hsl(0 0% 6%)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-px" style={{ background: 'hsl(0 0% 12%)' }} />
          <span
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: 'hsl(0 0% 53%)' }}
          >
            01 · about.json
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left: text */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <h2
              className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 leading-[1.1]"
              style={{ color: 'hsl(0 0% 96%)' }}
            >
              Engineering AI systems
              <br />
              that{' '}
              <span
                className="italic"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  background: 'linear-gradient(90deg, #89aacc, #4e85bf)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                actually ship.
              </span>
            </h2>

            <p className="text-sm leading-7 mb-4" style={{ color: 'hsl(0 0% 53%)' }}>
              Senior AI Engineer specializing in LLM engineering, agentic system design, and
              AI evaluation — building production-grade AI systems for enterprises including
              JP Morgan, PwC, Morgan Stanley, and Experian. Created the first-ever Python MCP
              servers for Microsoft Azure Cosmos DB (64★, pinned on official org).
            </p>
            <p className="text-sm leading-7 mb-6" style={{ color: 'hsl(0 0% 53%)' }}>
              9 merged PRs across 4 open-source orgs (Haystack, Haystack-core-integrations,
              openclaw, LangSmith SDK). My work spans guardrail infrastructure, multi-agent
              orchestration, GraphRAG, NL2SQL pipelines, and AI evaluation. 50+ technical
              articles on Medium — from LLM architecture to AI investment dynamics.
            </p>

            {/* Chips */}
            <div className="flex flex-wrap gap-2">
              {CHIPS.map((chip) => (
                <span
                  key={chip}
                  className="text-xs px-3 py-1 rounded-full border"
                  style={{
                    borderColor: 'rgba(137,170,204,0.3)',
                    color: '#89aacc',
                    background: 'rgba(137,170,204,0.06)',
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: code block */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="rounded-2xl overflow-hidden border"
            style={{
              borderColor: 'hsl(0 0% 12%)',
              background: 'hsl(0 0% 7%)',
            }}
          >
            {/* Window bar */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ borderColor: 'hsl(0 0% 12%)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f56' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#27c93f' }} />
              <span className="ml-2 text-xs" style={{ color: 'hsl(0 0% 40%)', fontFamily: 'monospace' }}>about.py</span>
            </div>

            {/* Code */}
            <div className="p-5 text-xs leading-7 overflow-x-auto" style={{ fontFamily: 'monospace' }}>
              <p><span style={{ color: '#c678dd' }}>class</span> <span style={{ color: '#61afef' }}>AIEngineer</span>:</p>
              <p>&nbsp;&nbsp;<span style={{ color: '#c678dd' }}>def</span> <span style={{ color: '#61afef' }}>__init__</span>(<span style={{ color: '#e5c07b' }}>self</span>):</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#e5c07b' }}>self</span>.<span style={{ color: '#89aacc' }}>name</span> = <span style={{ color: '#ffab00' }}>"Mohammed Aftab"</span></p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#e5c07b' }}>self</span>.<span style={{ color: '#89aacc' }}>location</span> = <span style={{ color: '#ffab00' }}>"Bengaluru, IN"</span></p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#e5c07b' }}>self</span>.<span style={{ color: '#89aacc' }}>focus</span> = [<span style={{ color: '#ffab00' }}>"LLM"</span>, <span style={{ color: '#ffab00' }}>"Agents"</span>, <span style={{ color: '#ffab00' }}>"RAG"</span>]</p>
              <p>&nbsp;</p>
              <p>&nbsp;&nbsp;<span style={{ color: '#c678dd' }}>def</span> <span style={{ color: '#61afef' }}>profile</span>(<span style={{ color: '#e5c07b' }}>self</span>):</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#c678dd' }}>return</span> {'{'}</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#ffab00' }}>"oss_prs"</span>: <span style={{ color: '#d19a66' }}>9</span>, <span style={{ color: '#4a5568' }}># merged across 4 orgs</span></p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#ffab00' }}>"articles"</span>: <span style={{ color: '#d19a66' }}>50</span>,</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#ffab00' }}>"repos"</span>: <span style={{ color: '#d19a66' }}>175</span>,</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#ffab00' }}>"microsoft_oss"</span>: <span style={{ color: '#00e676' }}>True</span>,</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#ffab00' }}>"status"</span>: <span style={{ color: '#00e676' }}>"online"</span></p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;{'}'}</p>
              <p>&nbsp;</p>
              <p><span style={{ color: '#00e676' }}>engineer</span> = AIEngineer()</p>
              <p style={{ color: '#4a5568' }}># ✓ sys.online · BLR</p>
            </div>
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t"
          style={{ borderColor: 'hsl(0 0% 10%)' }}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {[
            { num: '3+',   label: 'Years in AI'       },
            { num: '175+', label: 'Public Repos'     },
            { num: '50+',  label: 'Medium Articles'  },
            { num: '9',    label: 'Merged OSS PRs'   },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <p
                className="text-4xl md:text-5xl font-semibold mb-1"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  background: 'linear-gradient(90deg, #89aacc, #4e85bf)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {num}
              </p>
              <p className="text-xs uppercase tracking-widest" style={{ color: 'hsl(0 0% 40%)' }}>
                {label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
