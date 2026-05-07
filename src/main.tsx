import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Lenis from '@studio-freight/lenis'
import './index.css'
import App from './App.tsx'

// Lenis smooth scroll
const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
function raf(time: number) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

// Expose lenis for nav link clicks
;(window as unknown as { lenis: typeof lenis }).lenis = lenis

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
