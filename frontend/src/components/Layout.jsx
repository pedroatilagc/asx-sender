import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import axios from 'axios'
import Sidebar from './Sidebar'
import Header from './Header'
import { useLocation, useNavigate } from 'react-router-dom'
import { toastV } from '../lib/motion'
import { IconMessageCircle } from '@tabler/icons-react'

const API_MENSAGENS = `${import.meta.env.VITE_API_URL}/api/mensagens`

export default function Layout({ children }) {
  const location   = useLocation()
  const navigate   = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [toastMsg, setToastMsg]   = useState(null)

  const ultimoIdRef   = useRef(null)
  const primeiraRef   = useRef(true)
  const timerRef      = useRef(null)

  useEffect(() => {
    const checar = async () => {
      try {
        const res   = await axios.get(`${API_MENSAGENS}/`)
        const lista = Array.isArray(res.data) ? res.data : []

        if (primeiraRef.current) {
          primeiraRef.current = false
          ultimoIdRef.current = lista[0]?.id ?? null
          return
        }

        const topoId = lista[0]?.id ?? null
        if (topoId && topoId !== ultimoIdRef.current) {
          ultimoIdRef.current = topoId
          const nova = lista[0]
          setToastMsg({
            nome:        nova.nome || nova.numero || 'Desconhecido',
            texto:       (nova.mensagem || '').slice(0, 60) || '[mídia]',
            dispositivo: nova.dispositivo || '',
          })
          clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => setToastMsg(null), 6000)
        }
      } catch {}
    }

    checar()
    const id = setInterval(checar, 10000)
    return () => {
      clearInterval(id)
      clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        <main className="flex-1 overflow-y-auto p-6 transition-colors duration-300">
          <div key={location.pathname}>
            {children}
          </div>
        </main>
      </div>

      {/* Toast — nova mensagem recebida */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key="toast-nova-msg"
            variants={toastV}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={() => { setToastMsg(null); clearTimeout(timerRef.current); navigate('/mensagens') }}
            className="fixed bottom-6 right-6 z-50 cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl px-4 py-3.5 flex items-start gap-3 w-80 hover:shadow-2xl transition-shadow"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <IconMessageCircle size={18} className="text-violet-600 dark:text-violet-400" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {toastMsg.nome}
                </span>
                {toastMsg.dispositivo && (
                  <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800 whitespace-nowrap flex-shrink-0">
                    {toastMsg.dispositivo}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{toastMsg.texto}</p>
              <p className="text-[10px] text-violet-500 dark:text-violet-400 mt-1 font-medium">
                Clique para ver mensagens →
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
