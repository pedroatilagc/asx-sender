import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  IconDeviceMobile, IconSend, IconTemplate, IconUsers,
  IconChartBar, IconChevronLeft, IconChevronRight, IconMessageCircle,
} from '@tabler/icons-react'
import { stagger, staggerItem, sidebarV, sidebarLabelV } from '../lib/motion'

const navItems = [
  { path: '/dispositivos', label: 'Dispositivos',  Icon: IconDeviceMobile },
  { path: '/campanhas',    label: 'Campanhas',     Icon: IconSend },
  { path: '/modelos',      label: 'Modelos',       Icon: IconTemplate },
  { path: '/contatos',     label: 'Contatos',      Icon: IconUsers },
  { path: '/relatorios',   label: 'Relatórios',    Icon: IconChartBar      },
  { path: '/mensagens',    label: 'Mensagens',     Icon: IconMessageCircle },
]

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <motion.aside
      variants={sidebarV}
      animate={collapsed ? 'collapsed' : 'expanded'}
      initial={false}
      className="bg-slate-100 dark:bg-slate-900 flex flex-col h-full flex-shrink-0 overflow-hidden border-r border-slate-200 dark:border-slate-700 transition-colors duration-300"
    >
      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-hidden">
        {!collapsed && (
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2 whitespace-nowrap">
            Menu
          </p>
        )}
        <motion.ul
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-0.5 list-none p-0 m-0"
        >
          {navItems.map(({ path, label, Icon }) => (
            <motion.li key={path} variants={staggerItem}>
              <NavLink
                to={path}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={17} strokeWidth={isActive ? 2 : 1.75} className="flex-shrink-0" />
                    <motion.span
                      variants={sidebarLabelV}
                      animate={collapsed ? 'collapsed' : 'expanded'}
                      initial={false}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  </>
                )}
              </NavLink>
            </motion.li>
          ))}
        </motion.ul>
      </nav>

      {/* Toggle + Footer */}
      <div className="px-2 py-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          {collapsed
            ? <IconChevronRight size={16} strokeWidth={2} />
            : <IconChevronLeft size={16} strokeWidth={2} />
          }
        </button>
        {!collapsed && (
          <p className="text-slate-400 dark:text-slate-500 text-xs text-center mt-2 whitespace-nowrap">ASX Promotora © 2026</p>
        )}
      </div>
    </motion.aside>
  )
}
