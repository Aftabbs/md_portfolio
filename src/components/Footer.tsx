export default function Footer() {
  return (
    <footer
      className="border-t px-6 md:px-10 lg:px-16 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
      style={{ borderColor: 'hsl(0 0% 9%)', background: 'hsl(0 0% 4%)' }}
    >
      <p className="text-xs" style={{ color: 'hsl(0 0% 35%)', fontFamily: 'monospace' }}>
        © 2026 Mohammed Aftab · Built with code &amp; curiosity · BLR
      </p>
      <div className="flex gap-6">
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
            style={{ color: 'hsl(0 0% 35%)', fontFamily: 'monospace', textDecoration: 'none' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = 'hsl(0 0% 75%)' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = 'hsl(0 0% 35%)' }}
          >
            {label}
          </a>
        ))}
      </div>
    </footer>
  )
}
