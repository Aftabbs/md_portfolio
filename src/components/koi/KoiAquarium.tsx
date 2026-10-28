import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { startKoiAquarium } from './koiEngine'

/**
 * Wraps page sections in a pond: ASCII koi swim on a canvas behind the children.
 * Children mark anything the koi should fade beneath with data-koi-avoid
 * (data-koi-avoid="text" measures just the text of the element), and may include
 * elements with data-koi-hint and data-koi-fed for the feed-the-koi hint and counter.
 */
export default function KoiAquarium({ children }: { children: ReactNode }) {
  const pondRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const pond = pondRef.current
    const canvas = canvasRef.current
    if (!pond || !canvas) return
    return startKoiAquarium(pond, canvas)
  }, [])

  return (
    <div
      ref={pondRef}
      className="relative overflow-hidden"
      style={{
        isolation: 'isolate',
        background: 'linear-gradient(180deg, hsl(0 0% 4%) 0%, hsl(214 34% 6%) 55%, hsl(212 38% 9%) 100%)',
      }}
    >
      {/* Faded in over the first 140px so koi never pop in at a hard edge; keep in sync with MASK_FADE_PX. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          zIndex: 1,
          maskImage: 'linear-gradient(to bottom, transparent 0, #000 140px)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 140px)',
        }}
      />
      {children}
    </div>
  )
}
