import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import './index.css'
import LoadingScreen from './components/LoadingScreen'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Stack from './components/Stack'
import Projects from './components/Projects'
import OpenSource from './components/OpenSource'
import Articles from './components/Articles'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      {!isLoading && (
        <>
          <Navbar />
          <main>
            <Hero />
            <About />
            <Stack />
            <Projects />
            <OpenSource />
            <Articles />
            <Contact />
          </main>
          <Footer />
        </>
      )}
    </>
  )
}
