import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onComplete: () => void
}

const WORDS = ['Engineer', 'Reason', 'Deploy']
const DURATION_MS = 2700

export default function LoadingScreen({ onComplete }: Props) {
  const [count, setCount] = useState(0)
  const [wordIdx, setWordIdx] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    startRef.current = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const pct = Math.min(Math.floor((elapsed / DURATION_MS) * 100), 100)
      setCount(pct)
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setTimeout(onComplete, 400)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [onComplete])

  useEffect(() => {
    const iv = setInterval(() => setWordIdx(i => (i + 1) % WORDS.length), 900)
    return () => clearInterval(iv)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'hsl(0 0% 4%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* top-left label */}
      <motion.p
        className="absolute top-8 left-8 text-xs tracking-[0.3em] uppercase"
        style={{ color: 'hsl(0 0% 53%)' }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        Portfolio
      </motion.p>

      {/* cycling word */}
      <div className="overflow-hidden mb-8">
        <AnimatePresence mode="wait">
          <motion.p
            key={wordIdx}
            className="text-6xl md:text-8xl lg:text-9xl italic"
            style={{
              fontFamily: "'Instrument Serif', serif",
              color: 'rgba(245,245,245,0.8)',
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {WORDS[wordIdx]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* counter */}
      <p
        className="absolute bottom-16 right-10 text-7xl md:text-9xl tabular-nums"
        style={{
          fontFamily: "'Instrument Serif', serif",
          color: 'hsl(0 0% 96%)',
        }}
      >
        {String(count).padStart(3, '0')}
      </p>

      {/* progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="h-full accent-gradient origin-left"
          style={{
            transform: `scaleX(${count / 100})`,
            boxShadow: '0 0 8px rgba(137,170,204,0.35)',
            transition: 'transform 0.05s linear',
          }}
        />
      </div>
    </motion.div>
  )
}
