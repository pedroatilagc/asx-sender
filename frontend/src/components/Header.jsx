import { IconSun, IconMoon } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDarkMode } from '../hooks/useDarkMode'
import logoDark  from '../../logos/logo_darkmode-removebg-preview.png'
import logoLight from '../../logos/logo_lightmode-removebg-preview.png'

export default function Header() {
  const { isDark, toggle } = useDarkMode()

  return (
    <header
      className="w-full flex-shrink-0 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 transition-colors duration-300"
      style={{ height: '52px' }}
    >
      {/* Logo */}
      <div className="flex items-center">
        <img
          src={isDark ? logoDark : logoLight}
          alt="ASX Sender"
          className="h-[104px] w-auto object-contain transition-opacity duration-300 translate-y-[5px] -translate-x-[5px]"
        />
      </div>

      {/* Direita */}
      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <motion.button
          onClick={toggle}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="relative w-[47px] h-[23px] rounded-full border transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 overflow-hidden"
          style={{
            backgroundColor: isDark ? 'var(--primary)' : '#e2e8f0',
            borderColor: isDark ? 'var(--primary-hover)' : '#cbd5e1',
          }}
          aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
          {/* Thumb deslizante */}
          <motion.div
            animate={{ x: isDark ? 27 : 3 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-[3px] w-[17px] h-[17px] rounded-full bg-white shadow-md flex items-center justify-center"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="moon"
                  initial={{ opacity: 0, rotate: -30, scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0,   scale: 1   }}
                  exit={{   opacity: 0, rotate:  30,  scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                >
                  <IconMoon size={10} color="var(--primary)" strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ opacity: 0, rotate: 30,  scale: 0.6 }}
                  animate={{ opacity: 1, rotate: 0,   scale: 1   }}
                  exit={{   opacity: 0, rotate: -30,  scale: 0.6 }}
                  transition={{ duration: 0.2 }}
                >
                  <IconSun size={10} color="#f59e0b" strokeWidth={2.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.button>
      </div>
    </header>
  )
}
