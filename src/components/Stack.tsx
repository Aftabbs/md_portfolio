import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import * as d3 from 'd3'

// ── Color palette — tuned to sit on hsl(0 0% 4%–8%) dark bg ──
const C: Record<string, string> = {
  center:    '#ffffff',
  agents:    '#89aacc',   // soft blue  — matches accent gradient
  llm:       '#fb923c',   // warm orange
  cloud:     '#fbbf24',   // amber
  vector:    '#2dd4bf',   // teal
  tools:     '#a78bfa',   // violet
  rag:       '#4ade80',   // green
  oss:       '#f472b6',   // pink
}

interface RawNode {
  id: string; label: string; type: 'center' | 'category' | 'leaf'; cat: string
}
interface RawLink {
  s: string; t: string; type?: 'main' | 'cross'; lbl?: string
}

const NODES: RawNode[] = [
  // ── center ──
  { id:'AFTAB',      label:'Aftab',             type:'center',   cat:'center' },

  // ── categories ──
  { id:'AGENTS',     label:'Agent Frameworks',  type:'category', cat:'agents' },
  { id:'LLM',        label:'LLM Models',        type:'category', cat:'llm'    },
  { id:'CLOUD',      label:'Cloud / Infra',     type:'category', cat:'cloud'  },
  { id:'VECTOR',     label:'Vector Databases',  type:'category', cat:'vector' },
  { id:'TOOLS',      label:'Dev Tools',         type:'category', cat:'tools'  },
  { id:'RAG',        label:'RAG & AI Ops',      type:'category', cat:'rag'    },
  { id:'OSS',        label:'Open Source',       type:'category', cat:'oss'    },

  // ── Agent Frameworks ──
  { id:'LangChain',  label:'LangChain',         type:'leaf', cat:'agents' },
  { id:'LangGraph',  label:'LangGraph',         type:'leaf', cat:'agents' },
  { id:'LlamaIndex', label:'LlamaIndex',        type:'leaf', cat:'agents' },
  { id:'AutoGen',    label:'AutoGen',           type:'leaf', cat:'agents' },
  { id:'CrewAI',     label:'CrewAI',            type:'leaf', cat:'agents' },
  { id:'Haystack',   label:'Haystack',          type:'leaf', cat:'agents' },
  { id:'LangSmith',  label:'LangSmith',         type:'leaf', cat:'agents' },
  { id:'DSPy',       label:'DSPy',              type:'leaf', cat:'agents' },

  // ── LLM Models ──
  { id:'OpenAI',     label:'OpenAI GPT-4o',     type:'leaf', cat:'llm' },
  { id:'Claude',     label:'Claude',            type:'leaf', cat:'llm' },
  { id:'HuggingFace',label:'HuggingFace',       type:'leaf', cat:'llm' },
  { id:'Groq',       label:'Groq',              type:'leaf', cat:'llm' },
  { id:'DeepSeek',   label:'DeepSeek',          type:'leaf', cat:'llm' },
  { id:'Gemini',     label:'Gemini',            type:'leaf', cat:'llm' },
  { id:'vLLM',       label:'vLLM',              type:'leaf', cat:'llm' },

  // ── Cloud / Infra ──
  { id:'AzureOAI',   label:'Azure OpenAI',      type:'leaf', cat:'cloud' },
  { id:'CosmosDB',   label:'Cosmos DB',         type:'leaf', cat:'cloud' },
  { id:'AIFoundry',  label:'AI Foundry',        type:'leaf', cat:'cloud' },
  { id:'Bedrock',    label:'AWS Bedrock',       type:'leaf', cat:'cloud' },
  { id:'AzureFuncs', label:'Azure Functions',   type:'leaf', cat:'cloud' },
  { id:'Docker',     label:'Docker',            type:'leaf', cat:'cloud' },
  { id:'SageMaker',  label:'SageMaker',         type:'leaf', cat:'cloud' },

  // ── Vector Databases ──
  { id:'Pinecone',   label:'Pinecone',          type:'leaf', cat:'vector' },
  { id:'Qdrant',     label:'Qdrant',            type:'leaf', cat:'vector' },
  { id:'ChromaDB',   label:'ChromaDB',          type:'leaf', cat:'vector' },
  { id:'FAISS',      label:'FAISS',             type:'leaf', cat:'vector' },
  { id:'Weaviate',   label:'Weaviate',          type:'leaf', cat:'vector' },
  { id:'pgvector',   label:'pgvector',          type:'leaf', cat:'vector' },

  // ── Dev Tools ──
  { id:'Python',     label:'Python',            type:'leaf', cat:'tools' },
  { id:'FastAPI',    label:'FastAPI',           type:'leaf', cat:'tools' },
  { id:'MCP',        label:'MCP Protocol',      type:'leaf', cat:'tools' },
  { id:'MLflow',     label:'MLflow',            type:'leaf', cat:'tools' },

  // ── RAG & AI Ops ──
  { id:'RAGPipe',    label:'RAG Pipelines',     type:'leaf', cat:'rag' },
  { id:'GraphRAG',   label:'GraphRAG',          type:'leaf', cat:'rag' },
  { id:'Guardrails', label:'AI Guardrails',     type:'leaf', cat:'rag' },
  { id:'NL2SQL',     label:'NL2SQL',            type:'leaf', cat:'rag' },
  { id:'RAGAS',      label:'RAGAS',             type:'leaf', cat:'rag' },
  { id:'FineTune',   label:'Fine-Tuning',       type:'leaf', cat:'rag' },

  // ── Open Source ──
  { id:'HaystackPR', label:'Haystack (5 PRs)',  type:'leaf', cat:'oss' },
  { id:'OpenClaw',   label:'openclaw (3 PRs)',  type:'leaf', cat:'oss' },
  { id:'MSContrib',  label:'Microsoft OSS',     type:'leaf', cat:'oss' },
  { id:'LangSmithPR',label:'LangSmith SDK',     type:'leaf', cat:'oss' },
]

