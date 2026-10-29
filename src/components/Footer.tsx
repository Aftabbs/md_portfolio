export default function Footer() {
  return (
    <footer
      className="relative z-10 px-6 md:px-10 lg:px-16 pt-44 pb-8 flex flex-col items-center gap-5"
      style={{ background: 'transparent' }}
    >
      {/* Shown and updated by the koi aquarium; hidden until it starts, and for reduced motion. */}
      <p
        data-koi-avoid="text"
        data-koi-hint
        hidden
        className="text-xs select-none"
        style={{ color: 'hsl(0 0% 70%)', fontFamily: 'monospace', letterSpacing: '0.04em' }}
      >
        Tap or click the water to feed the koi · <span data-koi-fed style={{ color: '#89aacc' }}>0</span> fed
      </p>
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
        <p data-koi-avoid="text" className="text-xs" style={{ color: 'hsl(0 0% 60%)', fontFamily: 'monospace' }}>
          © 2026 Mohammed Aftab · Built with code &amp; curiosity · BLR
        </p>
        <div data-koi-avoid className="flex gap-6">
          {[
            { label: 'GitHub',   href: 'https://github.com/Aftabbs' },
            { label: 'LinkedIn', href: 'https://linkedin.com/in/mohammed-aftab-526b7a257/' },
            { label: 'Medium',   href: 'https://medium.com/@aftab001x' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs transition-colors duration-150"
              style={{ color: 'hsl(0 0% 60%)', fontFamily: 'monospace', textDecoration: 'none' }}
              onMouseEnter={e => { (e.target as HTMLElement).style.color = 'hsl(0 0% 85%)' }}
              onMouseLeave={e => { (e.target as HTMLElement).style.color = 'hsl(0 0% 60%)' }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
