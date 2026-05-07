import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { label: 'Home',       href: '#home' },
  { label: 'About',      href: '#about' },
  { label: 'Stack',      href: '#stack' },
  { label: 'Work',       href: '#projects' },
  { label: 'OSS',        href: '#opensource' },
  { label: 'Writing',    href: '#articles' },
  { label: 'Contact',    href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('Home')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, label: string, href: string) => {
    e.preventDefault()
    setActive(label)
    const lenis = (window as unknown as { lenis?: { scrollTo: (target: Element, opts: object) => void } }).lenis
    const el = document.querySelector(href)
    if (!el) return
    if (lenis) {
      lenis.scrollTo(el, { offset: -80, duration: 1.4, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
    } else {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4">
      <div
        className="inline-flex items-center rounded-full backdrop-blur-md border px-2 py-2 transition-shadow duration-300"
        style={{
          borderColor: 'rgba(255,255,255,0.1)',
          background: 'hsl(0 0% 8%)',
          boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {/* Logo */}
        <div className="relative group cursor-pointer">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, #89aacc, #4e85bf)',
              padding: '2px',
            }}
          >
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{ background: 'hsl(0 0% 4%)' }}
            >
              <span
                className="text-[13px] italic"
                style={{ fontFamily: "'Instrument Serif', serif", color: 'hsl(0 0% 96%)' }}
              >
                MA
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-5 mx-2 hidden sm:block" style={{ background: 'hsl(0 0% 12%)' }} />

        {/* Links */}
        {NAV_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            onClick={(e) => handleNav(e, label, href)}
            className="text-xs sm:text-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-all duration-150"
            style={{
              color: active === label ? 'hsl(0 0% 96%)' : 'hsl(0 0% 53%)',
              background: active === label ? 'rgba(255,255,255,0.08)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (active !== label) {
                (e.target as HTMLElement).style.color = 'hsl(0 0% 96%)'
                ;(e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (active !== label) {
                (e.target as HTMLElement).style.color = 'hsl(0 0% 53%)'
                ;(e.target as HTMLElement).style.background = 'transparent'
              }
            }}
          >
            {label}
          </a>
        ))}

        {/* Divider */}
        <div className="w-px h-5 mx-2 hidden sm:block" style={{ background: 'hsl(0 0% 12%)' }} />

        {/* Say hi */}
        <a
          href="#contact"
          onClick={(e) => handleNav(e, 'Contact', '#contact')}
          className="relative group text-xs sm:text-sm rounded-full px-4 py-1.5 sm:py-2 overflow-hidden transition-all duration-200"
          style={{ color: 'hsl(0 0% 96%)' }}
        >
          <span
            className="absolute inset-[-2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 accent-gradient"
          />
          <span
            className="relative z-10 rounded-full px-3 py-1"
            style={{ background: 'hsl(0 0% 8%)' }}
          >
            Say hi ↗
          </span>
        </a>
      </div>
    </nav>
  )
}
