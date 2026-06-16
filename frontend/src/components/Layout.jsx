import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import { useLocation } from 'react-router-dom'
import { pageV } from '../lib/motion'

export default function Layout({ children }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        <main className="flex-1 overflow-y-auto p-6 transition-colors duration-300">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageV}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
