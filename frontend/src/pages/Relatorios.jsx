import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconChartBar, IconLoader, IconSearch, IconEye, IconTrash,
  IconPlayerPause, IconPlayerPlay, IconCircleX, IconRefresh,
  IconX, IconCheck, IconAlertTriangle,
} from '@tabler/icons-react'
import { fadeUp, stagger, staggerItem, toastV } from '../lib/motion'
import ModalWrapper from '../components/ModalWrapper'

const API = 'http://localhost:8000/api/campanhas'

const STATUS_BADGE = {
  rascunho:  'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  enviando:  'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  pausada:   'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  concluida: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  cancelada: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
}
const STATUS_LABEL = {
  rascunho: 'Rascunho', enviando: 'Enviando', pausada: 'Pausada',
  concluida: 'Concluída', cancelada: 'Cancelada',
}
const STATUS_CONTATO_BADGE = {
  pendente: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
  enviado:  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  falhou:   'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  pulado:   'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
}

const formatarData = (d) => {
  if (!d) return '—'
  try { return new Date(d).toLocaleString('pt-BR') } catch { return d }
}

function ModalProgresso({ campanha: campanhaInicial, onClose, onAtualizar }) {
  const [campanha, setCampanha] = useState(campanhaInicial)
  const [contatos, setContatos] = useState([])
  const [ctrl, setCtrl]         = useState(false)
  const intervalRef             = useRef(null)

  const atualizar = useCallback(async () => {
    try {
      const [pc, ct] = await Promise.all([
        axios.get(`${API}/${campanhaInicial.id}/progresso/`),
        axios.get(`${API}/${campanhaInicial.id}/contatos/`),
      ])
      setCampanha(pc.data)
      setContatos(ct.data)
      if (['concluida', 'cancelada'].includes(pc.data.status)) {
        clearInterval(intervalRef.current)
        onAtualizar()
      }
    } catch {}
  }, [campanhaInicial.id])

  useEffect(() => {
    atualizar()
    intervalRef.current = setInterval(atualizar, 3000)
    return () => clearInterval(intervalRef.current)
  }, [atualizar])

  const controle = async (acao) => {
    setCtrl(true)
    try {
      const r = await axios.post(`${API}/${campanha.id}/${acao}/`)
      setCampanha(r.data)
      onAtualizar()
    } finally { setCtrl(false) }
  }

  const pct = campanha.porcentagem ?? 0

  return (
    <ModalWrapper onClose={onClose} maxWidth="672px">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">{campanha.nome}</h3>
            <span className={`flex-shrink-0 inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_BADGE[campanha.status] || STATUS_BADGE.rascunho} ${campanha.status === 'enviando' ? 'animate-pulse' : ''}`}>
              {STATUS_LABEL[campanha.status] || campanha.status}
            </span>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 ml-4 transition-colors">
            <IconX size={20} />
          </motion.button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Total',     value: campanha.total,    color: 'text-slate-700 dark:text-slate-200'    },
              { label: 'Enviados',  value: campanha.enviados, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Falhas',    value: campanha.falhas,   color: 'text-red-500 dark:text-red-400'         },
              { label: 'Pulados',   value: campanha.pulados,  color: 'text-amber-600 dark:text-amber-400'     },
              { label: 'Progresso', value: `${pct}%`,         color: 'text-primary'                          },
            ].map(k => (
              <div key={k.label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="bg-emerald-500 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>

          <div className="flex items-center gap-3">
            {campanha.status === 'enviando' && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => controle('pausar')} disabled={ctrl}
                className="flex items-center gap-2 border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                <IconPlayerPause size={15} /> Pausar
              </motion.button>
            )}
            {campanha.status === 'pausada' && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => controle('retomar')} disabled={ctrl}
                className="flex items-center gap-2 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                <IconPlayerPlay size={15} /> Retomar
              </motion.button>
            )}
            {!['concluida', 'cancelada'].includes(campanha.status) && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => controle('cancelar')} disabled={ctrl}
                className="flex items-center gap-2 border border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                <IconCircleX size={15} /> Cancelar
              </motion.button>
            )}
            <button onClick={atualizar}
              className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              <IconRefresh size={13} /> Atualizar
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    {['Nome', 'Número', 'Instância', 'Status', 'Enviado em'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {contatos.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                      <IconLoader size={18} className="animate-spin inline mr-2" />Carregando contatos...
                    </td></tr>
                  ) : contatos.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200">{c.nome || <span className="italic text-slate-400 dark:text-slate-500">—</span>}</td>
                      <td className="px-4 py-2.5 text-sm font-mono text-slate-600 dark:text-slate-300">{c.numero}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">{c.instancia || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_CONTATO_BADGE[c.status] || STATUS_CONTATO_BADGE.pendente}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatarData(c.enviado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose}
            className="w-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </ModalWrapper>
  )
}

