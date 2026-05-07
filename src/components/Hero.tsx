import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import Hls from 'hls.js'

const HLS_SRC = 'https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8'
const ROLES = ['AI Engineer', 'Data Scientist', 'OSS Contributor', 'Backend Developer']

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const nameRef = useRef<HTMLHeadingElement>(null)
  const blurRefs = useRef<HTMLElement[]>([])
  const [roleIdx, setRoleIdx] = useState(0)

  // HLS video
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

  // GSAP entrance
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    if (nameRef.current) {
      tl.fromTo(nameRef.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.2 }, 0.1)
    }
    blurRefs.current.forEach((el, i) => {
      if (el) {
        tl.fromTo(
          el,
          { opacity: 0, filter: 'blur(10px)', y: 20 },
          { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1, stagger: 0.1 },
          0.3 + i * 0.1
        )
      }
    })
  }, [])

  // Role cycling
  useEffect(() => {
    const iv = setInterval(() => setRoleIdx(i => (i + 1) % ROLES.length), 2000)
    return () => clearInterval(iv)
  }, [])

  const addBlurRef = (el: HTMLElement | null) => {
    if (el && !blurRefs.current.includes(el)) blurRefs.current.push(el)
  }

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background video */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover -translate-x-1/2 -translate-y-1/2"
        />
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
        {/* bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48"
          style={{ background: 'linear-gradient(to top, hsl(0 0% 4%), transparent)' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-24">
        {/* Eyebrow */}
        <p
          ref={addBlurRef}
          className="text-xs uppercase tracking-[0.3em] mb-8 opacity-0"
          style={{ color: 'hsl(0 0% 53%)' }}
        >
          SENIOR AI ENGINEER · LLM SYSTEMS &amp; AGENTIC AI · BENGALURU
        </p>

        {/* Name */}
        <h1
          ref={nameRef}
          className="text-6xl md:text-8xl lg:text-[9rem] leading-[0.9] tracking-tight mb-6 opacity-0"
          style={{
            fontFamily: "'Instrument Serif', serif",
            color: 'hsl(0 0% 96%)',
          }}
        >
          Mohammed
          <br />
          <span
            style={{
              fontStyle: 'italic',
              background: 'linear-gradient(90deg, #89aacc, #4e85bf)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Aftab.
          </span>
        </h1>

        {/* Role line */}
        <p
          ref={addBlurRef}
          className="text-sm md:text-base mb-4 opacity-0"
          style={{ color: 'hsl(0 0% 70%)' }}
        >
          A{' '}
          <span
            key={roleIdx}
            className="animate-role-fade-in inline-block italic"
            style={{
              fontFamily: "'Instrument Serif', serif",
              color: 'hsl(0 0% 96%)',
            }}
          >
            {ROLES[roleIdx]}
          </span>{' '}
          based in Bengaluru.
        </p>

        {/* Description */}
        <p
          ref={addBlurRef}
          className="text-sm md:text-base max-w-md mx-auto mb-12 opacity-0"
          style={{ color: 'hsl(0 0% 53%)', lineHeight: 1.7 }}
        >
          Designing and engineering intelligent AI systems — from guardrail infrastructure and
          multi-agent orchestration to RAG pipelines and agentic workflows.
        </p>

        {/* CTAs */}
        <div
          ref={addBlurRef}
          className="inline-flex gap-4 opacity-0"
        >
          <a
            href="#projects"
            className="relative group rounded-full text-sm px-7 py-3.5 font-medium transition-all duration-200 hover:scale-105"
            style={{ background: 'hsl(0 0% 96%)', color: 'hsl(0 0% 4%)' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'hsl(0 0% 4%)'
              ;(e.currentTarget as HTMLElement).style.color = 'hsl(0 0% 96%)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'hsl(0 0% 96%)'
              ;(e.currentTarget as HTMLElement).style.color = 'hsl(0 0% 4%)'
            }}
          >
            See Works
          </a>
          <a
            href="#contact"
            className="rounded-full text-sm px-7 py-3.5 font-medium transition-all duration-200 hover:scale-105 border-2"
            style={{
              borderColor: 'hsl(0 0% 12%)',
              background: 'hsl(0 0% 4%)',
              color: 'hsl(0 0% 96%)',
            }}
          >
            Reach out...
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span
          className="text-xs uppercase tracking-[0.2em]"
          style={{ color: 'hsl(0 0% 53%)' }}
        >
          SCROLL
        </span>
        <div className="w-px h-10 overflow-hidden" style={{ background: 'hsl(0 0% 12%)' }}>
          <div className="w-full h-1/2 accent-gradient animate-scroll-down" />
        </div>
      </div>
    </section>
  )
}
