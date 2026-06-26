import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  IconMessageCircle, IconLoader, IconSearch,
  IconRefresh, IconInbox, IconClock, IconDeviceMobile,
} from '@tabler/icons-react'
import { fadeUp, stagger, staggerItem } from '../lib/motion'

const API = `${import.meta.env.VITE_API_URL}/api/mensagens`

function formatarNumero(num) {
  const n = String(num || '').replace(/\D/g, '')
  if (n.length === 13) return `+${n.slice(0, 2)} (${n.slice(2, 4)}) ${n.slice(4, 9)}-${n.slice(9)}`
  if (n.length === 12) return `+${n.slice(0, 2)} (${n.slice(2, 4)}) ${n.slice(4, 8)}-${n.slice(8)}`
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`
  return n || '—'
}

function tempoRelativo(timestamp) {
  if (!timestamp) return '—'
  const ts   = timestamp > 1e10 ? timestamp : timestamp * 1000
  const diff = Date.now() - ts
  const seg  = Math.floor(diff / 1000)
  const min  = Math.floor(seg / 60)
  const h    = Math.floor(min / 60)
  const d    = Math.floor(h / 24)
  if (d > 0)   return `há ${d}d`
  if (h > 0)   return `há ${h}h`
  if (min > 0) return `há ${min}min`
  if (seg > 5) return `há ${seg}s`
  return 'agora'
}

export default function Mensagens() {
  const [mensagens, setMensagens]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [atualizando, setAtualizando]   = useState(false)
  const [busca, setBusca]               = useState('')
  const [filtroDisp, setFiltroDisp]     = useState('')
  const [novosIds, setNovosIds]         = useState(new Set())
  const [rotacionando, setRotacionando] = useState(false)
  const idsConhecidosRef                = useRef(null)

  const carregar = async (manual = false) => {
    if (manual) {
      setAtualizando(true)
      setRotacionando(true)
    }
    try {
      const res   = await axios.get(`${API}/`)
      const dados = Array.isArray(res.data) ? res.data : []

      if (idsConhecidosRef.current === null) {
        idsConhecidosRef.current = new Set(dados.map(m => m.id))
        setNovosIds(new Set())
      } else {
        const novos = new Set()
        dados.forEach(m => {
          if (!idsConhecidosRef.current.has(m.id)) novos.add(m.id)
        })
        if (novos.size > 0) {
          setNovosIds(novos)
          setTimeout(() => setNovosIds(new Set()), 2500)
        }
        idsConhecidosRef.current = new Set(dados.map(m => m.id))
      }

      setMensagens(dados)
    } catch {}
    finally {
      setLoading(false)
      if (manual) {
        setAtualizando(false)
        setTimeout(() => setRotacionando(false), 600)
      }
    }
  }

  useEffect(() => {
    carregar()
    const id = setInterval(() => carregar(), 10000)
    return () => clearInterval(id)
  }, [])

  const agora     = Date.now()
  const h24ms     = 24 * 60 * 60 * 1000
  const ultimas24 = mensagens.filter(m => {
    const ts = m.timestamp > 1e10 ? m.timestamp : m.timestamp * 1000
    return agora - ts < h24ms
  }).length

  const dispositivos = [...new Set(mensagens.map(m => m.dispositivo).filter(Boolean))]

  const filtradas = mensagens.filter(m => {
    const q      = busca.toLowerCase()
    const textoOk = !q ||
      (m.nome      || '').toLowerCase().includes(q) ||
      (m.numero    || '').includes(q) ||
      (m.mensagem  || '').toLowerCase().includes(q)
    const dispOk  = !filtroDisp || m.dispositivo === filtroDisp
    return textoOk && dispOk
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Mensagens</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Mensagens recebidas em tempo real</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => carregar(true)}
          disabled={atualizando}
          className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <motion.span
            animate={{ rotate: rotacionando ? 360 : 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{ display: 'flex' }}
          >
            <IconRefresh size={15} />
          </motion.span>
          Atualizar
        </motion.button>
      </motion.div>

      {/* KPIs */}
      <motion.div
        className="grid grid-cols-2 gap-4 max-w-xs"
        variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        <motion.div
          variants={staggerItem}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold mt-1 text-slate-700 dark:text-slate-200">{mensagens.length}</p>
        </motion.div>
        <motion.div
          variants={staggerItem}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Últimas 24h</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{ultimas24}</p>
        </motion.div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        className="flex items-center gap-3 flex-wrap"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, número ou mensagem..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>
        {dispositivos.length > 0 && (
          <select
            value={filtroDisp}
            onChange={e => setFiltroDisp(e.target.value)}
            className="py-2 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer transition-colors"
          >
            <option value="">Todos os dispositivos</option>
            {dispositivos.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
      </motion.div>

      {/* Tabela */}
      <motion.div
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconMessageCircle size={16} className="text-violet-500 dark:text-violet-400" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mensagens Recebidas</h3>
          </div>
          {!loading && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {filtradas.length} {filtradas.length === 1 ? 'mensagem' : 'mensagens'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <IconLoader size={22} className="animate-spin mr-2" />
            <span className="text-sm">Carregando mensagens...</span>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <IconInbox size={28} strokeWidth={1.25} className="text-slate-400 dark:text-slate-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {busca || filtroDisp ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem recebida ainda'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                {busca || filtroDisp
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Quando alguém responder seus disparos, as mensagens aparecem aqui automaticamente.'}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                {['Nome', 'Número', 'Dispositivo', 'Mensagem', 'Recebido em'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody
              className="divide-y divide-slate-100 dark:divide-slate-700"
              variants={stagger} initial="hidden" animate="show"
            >
              {filtradas.map(m => (
                <motion.tr
                  key={m.id}
                  variants={staggerItem}
                  className={`transition-colors duration-700 ${
                    novosIds.has(m.id)
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {/* Nome */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">
                          {((m.nome || m.numero || '?')[0] || '?').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {m.nome || <span className="text-slate-400 dark:text-slate-500 font-normal">—</span>}
                      </span>
                    </div>
                  </td>

                  {/* Número */}
                  <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {formatarNumero(m.numero)}
                  </td>

                  {/* Dispositivo */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800">
                      <IconDeviceMobile size={11} strokeWidth={2.5} />
                      {m.dispositivo}
                    </span>
                  </td>

                  {/* Mensagem */}
                  <td className="px-5 py-3.5 max-w-[300px]">
                    {m.mensagem ? (
                      <span
                        className="text-sm text-slate-600 dark:text-slate-300 block truncate"
                        title={m.mensagem}
                      >
                        {m.mensagem}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">[mídia]</span>
                    )}
                  </td>

                  {/* Recebido em */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      <IconClock size={12} strokeWidth={2} />
                      {tempoRelativo(m.timestamp)}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        )}
      </motion.div>
    </div>
  )
}