export default function Relatorios() {
  const [campanhas, setCampanhas]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [busca, setBusca]                   = useState('')
  const [filtroStatus, setFiltroStatus]     = useState('todos')
  const [modalProgresso, setModalProgresso] = useState(null)
  const [toast, setToast]                   = useState(null)
  const intervalRef                         = useRef(null)

  const exibirToast = (mensagem, tipo = 'sucesso') => {
    setToast({ mensagem, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  const carregar = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/`)
      setCampanhas(r.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    carregar()
    intervalRef.current = setInterval(carregar, 5000)
    return () => clearInterval(intervalRef.current)
  }, [carregar])

  const excluir = async (id) => {
    if (!confirm('Excluir esta campanha?')) return
    try {
      await axios.delete(`${API}/${id}/`)
      setCampanhas(prev => prev.filter(c => c.id !== id))
      exibirToast('Campanha excluída.')
    } catch { exibirToast('Erro ao excluir.', 'erro') }
  }

  const controle = async (id, acao) => {
    try {
      await axios.post(`${API}/${id}/${acao}/`)
      carregar()
    } catch { exibirToast('Erro ao executar ação.', 'erro') }
  }

  const filtradas = campanhas.filter(c => {
    const matchBusca  = c.nome.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus
    return matchBusca && matchStatus
  })

  const totalDestinatarios = campanhas.reduce((s, c) => s + (c.total || 0), 0)
  const totalEnviando      = campanhas.filter(c => c.status === 'enviando').length
  const totalConcluidas    = campanhas.filter(c => c.status === 'concluida').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Relatórios</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Acompanhe o desempenho das suas campanhas</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={carregar}
          className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <IconRefresh size={15} /> Atualizar
        </motion.button>
      </motion.div>

      {/* KPIs */}
      <motion.div
        className="grid grid-cols-4 gap-4"
        variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        {[
          { label: 'Campanhas',     value: campanhas.length,                           color: 'text-slate-700 dark:text-slate-200'     },
          { label: 'Destinatários', value: totalDestinatarios.toLocaleString('pt-BR'), color: 'text-purple-600 dark:text-purple-400'   },
          { label: 'Enviando',      value: totalEnviando,                              color: 'text-blue-600 dark:text-blue-400'        },
          { label: 'Concluídas',    value: totalConcluidas,                            color: 'text-emerald-600 dark:text-emerald-400'  },
        ].map(k => (
          <motion.div
            key={k.label}
            variants={staggerItem}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 cursor-default"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabela */}
      <motion.div
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input type="text" placeholder="Buscar campanha..." value={busca} onChange={e => setBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary" />
          </div>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
            <option value="todos">Todos os status</option>
            <option value="enviando">Enviando</option>
            <option value="pausada">Pausada</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
            <option value="rascunho">Rascunho</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <IconLoader size={22} className="animate-spin mr-2" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-3">
            <IconChartBar size={40} strokeWidth={1} />
            <p className="text-sm">Nenhuma campanha encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                  {['SN', 'Nome', 'Instâncias', 'Números', 'Modelo', 'Mensagem', 'Status', 'Agendar', 'Criado em', 'Ação'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <motion.tbody
                className="divide-y divide-slate-100 dark:divide-slate-700"
                variants={stagger} initial="hidden" animate="show"
              >
                {filtradas.map((c, i) => (
                  <motion.tr key={c.id} variants={staggerItem} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-4 py-3.5 text-sm text-slate-400 dark:text-slate-500 font-mono">{i + 1}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap max-w-[160px] truncate">{c.nome}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(c.instancias_nomes || []).map(n => (
                          <span key={n} className="inline-flex text-[11px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full whitespace-nowrap">{n}</span>
                        ))}
                        {(!c.instancias_nomes || c.instancias_nomes.length === 0) && <span className="text-slate-400 dark:text-slate-500 text-xs italic">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300 font-medium">{c.total}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{c.modelo_nome || <span className="italic text-slate-300 dark:text-slate-600">—</span>}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400 max-w-[180px] truncate">{c.mensagem_override || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_BADGE[c.status] || STATUS_BADGE.rascunho} ${c.status === 'enviando' ? 'animate-pulse' : ''}`}>
                        {STATUS_LABEL[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {c.agendado_para ? formatarData(c.agendado_para) : <span className="text-slate-300 dark:text-slate-600">Não</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatarData(c.criado_em)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {c.status === 'enviando' && (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => controle(c.id, 'pausar')}
                            className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap">
                            <IconPlayerPause size={11} /> Pausa
                          </motion.button>
                        )}
                        {c.status === 'pausada' && (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => controle(c.id, 'retomar')}
                            className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors whitespace-nowrap">
                            <IconPlayerPlay size={11} /> Retomar
                          </motion.button>
                        )}
                        {!['concluida', 'cancelada'].includes(c.status) && (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => controle(c.id, 'cancelar')}
                            className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors whitespace-nowrap">
                            <IconCircleX size={11} /> Cancelar
                          </motion.button>
                        )}
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setModalProgresso(c)}
                          className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/5 border border-primary/20 px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-colors whitespace-nowrap">
                          <IconEye size={11} /> Ver relatório
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => excluir(c.id)}
                          className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                          <IconTrash size={13} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {modalProgresso && (
          <ModalProgresso key="modal-progresso"
            campanha={modalProgresso}
            onClose={() => setModalProgresso(null)}
            onAtualizar={carregar}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            variants={toastV} initial="hidden" animate="show" exit="exit"
            className={`fixed top-6 right-6 z-50 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 ${toast.tipo === 'sucesso' ? 'bg-emerald-500' : 'bg-red-500'}`}
          >
            {toast.tipo === 'sucesso' ? <IconCheck size={18} strokeWidth={2.5} /> : <IconAlertTriangle size={18} strokeWidth={2.5} />}
            <span className="text-sm font-medium">{toast.mensagem}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
