import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconSend, IconPlus, IconUpload, IconLoader, IconX, IconCheck, IconAlertTriangle,
  IconPlayerPause, IconPlayerPlay, IconCircleX, IconSettings, IconRefresh,
  IconFileSpreadsheet, IconBolt, IconClock, IconUsers,
  IconDeviceMobile, IconTemplate, IconPencil, IconTrash, IconEye
} from '@tabler/icons-react'
import { fadeUp, stagger, staggerItem, toastV } from '../lib/motion'
import ModalWrapper from '../components/ModalWrapper'

const API      = 'http://localhost:8000/api/campanhas'
const API_DISP = 'http://localhost:8000/api/dispositivos'
const API_MOD  = 'http://localhost:8000/api/modelos'
const API_CONF = 'http://localhost:8000/api/campanhas/configuracoes'

function parseWhatsApp(texto) {
  if (!texto) return null
  const regex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|```[\s\S]*?```|\{\{name\}\})/g
  const parts = []
  let lastIndex = 0, key = 0, match
  while ((match = regex.exec(texto)) !== null) {
    if (match.index > lastIndex) parts.push(<span key={key++}>{texto.slice(lastIndex, match.index)}</span>)
    const t = match[0]
    if (t.startsWith('```'))    parts.push(<code key={key++} className="bg-black/30 px-1 rounded font-mono text-xs">{t.slice(3,-3)}</code>)
    else if (t.startsWith('*')) parts.push(<strong key={key++}>{t.slice(1,-1)}</strong>)
    else if (t.startsWith('_')) parts.push(<em key={key++}>{t.slice(1,-1)}</em>)
    else if (t.startsWith('~')) parts.push(<del key={key++}>{t.slice(1,-1)}</del>)
    else if (t === '{{name}}')  parts.push(<span key={key++} className="bg-amber-400/20 rounded px-1">João</span>)
    lastIndex = match.index + t.length
  }
  if (lastIndex < texto.length) parts.push(<span key={key++}>{texto.slice(lastIndex)}</span>)
  return parts.length ? parts : null
}

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