const LINKS: RawLink[] = [
  // center → categories
  { s:'AFTAB', t:'AGENTS', type:'main' },
  { s:'AFTAB', t:'LLM',    type:'main' },
  { s:'AFTAB', t:'CLOUD',  type:'main' },
  { s:'AFTAB', t:'VECTOR', type:'main' },
  { s:'AFTAB', t:'TOOLS',  type:'main' },
  { s:'AFTAB', t:'RAG',    type:'main' },
  { s:'AFTAB', t:'OSS',    type:'main' },

  // category → leaf
  { s:'AGENTS', t:'LangChain'  }, { s:'AGENTS', t:'LangGraph' }, { s:'AGENTS', t:'LlamaIndex' },
  { s:'AGENTS', t:'AutoGen'    }, { s:'AGENTS', t:'CrewAI'    }, { s:'AGENTS', t:'Haystack'   },
  { s:'AGENTS', t:'LangSmith'  }, { s:'AGENTS', t:'DSPy'      },

  { s:'LLM', t:'OpenAI'     }, { s:'LLM', t:'Claude'      }, { s:'LLM', t:'HuggingFace' },
  { s:'LLM', t:'Groq'       }, { s:'LLM', t:'DeepSeek'    }, { s:'LLM', t:'Gemini'      },
  { s:'LLM', t:'vLLM'       },

  { s:'CLOUD', t:'AzureOAI' }, { s:'CLOUD', t:'CosmosDB'   }, { s:'CLOUD', t:'AIFoundry' },
  { s:'CLOUD', t:'Bedrock'  }, { s:'CLOUD', t:'AzureFuncs' }, { s:'CLOUD', t:'Docker'    },
  { s:'CLOUD', t:'SageMaker'},

  { s:'VECTOR', t:'Pinecone' }, { s:'VECTOR', t:'Qdrant'   }, { s:'VECTOR', t:'ChromaDB' },
  { s:'VECTOR', t:'FAISS'    }, { s:'VECTOR', t:'Weaviate' }, { s:'VECTOR', t:'pgvector' },

  { s:'TOOLS', t:'Python'  }, { s:'TOOLS', t:'FastAPI' }, { s:'TOOLS', t:'MCP'    }, { s:'TOOLS', t:'MLflow' },

  { s:'RAG', t:'RAGPipe'    }, { s:'RAG', t:'GraphRAG'   }, { s:'RAG', t:'Guardrails' },
  { s:'RAG', t:'NL2SQL'     }, { s:'RAG', t:'RAGAS'      }, { s:'RAG', t:'FineTune'   },

  { s:'OSS', t:'HaystackPR' }, { s:'OSS', t:'OpenClaw' }, { s:'OSS', t:'MSContrib' }, { s:'OSS', t:'LangSmithPR' },

  // ── cross-connections (only genuinely related pairs) ──

  // Python is the primary language for the whole stack
  { s:'Python', t:'LangChain',  type:'cross', lbl:'primary lang'    },
  { s:'Python', t:'FastAPI',    type:'cross', lbl:'primary lang'    },
  { s:'Python', t:'Haystack',   type:'cross', lbl:'primary lang'    },

  // Agent frameworks drive RAG and graph RAG
  { s:'LangChain', t:'RAGPipe', type:'cross', lbl:'RAG pipeline'    },
  { s:'LangGraph', t:'RAGPipe', type:'cross', lbl:'agentic RAG'     },
  { s:'LlamaIndex',t:'RAGPipe', type:'cross', lbl:'data-aware RAG'  },
  { s:'LangChain', t:'GraphRAG',type:'cross', lbl:'graph RAG'       },

  // RAG pipelines use vector DBs
  { s:'RAGPipe',   t:'Pinecone', type:'cross', lbl:'vector search'  },
  { s:'RAGPipe',   t:'ChromaDB', type:'cross', lbl:'local vector'   },
  { s:'RAGPipe',   t:'pgvector', type:'cross', lbl:'pgvector ext.'  },
  { s:'RAGPipe',   t:'Weaviate', type:'cross', lbl:'hybrid search'  },

  // RAGAS / LangSmith are used to evaluate RAG
  { s:'RAGAS',     t:'RAGPipe',  type:'cross', lbl:'RAG evaluation' },
  { s:'LangSmith', t:'RAGPipe',  type:'cross', lbl:'tracing'        },

  // Guardrails use HuggingFace SLMs
  { s:'HuggingFace',t:'Guardrails',type:'cross', lbl:'SLM models'   },

  // MCP connects tools to LLMs — Cosmos DB was the authored server
  { s:'CosmosDB',  t:'MCP',      type:'cross', lbl:'MCP Server (OSS)'},
  { s:'MCP',       t:'OpenAI',   type:'cross', lbl:'tool protocol'   },
  { s:'MCP',       t:'Claude',   type:'cross', lbl:'tool protocol'   },

  // Cloud connections
  { s:'AzureOAI',  t:'AIFoundry',type:'cross', lbl:'platform'        },
  { s:'Bedrock',   t:'SageMaker',type:'cross', lbl:'AWS ML suite'    },

  // MLflow tracks fine-tuning experiments
  { s:'MLflow',    t:'FineTune', type:'cross', lbl:'experiment tracking'},

  // vLLM used for local LLM deployment / fine-tuned model serving
  { s:'vLLM',      t:'FineTune', type:'cross', lbl:'model serving'   },

  // OSS cross-refs
  { s:'Haystack',  t:'HaystackPR',  type:'cross', lbl:'5 merged PRs'   },
  { s:'LangSmith', t:'LangSmithPR', type:'cross', lbl:'1 merged PR'    },
  { s:'CosmosDB',  t:'MSContrib',   type:'cross', lbl:'authored'        },
]

