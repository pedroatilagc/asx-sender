import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconUser, IconPlus, IconPencil, IconTrash, IconX, IconLoader,
  IconSearch, IconUpload, IconDownload, IconBan, IconCheck,
  IconAlertTriangle, IconFileSpreadsheet, IconCopy, IconCircleX
} from '@tabler/icons-react'
import { fadeUp, stagger, staggerItem, toastV } from '../lib/motion'
import ModalWrapper from '../components/ModalWrapper'

const API = 'http://localhost:8000/api/contatos'

const formatarNumero = (num) => {
  if (!num || num.length < 12) return num || '—'
  const ddi   = num.slice(0, 2)
  const ddd   = num.slice(2, 4)
  const resto = num.slice(4)
  const meio  = resto.length === 9 ? resto.slice(0, 5) : resto.slice(0, 4)
  const fim   = resto.slice(-4)
  return `+${ddi} (${ddd}) ${meio}-${fim}`
}

function ModalNovoContato({ contato, onClose, onSalvo }) {
  const isEdicao = contato && contato !== 'novo'
  const [form, setForm]       = useState({
    nome:    isEdicao ? contato.nome    : '',
    numero:  isEdicao ? contato.numero  : '',
    opt_out: isEdicao ? contato.opt_out : false,
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState(null)

  const salvar = async () => {
    if (!form.numero.trim()) { setErro('O número é obrigatório.'); return }
    setLoading(true)
    setErro(null)
    try {
      if (isEdicao) await axios.put(`${API}/${contato.id}/`, form)
      else          await axios.post(`${API}/`, form)
      onSalvo()
      onClose()
    } catch (err) {
      const data = err.response?.data
      if (data?.numero) setErro(Array.isArray(data.numero) ? data.numero[0] : data.numero)
      else if (data?.error) setErro(data.error)
      else if (data?.detail) setErro(data.detail)
      else setErro('Erro ao salvar contato. Verifique os dados.')
    } finally { setLoading(false) }
  }

  const inputCls = 'w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/20'
  const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5'

  return (
    <ModalWrapper onClose={onClose} maxWidth="448px">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {isEdicao ? 'Editar Contato' : 'Novo Contato'}
          </h3>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <IconX size={20} />
          </motion.button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nome <span className="font-normal normal-case text-slate-400 dark:text-slate-500">(opcional)</span></label>
            <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: João Silva" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Número WhatsApp</label>
            <input type="text" value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
              placeholder="Ex: 5585991234567 ou 85991234567" className={inputCls} />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              DDI 55 + DDD + número. O "55" será adicionado automaticamente se ausente.
            </p>
          </div>

          {isEdicao && (
            <div className="flex items-center justify-between py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Opt-out</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Contato pediu para não receber mensagens</p>
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, opt_out: !f.opt_out }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.opt_out ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.opt_out ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          )}

          {erro && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5 text-sm text-red-600 dark:text-red-400">{erro}</div>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <motion.button type="button" onClick={salvar} disabled={loading}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <IconLoader size={16} className="animate-spin" />}
              {loading ? 'Salvando...' : isEdicao ? 'Salvar Alterações' : 'Criar Contato'}
            </motion.button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  )
}

function ModalImportar({ onClose, onImportado }) {
  const [arquivo, setArquivo]       = useState(null)
  const [arrastando, setArrastando] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [erro, setErro]             = useState(null)
  const [resultado, setResultado]   = useState(null)
  const inputRef                    = useRef(null)

  const handleArquivo = (file) => {
    if (!file) return
    if (!file.name.endsWith('.xlsx')) { setErro('Apenas arquivos .xlsx são aceitos.'); return }
    setErro(null)
    setArquivo(file)
  }

  const importar = async () => {
    if (!arquivo) { setErro('Selecione um arquivo.'); return }
    setLoading(true)
    setErro(null)
    try {
      const fd = new FormData()
      fd.append('arquivo', arquivo)
      const res = await axios.post(`${API}/importar/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResultado(res.data)
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao importar arquivo.')
    } finally { setLoading(false) }
  }

  if (resultado) {
    return (
      <ModalWrapper onClose={onClose} maxWidth="384px">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full p-6 text-center">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconCheck size={24} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">Importação concluída</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Arquivo <strong>{arquivo.name}</strong> processado.</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{resultado.criados}</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5">Criados</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{resultado.ignorados}</p>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">Ignorados</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{resultado.invalidos}</p>
              <p className="text-xs text-red-700 dark:text-red-500 mt-0.5">Inválidos</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => { onImportado(); onClose() }}
            className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            Fechar
          </motion.button>
        </div>
      </ModalWrapper>
    )
  }

  return (
    <ModalWrapper onClose={onClose} maxWidth="512px">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Importar Contatos</h3>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <IconX size={20} />
          </motion.button>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setArrastando(true) }}
          onDragLeave={() => setArrastando(false)}
          onDrop={e => { e.preventDefault(); setArrastando(false); handleArquivo(e.dataTransfer.files[0]) }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
            arrastando ? 'border-primary bg-primary/5' : arquivo ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <input ref={inputRef} type="file" accept=".xlsx" className="hidden"
            onChange={e => handleArquivo(e.target.files[0])} />
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${arquivo ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-primary/10'}`}>
            <IconFileSpreadsheet size={24} className={arquivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'} />
          </div>
          {arquivo ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{arquivo.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Clique para trocar o arquivo</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Arraste o arquivo aqui</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ou clique para selecionar</p>
            </div>
          )}
        </div>

        <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5 flex items-start gap-2">
          <IconAlertTriangle size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            O arquivo deve ter colunas <strong>nome</strong> e <strong>numero</strong> na primeira linha.
            Números sem DDI "55" serão normalizados automaticamente.
          </p>
        </div>

        {erro && <div className="mt-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5 text-sm text-red-600 dark:text-red-400">{erro}</div>}

        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onClose}
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          <motion.button type="button" onClick={importar} disabled={loading || !arquivo}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <IconLoader size={16} className="animate-spin" />}
            {loading ? 'Importando...' : 'Importar'}
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  )
}

export default function Contatos() {
  const [contatos, setContatos]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [busca, setBusca]                 = useState('')
  const [filtroOptOut, setFiltroOptOut]   = useState('todos')
  const [modalNovo, setModalNovo]         = useState(null)
  const [modalImportar, setModalImportar] = useState(false)
  const [executando, setExecutando]       = useState(false)
  const [toast, setToast]                 = useState(null)

  const exibirToast = (tipo, mensagem) => {
    setToast({ tipo, mensagem })
    setTimeout(() => setToast(null), 4000)
  }

  const carregar = async () => {
    setLoading(true)
    try {
      let url = `${API}/`
      if (filtroOptOut === 'ativos') url += '?opt_out=false'
      if (filtroOptOut === 'optout') url += '?opt_out=true'
      const res = await axios.get(url)
      setContatos(res.data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [filtroOptOut])

  const excluir = async (id) => {
    if (!confirm('Excluir este contato? Esta ação não pode ser desfeita.')) return
    try {
      await axios.delete(`${API}/${id}/`)
      setContatos(prev => prev.filter(c => c.id !== id))
    } catch { exibirToast('erro', 'Erro ao excluir contato.') }
  }

  const toggleOptOut = async (contato) => {
    try {
      const res = await axios.patch(`${API}/${contato.id}/`, { opt_out: !contato.opt_out })
      setContatos(prev => prev.map(c => c.id === contato.id ? res.data : c))
    } catch { exibirToast('erro', 'Erro ao alterar status opt-out.') }
  }

  const acaoMassa = async (endpoint, confirmar, msgSucesso) => {
    if (!confirm(confirmar)) return
    setExecutando(true)
    try {
      const res = await axios.post(`${API}/${endpoint}/`)
      await carregar()
      exibirToast('sucesso', msgSucesso(res.data))
    } catch { exibirToast('erro', 'Erro ao executar operação.') }
    finally { setExecutando(false) }
  }

  const exportar = () => {
    let url = `${API}/exportar/`
    if (filtroOptOut === 'ativos') url += '?opt_out=false'
    if (filtroOptOut === 'optout') url += '?opt_out=true'
    window.open(url)
  }

  const contatosFiltrados = contatos.filter(c => {
    if (!busca) return true
    const q = busca.toLowerCase()
    return (c.nome && c.nome.toLowerCase().includes(q)) || (c.numero && c.numero.includes(busca.replace(/\D/g, '')))
  })

  const total   = contatos.length
  const ativos  = contatos.filter(c => !c.opt_out).length
  const optOuts = contatos.filter(c => c.opt_out).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Contatos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Gerencie sua base de números WhatsApp</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={exportar}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <IconDownload size={15} /> Exportar
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setModalImportar(true)}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <IconUpload size={15} /> Importar
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => setModalNovo('novo')}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <IconPlus size={16} strokeWidth={2.5} /> Novo Contato
          </motion.button>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div
        className="grid grid-cols-3 gap-4"
        variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        {[
          { label: 'Total',   value: total,   color: 'text-slate-700 dark:text-slate-200'    },
          { label: 'Ativos',  value: ativos,  color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Opt-out', value: optOuts, color: 'text-red-500 dark:text-red-400'         },
        ].map(kpi => (
          <motion.div
            key={kpi.label}
            variants={staggerItem}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-default"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabela */}
      <motion.div
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou número..."
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/20" />
          </div>
          <select value={filtroOptOut} onChange={e => setFiltroOptOut(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
            <option value="todos">Todos</option>
            <option value="ativos">Ativos</option>
            <option value="optout">Opt-out</option>
          </select>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          {[
            { endpoint: 'remover-duplicados', confirm: 'Remover todos os contatos duplicados?', label: 'Remover duplicados', Icon: IconCopy,      red: false, msg: (d) => `${d.removidos} duplicado(s) removido(s)` },
            { endpoint: 'limpar-invalidos',   confirm: 'Remover todos os números inválidos?',   label: 'Limpar inválidos',   Icon: IconCircleX,   red: false, msg: (d) => `${d.removidos} número(s) inválido(s) removido(s)` },
            { endpoint: 'limpar-tudo',        confirm: 'ATENÇÃO: Isto irá remover TODOS os contatos. Confirma?', label: 'Limpar tudo', Icon: IconTrash, red: true,  msg: (d) => `${d.removidos} contato(s) removido(s)` },
          ].map(({ endpoint, confirm, label, Icon, red, msg }) => (
            <motion.button key={endpoint} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => acaoMassa(endpoint, confirm, msg)} disabled={executando}
              className={`flex items-center gap-1.5 text-xs font-medium border px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                red
                  ? 'text-red-500 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}>
              <Icon size={13} /> {label}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <IconLoader size={24} className="animate-spin mr-2" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : contatosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-3">
            <IconUser size={40} strokeWidth={1} />
            <p className="text-sm">
              {contatos.length === 0 ? 'Nenhum contato cadastrado.' : 'Nenhum contato encontrado para os filtros aplicados.'}
            </p>
            {contatos.length === 0 && (
              <div className="flex items-center gap-3">
                <button onClick={() => setModalImportar(true)} className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                  <IconUpload size={14} /> Importar contatos
                </button>
                <span className="text-slate-300 dark:text-slate-600">ou</span>
                <button onClick={() => setModalNovo('novo')} className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                  <IconPlus size={14} /> Criar manualmente
                </button>
              </div>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                {['#', 'Nome', 'Número', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {contatosFiltrados.map((c, idx) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-slate-400 dark:text-slate-500 font-mono w-10">{idx + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconUser size={15} className="text-primary" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {c.nome || <span className="text-slate-400 dark:text-slate-500 italic">Sem nome</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">{formatarNumero(c.numero)}</td>
                  <td className="px-5 py-3.5">
                    {c.opt_out ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                        <IconBan size={11} strokeWidth={2.5} /> Opt-out
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                        <IconCheck size={11} strokeWidth={2.5} /> Ativo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setModalNovo(c)} className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                        <IconPencil size={13} /> Editar
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => toggleOptOut(c)}
                        className={`flex items-center gap-1.5 text-xs font-medium hover:underline ${c.opt_out ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {c.opt_out ? <IconCheck size={13} /> : <IconBan size={13} />}
                        {c.opt_out ? 'Reativar' : 'Opt-out'}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => excluir(c.id)} className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 font-medium hover:underline">
                        <IconTrash size={13} /> Excluir
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      <AnimatePresence>
        {modalNovo !== null && (
          <ModalNovoContato key="modal-contato" contato={modalNovo} onClose={() => setModalNovo(null)} onSalvo={carregar} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalImportar && (
          <ModalImportar key="modal-importar" onClose={() => setModalImportar(false)} onImportado={carregar} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            variants={toastV} initial="hidden" animate="show" exit="exit"
            className={`fixed top-6 right-6 z-50 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              toast.tipo === 'sucesso' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {toast.tipo === 'sucesso'
              ? <IconCheck size={18} strokeWidth={2.5} />
              : <IconAlertTriangle size={18} strokeWidth={2.5} />
            }
            <span className="text-sm font-medium">{toast.mensagem}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
