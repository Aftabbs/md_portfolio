import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import Hls from 'hls.js'

const HLS_SRC = 'https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8'

const CONTACT_LINKS = [
  { icon: '@',  label: 'Email',    val: 'aftab001x@gmail.com',              href: 'mailto:aftab001x@gmail.com' },
  { icon: 'in', label: 'LinkedIn', val: 'Mohammed Aftab',                    href: 'https://linkedin.com/in/mohammed-aftab-526b7a257/' },
  { icon: '{}', label: 'GitHub',   val: 'github.com/Aftabbs',               href: 'https://github.com/Aftabbs' },
  { icon: '✍',  label: 'Medium',   val: '@aftab001x',                        href: 'https://medium.com/@aftab001x' },
]

const MARQUEE_TEXT = 'BUILDING THE FUTURE • '

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

export default function Contact() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const marqueeRef = useRef<HTMLDivElement>(null)
  const [uptime, setUptime] = useState('')

  // HLS video (flipped)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(HLS_SRC)
      hls.attachMedia(video)
      return () => hls.destroy()
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = HLS_SRC
    }
  }, [])

  // GSAP marquee
  useEffect(() => {
    if (!marqueeRef.current) return
    const tween = gsap.to(marqueeRef.current, {
      xPercent: -50,
      duration: 40,
      ease: 'none',
      repeat: -1,
    })
    return () => { tween.kill() }
  }, [])

  // Uptime counter
  useEffect(() => {
    const start = new Date('2022-01-01').getTime()
    const tick = () => {
      const d = Date.now() - start
      const days = Math.floor(d / 86400000)
      const hrs = Math.floor((d % 86400000) / 3600000)
      const mins = Math.floor((d % 3600000) / 60000)
      const secs = Math.floor((d % 60000) / 1000)
      setUptime(`${days}d ${hrs}h ${mins}m ${secs}s`)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])

  return (
    <section
      id="contact"
      className="relative py-20 md:py-28 px-6 md:px-10 lg:px-16 overflow-hidden"
      style={{ background: 'hsl(0 0% 4%)' }}
    >
      {/* Background video flipped */}
      <div className="absolute inset-0 overflow-hidden" style={{ transform: 'scaleY(-1)', opacity: 0.15 }}>
        <video
          ref={videoRef}
          autoPlay muted loop playsInline
          className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover -translate-x-1/2 -translate-y-1/2"
        />
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-px" style={{ background: 'hsl(0 0% 12%)' }} />
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: 'hsl(0 0% 53%)' }}>06 · contact.ssh</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Left */}
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}>
            <h2
              className="text-4xl md:text-5xl font-semibold tracking-tight mb-5 leading-[1.1]"
              style={{ color: 'hsl(0 0% 96%)', fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}
            >
              Let's build
              <br />something
              <br />remarkable.
            </h2>
            <p className="text-sm mb-8" style={{ color: 'hsl(0 0% 50%)', lineHeight: 1.8 }}>
              Open to collaborations on LLM infrastructure, agentic workflow design, AI governance,
              and frontier research. Always up for a conversation about where AI is actually going.
            </p>
            <div className="flex flex-col gap-3">
              {CONTACT_LINKS.map(({ icon, label, val, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 no-underline"
                  style={{ borderColor: 'hsl(0 0% 10%)', background: 'hsl(0 0% 6%)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(137,170,204,0.25)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'hsl(0 0% 10%)' }}
                >
                  <span className="text-sm min-w-5" style={{ color: '#89aacc', fontFamily: 'monospace' }}>{icon}</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'hsl(0 0% 40%)' }}>{label}</p>
                    <p className="text-sm font-medium" style={{ color: 'hsl(0 0% 88%)' }}>{val}</p>
                  </div>
                  <span className="ml-auto text-sm" style={{ color: 'hsl(0 0% 35%)' }}>→</span>
                </a>
              ))}
            </div>
          </motion.div>

          {/* Right: system status */}
          <motion.div
            className="rounded-2xl border p-6"
            style={{ borderColor: 'hsl(0 0% 10%)', background: 'hsl(0 0% 6%)' }}
            variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            <p className="text-xs uppercase tracking-[0.12em] mb-5" style={{ color: '#89aacc', fontFamily: 'monospace' }}>
              // system.status
            </p>
            {[
              { key: 'node',       val: 'Mohammed Aftab',          green: false },
              { key: 'location',   val: 'Bengaluru, IN',            green: false },
              { key: 'focus',      val: 'LLM + Agentic AI',         green: false },
              { key: 'oss_status', val: '4 merged · 12 open PRs',   green: true  },
              { key: 'articles',   val: '50+ on Medium',             green: true  },
              { key: 'uptime',     val: uptime,                     green: true  },
            ].map(({ key, val, green }) => (
              <div
                key={key}
                className="flex justify-between items-center py-3 border-b last:border-b-0"
                style={{ borderColor: 'hsl(0 0% 9%)', fontFamily: 'monospace', fontSize: '12px' }}
              >
                <span style={{ color: 'hsl(0 0% 45%)' }}>{key}</span>
                <span style={{ color: green ? '#00e676' : '#89aacc' }}>{val}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative mt-20 overflow-hidden" style={{ whiteSpace: 'nowrap' }}>
        <div
          ref={marqueeRef}
          className="inline-block text-6xl md:text-8xl font-semibold tracking-tight select-none"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.04)',
            width: '200%',
          }}
        >
          {MARQUEE_TEXT.repeat(10)}&nbsp;{MARQUEE_TEXT.repeat(10)}
        </div>
      </div>
    </section>
  )
}