const LEGEND_CATS = [
  { key:'agents', label:'Agent Frameworks' },
  { key:'llm',    label:'LLM Models'       },
  { key:'cloud',  label:'Cloud / Infra'    },
  { key:'vector', label:'Vector DBs'       },
  { key:'tools',  label:'Dev Tools'        },
  { key:'rag',    label:'RAG & AI Ops'     },
  { key:'oss',    label:'Open Source'      },
]

type D3Node = RawNode & d3.SimulationNodeDatum
type D3Link = d3.SimulationLinkDatum<D3Node> & { type?: string; lbl?: string }

const nodeR = (n: D3Node) => n.type === 'center' ? 26 : n.type === 'category' ? 16 : 9

export default function Stack() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (svgRef.current) { svgRef.current.remove(); svgRef.current = null }

    const W = container.clientWidth || 960
    const H = container.clientHeight || 680

    const svg = d3.select(container).append('svg')
      .attr('width', W).attr('height', H)
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%').style('height', '100%')

    svgRef.current = svg.node()!

    // zoom + pan
    const g = svg.append('g')
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (e) => g.attr('transform', e.transform))
    )

    // glow filters
    const defs = svg.append('defs')
    ;(['center', 'category', 'leaf'] as const).forEach(t => {
      const f = defs.append('filter').attr('id', `aglow-${t}`)
        .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
      f.append('feGaussianBlur')
        .attr('stdDeviation', t === 'center' ? 6 : t === 'category' ? 4 : 2)
        .attr('result', 'blur')
      const merge = f.append('feMerge')
      merge.append('feMergeNode').attr('in', 'blur')
      merge.append('feMergeNode').attr('in', 'SourceGraphic')
    })

    const nodes: D3Node[] = NODES.map(d => ({ ...d }))
    const links: D3Link[] = LINKS.map(d => ({ ...d, source: d.s, target: d.t }))

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(links).id(d => d.id)
        .distance(d => (d as D3Link).type === 'main' ? 130 : 80)
        .strength(d => (d as D3Link).type === 'main' ? 1 : 0.5))
      .force('charge', d3.forceManyBody<D3Node>().strength(d =>
        d.type === 'center' ? -2000 : d.type === 'category' ? -600 : -200))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide<D3Node>().radius(d => nodeR(d) + 14))
      .alphaDecay(0.025)

    // tooltip
    const tip = d3.select(container).append('div')
      .style('position', 'absolute')
      .style('background', 'rgba(10,12,20,0.95)')
      .style('border', '1px solid rgba(137,170,204,0.25)')
      .style('border-radius', '8px')
      .style('padding', '7px 13px')
      .style('font-size', '11px')
      .style('font-family', 'monospace')
      .style('color', 'rgba(220,230,245,0.9)')
      .style('pointer-events', 'none')
      .style('opacity', '0')
      .style('transition', 'opacity 0.15s')
      .style('z-index', '20')
      .style('white-space', 'nowrap')

    // links
    const linkEl = g.append('g').selectAll<SVGLineElement, D3Link>('line')
      .data(links).join('line')
      .attr('stroke', d => d.type === 'cross' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)')
      .attr('stroke-width', d => d.type === 'cross' ? 1.2 : 1)
      .attr('stroke-dasharray', d => d.type === 'cross' ? '4 3' : 'none')

    // node groups
    const nodeEl = g.append('g').selectAll<SVGGElement, D3Node>('g')
      .data(nodes).join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, D3Node>()
          .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
      )

    // glow halo
    nodeEl.append('circle')
      .attr('r', d => nodeR(d) + (d.type === 'center' ? 10 : d.type === 'category' ? 6 : 3))
      .attr('fill', d => C[d.cat] ?? '#fff')
      .attr('opacity', d => d.type === 'center' ? 0.12 : 0.07)
      .attr('filter', d => `url(#aglow-${d.type})`)

    // main circle
    nodeEl.append('circle')
      .attr('r', nodeR)
      .attr('fill', d => d.type === 'center' ? '#fff' : (C[d.cat] ?? '#fff') + (d.type === 'category' ? '22' : '18'))
      .attr('stroke', d => C[d.cat] ?? '#fff')
      .attr('stroke-width', d => d.type === 'center' ? 2.5 : d.type === 'category' ? 1.8 : 1.2)
      .attr('filter', d => `url(#aglow-${d.type})`)

    // labels
    nodeEl.append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => nodeR(d) + 12)
      .attr('font-size', d => d.type === 'center' ? 13 : d.type === 'category' ? 11 : 9.5)
      .attr('font-family', "'Inter', sans-serif")
      .attr('font-weight', d => d.type !== 'leaf' ? '600' : '400')
      .attr('fill', d => d.type === 'center' ? '#fff' : d.type === 'category' ? C[d.cat] : 'rgba(255,255,255,0.72)')
      .attr('pointer-events', 'none')

    // hover
    nodeEl
      .on('mouseenter', function(_e, d) {
        const connected = new Set(
          links.filter(l => {
            const sid = (l.source as D3Node).id ?? l.source
            const tid = (l.target as D3Node).id ?? l.target
            return sid === d.id || tid === d.id
          }).flatMap(l => [(l.source as D3Node).id ?? l.source, (l.target as D3Node).id ?? l.target])
        )
        nodeEl.attr('opacity', n => connected.has(n.id) || n.id === d.id ? 1 : 0.15)
        linkEl
          .attr('opacity', l => {
            const sid = (l.source as D3Node).id ?? l.source
            const tid = (l.target as D3Node).id ?? l.target
            return sid === d.id || tid === d.id ? 1 : 0.04
          })
          .attr('stroke', l => {
            const sid = (l.source as D3Node).id ?? l.source
            const tid = (l.target as D3Node).id ?? l.target
            return sid === d.id || tid === d.id
              ? (l.type === 'cross' ? 'rgba(251,191,36,0.8)' : 'rgba(255,255,255,0.5)')
              : (l.type === 'cross' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)')
          })
        if (d.type !== 'center') {
          const html = d.type === 'category'
            ? `<strong style="color:${C[d.cat]}">${d.label}</strong>`
            : `<strong style="color:${C[d.cat]}">${d.label}</strong><br><span style="opacity:0.5">${d.cat}</span>`
          tip.html(html).style('opacity', '1')
        }
      })
      .on('mousemove', (e: MouseEvent) => {
        const rect = container.getBoundingClientRect()
        tip.style('left', (e.clientX - rect.left + 14) + 'px')
           .style('top',  (e.clientY - rect.top - 10) + 'px')
      })
      .on('mouseleave', () => {
        nodeEl.attr('opacity', 1)
        linkEl.attr('opacity', 1)
          .attr('stroke', d => d.type === 'cross' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)')
        tip.style('opacity', '0')
      })

    // link labels on hover handled via nodeEl; link labels for cross links
    linkEl
      .on('mouseenter', function(_e, d) {
        if (!d.lbl) return
        tip.html(`<span style="color:rgba(251,191,36,0.9)">${d.lbl}</span>`).style('opacity', '1')
        d3.select(this).attr('stroke', 'rgba(251,191,36,0.8)').attr('stroke-width', 2)
      })
      .on('mousemove', (e: MouseEvent) => {
        const rect = container.getBoundingClientRect()
        tip.style('left', (e.clientX - rect.left + 14) + 'px')
           .style('top',  (e.clientY - rect.top - 10) + 'px')
      })
      .on('mouseleave', function(_e, d) {
        tip.style('opacity', '0')
        d3.select(this)
          .attr('stroke', d.type === 'cross' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)')
          .attr('stroke-width', d.type === 'cross' ? 1.2 : 1)
      })

    // tick
    sim.on('tick', () => {
      linkEl
        .attr('x1', d => (d.source as D3Node).x!)
        .attr('y1', d => (d.source as D3Node).y!)
        .attr('x2', d => (d.target as D3Node).x!)
        .attr('y2', d => (d.target as D3Node).y!)
      nodeEl.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => {
      sim.stop()
      tip.remove()
    }
  }, [])

  return (
    <section id="stack" className="py-20 md:py-28 px-6 md:px-10 lg:px-16" style={{ background: 'hsl(0 0% 4%)', overflow: 'hidden' }}>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-px" style={{ background: 'hsl(0 0% 12%)' }} />
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: 'hsl(0 0% 53%)' }}>02 · stack.map()</span>
        </div>

        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ color: 'hsl(0 0% 96%)' }}>
            AI Skills{' '}
            <span className="italic" style={{ fontFamily: "'Instrument Serif', serif" }}>Ontology</span>
          </h2>
          <p className="text-xs mt-2" style={{ color: 'hsl(0 0% 40%)', fontFamily: 'monospace' }}>
            // drag nodes · scroll to zoom · hover for connections
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <div
            ref={containerRef}
            className="relative w-full rounded-2xl border"
            style={{ height: 660, borderColor: 'hsl(0 0% 9%)', background: 'hsl(0 0% 5%)', cursor: 'grab' }}
          />

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 justify-center">
            {LEGEND_CATS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: C[key] }} />
                <span className="text-xs" style={{ color: 'rgba(200,220,245,0.55)' }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