// ─── Modal Configurações ─────────────────────────────────────────────────────
function ModalConfiguracoes({ onClose }) {
  const [config, setConfig]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [ok, setOk]           = useState(false)

  useEffect(() => {
    axios.get(`${API_CONF}/`).then(r => { setConfig(r.data); setLoading(false) })
  }, [])

  const salvar = async () => {
    setSaving(true)
    await axios.post(`${API_CONF}/`, config)
    setSaving(false)
    setOk(true)
    setTimeout(() => { setOk(false); onClose() }, 800)
  }

  const num = (k) => (e) => setConfig(c => ({ ...c, [k]: Number(e.target.value) }))

  const inputCls = 'w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary'

  if (loading) return (
    <ModalWrapper onClose={onClose} maxWidth="512px">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 flex items-center justify-center">
        <IconLoader size={24} className="animate-spin text-primary" />
      </div>
    </ModalWrapper>
  )

  return (
    <ModalWrapper onClose={onClose} maxWidth="512px">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Configurações de Disparo</h3>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <IconX size={20} />
          </motion.button>
        </div>

        <div className="space-y-4">
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Atraso entre mensagens</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Mínimo (s)</label>
                <input type="number" min={5} value={config.intervalo_min} onChange={num('intervalo_min')} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Máximo (s)</label>
                <input type="number" min={5} value={config.intervalo_max} onChange={num('intervalo_max')} className={inputCls} />
              </div>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Modo de suspensão</p>
              <button onClick={() => setConfig(c => ({ ...c, modo_suspensao: !c.modo_suspensao }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.modo_suspensao ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${config.modo_suspensao ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {config.modo_suspensao && (
              <div className="grid grid-cols-3 gap-3 pt-1">
                {[['Após X msgs','suspensao_apos',1],['Pausa mín. (s)','suspensao_min',60],['Pausa máx. (s)','suspensao_max',60]].map(([lbl,k,min]) => (
                  <div key={k}>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{lbl}</label>
                    <input type="number" min={min} value={config[k]} onChange={num(k)} className={inputCls} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          <motion.button onClick={salvar} disabled={saving}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <IconLoader size={16} className="animate-spin" /> : ok ? <IconCheck size={16} /> : null}
            {ok ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar configurações'}
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  )
}

// ─── Modal Progresso ─────────────────────────────────────────────────────────
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
            <motion.div className="bg-emerald-500 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }} />
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

// ─── Modal Mapeamento ────────────────────────────────────────────────────────
function ModalMapeamento({ dados, onClose, onConfirmar }) {
  const { colunas, linhas, total_linhas, col_nome_auto, col_numero_auto, todas_linhas } = dados

  const [idxNumero, setIdxNumero] = useState(col_numero_auto ?? '')
  const [idxNome,   setIdxNome]   = useState(col_nome_auto ?? '')
  const [loading,   setLoading]   = useState(false)
  const [erro,      setErro]      = useState(null)

  const confirmar = async () => {
    if (idxNumero === '' || idxNumero === null) { setErro('Selecione a coluna de número.'); return }
    setLoading(true)
    setErro(null)
    try {
      const r = await axios.post(`${API}/confirmar-base/`, {
        linhas:     todas_linhas,
        idx_numero: Number(idxNumero),
        idx_nome:   idxNome !== '' ? Number(idxNome) : null,
      })
      onConfirmar(r.data.contatos, r.data.invalidos)
      onClose()
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao processar contatos.')
    } finally { setLoading(false) }
  }

  const selectCls = 'w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'

  return (
    <ModalWrapper onClose={onClose} maxWidth="672px">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Mapear colunas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{total_linhas} linhas detectadas</p>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <IconX size={20} />
          </motion.button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Coluna de Número', required: true,  value: idxNumero, set: setIdxNumero },
              { label: 'Coluna de Nome',   required: false, value: idxNome,   set: setIdxNome   },
            ].map(({ label, required, value, set }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  {label} {required ? <span className="text-red-500">*</span> : <span className="text-slate-400 dark:text-slate-500">(opcional)</span>}
                </label>
                <select value={value} onChange={e => set(e.target.value)} className={selectCls}>
                  <option value="">{required ? 'Selecione o campo...' : 'Não mapear'}</option>
                  {colunas.map((c, i) => <option key={i} value={i}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pré-visualização (5 primeiras linhas)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {colunas.map((c, i) => (
                      <th key={i} className={`text-left text-xs font-semibold px-4 py-2.5 whitespace-nowrap ${
                        String(i) === String(idxNumero) ? 'text-primary bg-primary/5' :
                        String(i) === String(idxNome)   ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {c}
                        {String(i) === String(idxNumero) && <span className="ml-1 text-[10px] font-normal bg-primary text-white px-1 rounded">número</span>}
                        {String(i) === String(idxNome) && idxNome !== '' && <span className="ml-1 text-[10px] font-normal bg-emerald-500 text-white px-1 rounded">nome</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {linhas.map((row, ri) => (
                    <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      {colunas.map((_, ci) => (
                        <td key={ci} className={`px-4 py-2 text-sm whitespace-nowrap ${
                          String(ci) === String(idxNumero) ? 'text-primary font-mono font-medium' :
                          String(ci) === String(idxNome) && idxNome !== '' ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {row[ci] || <span className="italic text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {erro && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400">{erro}</div>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose}
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          <motion.button onClick={confirmar} disabled={loading || idxNumero === ''}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <IconLoader size={16} className="animate-spin" /> : <IconCheck size={16} />}
            {loading ? 'Processando...' : `Confirmar ${total_linhas} contatos`}
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  )
}

// ─── Componente Principal ────────────────────────────────────────────────────
export default function Campanhas() {
  const [campanhas, setCampanhas]                   = useState([])
  const [loadingHistorico, setLoadingHistorico]     = useState(true)
  const [contatosImportados, setContatosImportados] = useState([])
  const [invalidos, setInvalidos]                   = useState(0)
  const [uploadLoading, setUploadLoading]           = useState(false)
  const [arrastando, setArrastando]                 = useState(false)
  const [modelos, setModelos]                       = useState([])
  const [dispositivos, setDispositivos]             = useState([])
  const [abaMsg, setAbaMsg]                         = useState('modelo')
  const [modeloSelecionado, setModeloSelecionado]   = useState(null)
  const [mensagemDigitada, setMensagemDigitada]     = useState('')
  const [tipoMensagem, setTipoMensagem]             = useState('texto')
  const [instanciasSelecionadas, setInstanciasSelecionadas] = useState([])
  const [nomeCampanha, setNomeCampanha]             = useState('')
  const [agendar, setAgendar]                       = useState(false)
  const [dataAgendamento, setDataAgendamento]       = useState('')
  const [erros, setErros]                           = useState({})
  const [enviando, setEnviando]                     = useState(false)
  const [modalConfig, setModalConfig]               = useState(false)
  const [modalProgresso, setModalProgresso]         = useState(null)
  const [modalMapeamento, setModalMapeamento]       = useState(null)
  const [toast, setToast]                           = useState(null)

  const fileInputRef = useRef(null)
  const textareaRef  = useRef(null)

  const exibirToast = (mensagem, tipo = 'sucesso') => {
    setToast({ mensagem, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  const carregarHistorico = async () => {
    setLoadingHistorico(true)
    try {
      const r = await axios.get(`${API}/`)
      setCampanhas(r.data)
    } finally { setLoadingHistorico(false) }
  }

  useEffect(() => {
    carregarHistorico()
    axios.get(`${API_MOD}/`).then(r => setModelos(r.data)).catch(() => {})
    axios.get(`${API_DISP}/`).then(r => setDispositivos(r.data)).catch(() => {})
  }, [])

  const processarArquivo = async (file) => {
    if (!file) return
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      exibirToast('Formato inválido. Use CSV ou XLSX.', 'erro'); return
    }
    setUploadLoading(true)
    try {
      const fd = new FormData()
      fd.append('arquivo', file)
      const r = await axios.post(`${API}/importar-base/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setModalMapeamento(r.data)
    } catch (err) {
      exibirToast(err.response?.data?.error || 'Erro ao importar arquivo.', 'erro')
    } finally { setUploadLoading(false) }
  }

  const inserirFormatacao = (antes, depois) => {
    const ta = textareaRef.current
    if (!ta) return
    const s = ta.selectionStart, e = ta.selectionEnd, t = mensagemDigitada
    setMensagemDigitada(t.slice(0, s) + antes + t.slice(s, e) + depois + t.slice(e))
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + antes.length, e + antes.length) }, 0)
  }

  const inserirCursor = (trecho) => {
    const ta = textareaRef.current
    if (!ta) return
    const s = ta.selectionStart, t = mensagemDigitada
    setMensagemDigitada(t.slice(0, s) + trecho + t.slice(s))
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + trecho.length, s + trecho.length) }, 0)
  }

  const conectadas = dispositivos.filter(d => d.status === 'open')

  const toggleInstancia = (d) => setInstanciasSelecionadas(prev =>
    prev.find(x => x.id === d.id) ? prev.filter(x => x.id !== d.id) : [...prev, d]
  )

  const enviar = async () => {
    const e = {}
    if (!nomeCampanha.trim())                             e.nome       = 'Nome da campanha é obrigatório.'
    if (contatosImportados.length === 0)                  e.contatos   = 'Importe uma base de contatos.'
    if (instanciasSelecionadas.length === 0)              e.instancias = 'Selecione pelo menos uma instância.'
    if (abaMsg === 'modelo' && !modeloSelecionado)        e.mensagem   = 'Selecione um modelo.'
    if (abaMsg === 'digitar' && !mensagemDigitada.trim()) e.mensagem   = 'Digite a mensagem.'
    if (agendar && !dataAgendamento)                      e.agendamento = 'Informe a data de agendamento.'
    setErros(e)
    if (Object.keys(e).length > 0) return

    setEnviando(true)
    try {
      const payload = {
        nome:              nomeCampanha,
        modelo_id:         abaMsg === 'modelo' ? modeloSelecionado?.id : null,
        mensagem_override: abaMsg === 'digitar' ? mensagemDigitada : null,
        tipo_override:     tipoMensagem,
        instancia_ids:     instanciasSelecionadas.map(d => d.id),
        contatos:          contatosImportados,
        agendado_para:     agendar ? dataAgendamento : null,
      }
      const r = await axios.post(`${API}/criar-e-disparar/`, payload)
      exibirToast(r.data.agendada ? 'Campanha agendada com sucesso!' : 'Campanha iniciada!')
      setContatosImportados([]); setInvalidos(0); setModeloSelecionado(null)
      setMensagemDigitada(''); setInstanciasSelecionadas([]); setNomeCampanha('')
      setAgendar(false); setDataAgendamento(''); setErros({})
      await carregarHistorico()
      if (!r.data.agendada) setModalProgresso(r.data)
    } catch (err) {
      exibirToast(err.response?.data?.error || 'Erro ao criar campanha.', 'erro')
    } finally { setEnviando(false) }
  }

  const textoPreview = abaMsg === 'modelo' ? (modeloSelecionado?.mensagem || '') : mensagemDigitada
  const nomeExemplo  = contatosImportados[0]?.nome || 'João'
  const textoFinal   = textoPreview.replace(/\{\{name\}\}/g, nomeExemplo).replace(/\{\{nome\}\}/g, nomeExemplo)

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Nova Campanha</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Configure e dispare sua campanha de WhatsApp</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setModalConfig(true)}
          className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <IconSettings size={15} /> Configurações
        </motion.button>
      </motion.div>

      {/* ── Nova Campanha form ─────────────────────────────────────────────── */}
      <motion.div
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <IconPlus size={15} className="text-slate-400 dark:text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nova Campanha</h3>
        </div>

        <div className="p-6 space-y-8">

          {/* PASSO 1 */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-30px' }}>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
              Importar base de contatos
            </p>

            {uploadLoading ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-10 flex flex-col items-center gap-3">
                <IconLoader size={28} className="animate-spin text-primary" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Processando arquivo...</p>
              </div>
            ) : contatosImportados.length === 0 ? (
              <div
                onDragOver={e => { e.preventDefault(); setArrastando(true) }}
                onDragLeave={() => setArrastando(false)}
                onDrop={e => { e.preventDefault(); setArrastando(false); processarArquivo(e.dataTransfer.files[0]) }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                  arrastando ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-600 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                  onChange={e => { processarArquivo(e.target.files[0]); e.target.value = '' }} />
                <IconFileSpreadsheet size={36} className="text-slate-300 dark:text-slate-600" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Arraste CSV ou XLSX aqui</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ou clique para selecionar — colunas "nome" e "numero"</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{contatosImportados.length}</span> contatos importados
                    {invalidos > 0 && <span className="text-red-500 dark:text-red-400 ml-2">· {invalidos} inválidos ignorados</span>}
                  </p>
                  <button onClick={() => { setContatosImportados([]); setInvalidos(0) }}
                    className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
                    <IconUpload size={12} /> Trocar arquivo
                  </button>
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        {['#', 'Nome', 'Número'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 py-2.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {contatosImportados.slice(0, 200).map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500 font-mono">{i + 1}</td>
                          <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">{c.nome || <span className="italic text-slate-400 dark:text-slate-500">—</span>}</td>
                          <td className="px-4 py-2 text-sm font-mono text-slate-600 dark:text-slate-300">{c.numero}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {erros.contatos && <p className="text-xs text-red-500 mt-2">{erros.contatos}</p>}
          </motion.div>

          {/* PASSO 2 */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-30px' }}>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
              Configurar mensagem
            </p>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex mb-4 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  {[['modelo', IconTemplate, 'Usar modelo'], ['digitar', IconPencil, 'Digitar mensagem']].map(([v, Icon, lbl]) => (
                    <button key={v} onClick={() => setAbaMsg(v)}
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2.5 transition-colors ${
                        abaMsg === v ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}>
                      <Icon size={13} /> {lbl}
                    </button>
                  ))}
                </div>

                {abaMsg === 'modelo' ? (
                  <div className="space-y-3">
                    <select value={modeloSelecionado?.id || ''}
                      onChange={e => setModeloSelecionado(modelos.find(m => m.id === Number(e.target.value)) || null)}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                      <option value="">Selecione um modelo...</option>
                      {modelos.map(m => <option key={m.id} value={m.id}>{m.nome} ({m.tipo})</option>)}
                    </select>
                    {modeloSelecionado && (
                      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {textoFinal}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      {[['B','*','*','font-bold'],['I','_','_','italic'],['S','~','~','line-through'],['M','```','```','font-mono text-xs']].map(([l,a,d,c]) => (
                        <button key={l} type="button" onClick={() => inserirFormatacao(a, d)}
                          className={`w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm transition-colors ${c}`}>{l}</button>
                      ))}
                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                      <button type="button" onClick={() => inserirCursor('{{name}}')}
                        className="flex items-center gap-0.5 px-2 h-7 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono transition-colors">
                        <span className="text-slate-500 dark:text-slate-400">{'{{'}  </span><span className="text-amber-600 dark:text-amber-400 font-semibold">name</span><span className="text-slate-500 dark:text-slate-400">{'}}'}</span>
                      </button>
                    </div>
                    <textarea ref={textareaRef} rows={6} value={mensagemDigitada}
                      onChange={e => setMensagemDigitada(e.target.value)}
                      placeholder="Digite a mensagem do disparo..."
                      className="w-full px-3 py-2.5 text-sm outline-none resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                  </div>
                )}
              </div>

              {/* WhatsApp preview — mantém cores fixas intencionais */}
              <div className="bg-[#0b141a] rounded-xl p-4">
                <p className="text-[10px] text-gray-500 mb-3 text-center font-semibold uppercase tracking-widest">Pré-visualização</p>
                <div className="flex flex-col items-end">
                  <div className="bg-[#005c4b] text-white p-3 rounded-lg max-w-[240px] text-sm leading-relaxed">
                    <div className="whitespace-pre-wrap break-words">
                      {parseWhatsApp(textoFinal) || <span className="text-white/30 italic text-xs">Sua mensagem aparecerá aqui...</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {erros.mensagem && <p className="text-xs text-red-500 mt-2">{erros.mensagem}</p>}
          </motion.div>

          {/* PASSO 3 */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-30px' }}>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
              Selecionar instâncias WhatsApp
            </p>

            {conectadas.length === 0 ? (
              <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex items-center gap-3">
                <IconAlertTriangle size={18} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">Nenhuma instância conectada. Vá em <strong>Dispositivos</strong> para conectar.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <button onClick={() => setInstanciasSelecionadas(conectadas)}
                    className="text-xs text-primary hover:underline font-medium">Selecionar todas</button>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <button onClick={() => setInstanciasSelecionadas([])}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:underline font-medium">Desmarcar todas</button>
                </div>
                <motion.div
                  className="grid grid-cols-3 gap-3"
                  variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
                >
                  {conectadas.map(d => {
                    const sel = instanciasSelecionadas.some(x => x.id === d.id)
                    return (
                      <motion.div
                        key={d.id}
                        variants={staggerItem}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggleInstancia(d)}
                        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-colors ${
                          sel ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {sel && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <IconCheck size={11} color="white" strokeWidth={3} />
                          </div>
                        )}
                        <IconDeviceMobile size={20} className="text-primary mb-2" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{d.nome}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{d.numero || d.instance_name}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 mt-2">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Conectado
                        </span>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </>
            )}
            {erros.instancias && <p className="text-xs text-red-500 mt-2">{erros.instancias}</p>}
          </motion.div>

          {/* PASSO 4 */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-30px' }}>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold flex-shrink-0">4</span>
              Finalizar e disparar
            </p>

            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Nome da campanha</label>
                <input type="text" value={nomeCampanha} onChange={e => setNomeCampanha(e.target.value)}
                  placeholder="Ex: Promoção de Natal – Lista VIP"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/20" />
                {erros.nome && <p className="text-xs text-red-500 mt-1">{erros.nome}</p>}
              </div>

              <div className="flex items-center justify-between py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <IconClock size={15} className="text-slate-400 dark:text-slate-500" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Agendar envio</p>
                </div>
                <button onClick={() => setAgendar(a => !a)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${agendar ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${agendar ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {agendar && (
                <motion.div variants={fadeUp} initial="hidden" animate="show">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Data e hora</label>
                  <input type="datetime-local" value={dataAgendamento} onChange={e => setDataAgendamento(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-1 focus:ring-primary/20" />
                  {erros.agendamento && <p className="text-xs text-red-500 mt-1">{erros.agendamento}</p>}
                </motion.div>
              )}

              <motion.button
                onClick={enviar} disabled={enviando}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {enviando
                  ? <><IconLoader size={18} className="animate-spin" /> Criando campanha...</>
                  : agendar
                  ? <><IconClock size={18} /> Agendar campanha</>
                  : <><IconSend size={18} /> Enviar agora</>
                }
              </motion.button>
            </div>
          </motion.div>

        </div>
      </motion.div>

      <AnimatePresence>
        {modalConfig && <ModalConfiguracoes key="modal-config" onClose={() => setModalConfig(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {modalMapeamento && (
          <ModalMapeamento key="modal-mapeamento"
            dados={modalMapeamento}
            onClose={() => setModalMapeamento(null)}
            onConfirmar={(contatos, inv) => {
              setContatosImportados(contatos)
              setInvalidos(inv)
              setModalMapeamento(null)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalProgresso && (
          <ModalProgresso key="modal-progresso"
            campanha={modalProgresso}
            onClose={() => setModalProgresso(null)}
            onAtualizar={carregarHistorico}
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
