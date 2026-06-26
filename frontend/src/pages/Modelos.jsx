import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconTemplate, IconPlus, IconPencil, IconTrash, IconX, IconLoader,
  IconSearch, IconExternalLink, IconBan, IconCopy
} from '@tabler/icons-react'
import { fadeUp, stagger, staggerItem } from '../lib/motion'
import ModalWrapper from '../components/ModalWrapper'

const API = `${import.meta.env.VITE_API_URL}/api/modelos`

function parseWhatsApp(texto) {
  if (!texto) return null
  const regex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|```[\s\S]*?```|\{\{name\}\})/g
  const parts = []
  let lastIndex = 0, key = 0, match
  while ((match = regex.exec(texto)) !== null) {
    if (match.index > lastIndex) parts.push(<span key={key++}>{texto.slice(lastIndex, match.index)}</span>)
    const token = match[0]
    if (token.startsWith('```') && token.endsWith('```'))
      parts.push(<code key={key++} className="bg-black/30 px-1 rounded font-mono text-xs">{token.slice(3, -3)}</code>)
    else if (token.startsWith('*') && token.endsWith('*'))
      parts.push(<strong key={key++}>{token.slice(1, -1)}</strong>)
    else if (token.startsWith('_') && token.endsWith('_'))
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>)
    else if (token.startsWith('~') && token.endsWith('~'))
      parts.push(<del key={key++}>{token.slice(1, -1)}</del>)
    else if (token === '{{name}}')
      parts.push(<span key={key++} className="bg-amber-400/20 rounded px-1">João</span>)
    lastIndex = match.index + token.length
  }
  if (lastIndex < texto.length) parts.push(<span key={key++}>{texto.slice(lastIndex)}</span>)
  return parts.length > 0 ? parts : null
}

const ICONE_BOTAO = { url: IconExternalLink, optout: IconBan, copiar: IconCopy }

function PreviewWhatsApp({ mensagem, rodape, tipo, botoes }) {
  return (
    <div className="bg-[#0b141a] rounded-xl p-4 sticky top-4">
      <p className="text-[10px] text-gray-500 mb-3 text-center font-semibold uppercase tracking-widest">
        Pré-visualização
      </p>
      <div className="flex flex-col items-end gap-1">
        <div className="bg-[#005c4b] text-white p-3 rounded-lg max-w-[280px] text-sm leading-relaxed">
          <div className="whitespace-pre-wrap break-words">
            {parseWhatsApp(mensagem) || (
              <span className="text-white/30 italic text-xs">Sua mensagem aparecerá aqui...</span>
            )}
          </div>
          {rodape && (
            <p className="text-[11px] text-gray-400 mt-2 border-t border-white/10 pt-2">{rodape}</p>
          )}
        </div>
        {tipo === 'botoes' && botoes && botoes.map((btn, i) => {
          const Ic = ICONE_BOTAO[btn.tipo]
          return (
            <div key={i} className="bg-[#005c4b]/60 text-[#53bdeb] text-center text-sm py-2 px-4 rounded-lg cursor-default max-w-[280px] w-full flex items-center justify-center">
              {Ic && <Ic size={13} className="inline mr-1 flex-shrink-0" />}
              {btn.titulo ? <span>{btn.titulo}</span> : <span className="opacity-40 italic text-xs">Título do botão</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const BOTAO_VAZIO = { tipo: 'url', titulo: '', url: '', codigo: '' }

function ModalModelo({ modalAberto, onClose, onSalvo }) {
  const isNovo = modalAberto === 'novo'
  const [form, setForm] = useState({
    nome: '', tipo: 'texto', mensagem: '', rodape: '',
    botoes: [{ ...BOTAO_VAZIO }],
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState(null)
  const textareaRef           = useRef(null)

  useEffect(() => {
    if (!isNovo && modalAberto && typeof modalAberto === 'object') {
      setForm({
        nome:     modalAberto.nome    || '',
        tipo:     modalAberto.tipo    || 'texto',
        mensagem: modalAberto.mensagem || '',
        rodape:   modalAberto.rodape  || '',
        botoes:   modalAberto.botoes?.length > 0 ? modalAberto.botoes : [{ ...BOTAO_VAZIO }],
      })
    }
  }, [])

  const inserirFormatacao = (antes, depois) => {
    const ta = textareaRef.current
    if (!ta) return
    const s = ta.selectionStart, e = ta.selectionEnd, t = form.mensagem
    setForm(f => ({ ...f, mensagem: t.slice(0, s) + antes + t.slice(s, e) + depois + t.slice(e) }))
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + antes.length, e + antes.length) }, 0)
  }

  const inserirNoCursor = (trecho) => {
    const ta = textareaRef.current
    if (!ta) return
    const s = ta.selectionStart, t = form.mensagem
    setForm(f => ({ ...f, mensagem: t.slice(0, s) + trecho + t.slice(s) }))
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + trecho.length, s + trecho.length) }, 0)
  }

  const atualizarBotao = (index, campo, valor) =>
    setForm(f => ({ ...f, botoes: f.botoes.map((b, i) => i === index ? { ...b, [campo]: valor } : b) }))

  const adicionarBotao = () => {
    if (form.botoes.length >= 3) return
    setForm(f => ({ ...f, botoes: [...f.botoes, { ...BOTAO_VAZIO }] }))
  }

  const removerBotao = (index) => {
    if (form.botoes.length <= 1) return
    setForm(f => ({ ...f, botoes: f.botoes.filter((_, i) => i !== index) }))
  }

  const validar = () => {
    if (!form.nome.trim()) return 'O nome do modelo é obrigatório.'
    if (!form.mensagem.trim()) return 'A mensagem é obrigatória.'
    if (form.tipo === 'botoes') {
      if (form.botoes.length < 1) return 'Adicione pelo menos 1 botão.'
      if (form.botoes.length > 3) return 'O máximo permitido é 3 botões.'
      for (let i = 0; i < form.botoes.length; i++) {
        const b = form.botoes[i]
        if (!b.titulo.trim()) return `O título do botão ${i + 1} é obrigatório.`
        if (b.tipo === 'url' && !b.url.trim()) return `A URL do botão ${i + 1} é obrigatória.`
        if (b.tipo === 'copiar' && !b.codigo.trim()) return `O código do botão ${i + 1} é obrigatório.`
      }
    }
    return null
  }

  const salvar = async () => {
    const erroV = validar()
    if (erroV) { setErro(erroV); return }
    setLoading(true)
    setErro(null)
    const payload = {
      nome: form.nome, tipo: form.tipo, mensagem: form.mensagem,
      rodape: form.tipo === 'botoes' ? form.rodape : '',
      botoes: form.tipo === 'botoes' ? form.botoes : [],
    }
    try {
      if (isNovo) await axios.post(`${API}/`, payload)
      else        await axios.put(`${API}/${modalAberto.id}/`, payload)
      onSalvo()
      onClose()
    } catch (err) {
      setErro(err.response?.data?.error || err.response?.data?.detail || 'Erro ao salvar modelo.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/20'
  const labelCls = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5'

  return (
    <ModalWrapper onClose={onClose} maxWidth="896px">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {isNovo ? 'Novo Modelo' : 'Editar Modelo'}
          </h3>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <IconX size={20} />
          </motion.button>
        </div>

        <div className="overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nome do modelo</label>
                <input type="text" value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Boas-vindas, Promoção de verão..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tipo de mensagem</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inputCls}>
                  <option value="texto">Texto</option>
                  <option value="botoes">Botões</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Mensagem</label>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                  <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    {[['B','*','*','font-bold'],['I','_','_','italic'],['S','~','~','line-through'],['M','```','```','font-mono text-xs']].map(([l,a,d,c]) => (
                      <button key={l} type="button" onClick={() => inserirFormatacao(a, d)}
                        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm transition-colors ${c}`}>{l}</button>
                    ))}
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                    <button type="button" onClick={() => inserirNoCursor('{{name}}')}
                      className="flex items-center gap-0.5 px-2 h-7 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono transition-colors">
                      <span className="text-slate-500 dark:text-slate-400">{'{{'}  </span><span className="text-amber-600 dark:text-amber-400 font-semibold">name</span><span className="text-slate-500 dark:text-slate-400">{'}}'}</span>
                    </button>
                  </div>
                  <textarea ref={textareaRef} rows={6} value={form.mensagem}
                    onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
                    placeholder="Digite a mensagem do modelo..."
                    className="w-full px-3 py-2.5 text-sm outline-none resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                </div>
              </div>

              {form.tipo === 'botoes' && (
                <>
                  <div>
                    <label className={labelCls}>
                      Rodapé <span className="font-normal normal-case text-slate-400 dark:text-slate-500">(opcional, máx. 60 caracteres)</span>
                    </label>
                    <input type="text" value={form.rodape}
                      onChange={e => setForm(f => ({ ...f, rodape: e.target.value.slice(0, 60) }))}
                      placeholder="Ex: Não responda a este número" maxLength={60} className={inputCls} />
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{form.rodape.length}/60 caracteres</p>
                  </div>
                  <div>
                    <label className={labelCls}>Botões</label>
                    <div className="space-y-3">
                      {form.botoes.map((btn, i) => (
                        <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2.5 bg-slate-50 dark:bg-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Botão {i + 1}</span>
                            {form.botoes.length > 1 && (
                              <button type="button" onClick={() => removerBotao(i)}
                                className="text-xs text-red-500 dark:text-red-400 hover:underline font-medium">Remover</button>
                            )}
                          </div>
                          <select value={btn.tipo} onChange={e => atualizarBotao(i, 'tipo', e.target.value)}
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                            <option value="url">Link (URL)</option>
                            <option value="optout">Cancelar inscrição</option>
                            <option value="copiar">Copiar código</option>
                          </select>
                          <input type="text" value={btn.titulo} onChange={e => atualizarBotao(i, 'titulo', e.target.value)}
                            placeholder="Título do botão"
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                          {btn.tipo === 'url' && (
                            <input type="text" value={btn.url} onChange={e => atualizarBotao(i, 'url', e.target.value)}
                              placeholder="https://exemplo.com"
                              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                          )}
                          {btn.tipo === 'copiar' && (
                            <input type="text" value={btn.codigo} onChange={e => atualizarBotao(i, 'codigo', e.target.value)}
                              placeholder="Código a copiar (ex: PROMO10)"
                              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono" />
                          )}
                        </div>
                      ))}
                    </div>
                    {form.botoes.length < 3 && (
                      <button type="button" onClick={adicionarBotao}
                        className="mt-2.5 flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                        <IconPlus size={14} /> Adicionar botão
                      </button>
                    )}
                  </div>
                </>
              )}

              {erro && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5 text-sm text-red-600 dark:text-red-400">{erro}</div>
              )}
            </div>

            <div>
              <p className={labelCls}>Pré-visualização WhatsApp</p>
              <PreviewWhatsApp mensagem={form.mensagem} rodape={form.tipo === 'botoes' ? form.rodape : ''} tipo={form.tipo} botoes={form.botoes} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancelar
          </button>
          <motion.button type="button" onClick={salvar} disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: '0 4px 15px rgba(37,99,235,0.35)' }} whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <IconLoader size={16} className="animate-spin" />}
            {loading ? 'Salvando...' : isNovo ? 'Criar Modelo' : 'Salvar Alterações'}
          </motion.button>
        </div>
      </div>
    </ModalWrapper>
  )
}

export default function Modelos() {
  const [modelos, setModelos]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [busca, setBusca]             = useState('')
  const [filtroTipo, setFiltroTipo]   = useState('todos')
  const [modalAberto, setModalAberto] = useState(null)

  const carregar = async () => {
    try {
      const res = await axios.get(`${API}/`)
      setModelos(res.data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const excluir = async (id) => {
    if (!confirm('Excluir este modelo? Esta ação não pode ser desfeita.')) return
    try {
      await axios.delete(`${API}/${id}/`)
      setModelos(prev => prev.filter(m => m.id !== id))
    } catch { alert('Erro ao excluir modelo.') }
  }

  const modelosFiltrados = modelos.filter(m => {
    const matchBusca = m.nome.toLowerCase().includes(busca.toLowerCase())
    const matchTipo  = filtroTipo === 'todos' || m.tipo === filtroTipo
    return matchBusca && matchTipo
  })

  const formatarData = (d) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Modelos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Templates de mensagens para suas campanhas</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 4px 15px rgba(37,99,235,0.35)' }} whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => setModalAberto('novo')}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <IconPlus size={16} strokeWidth={2.5} /> Novo Modelo
        </motion.button>
      </motion.div>

      {/* Filtros */}
      <motion.div
        className="flex items-center gap-3"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        <div className="relative flex-1 max-w-sm">
          <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar modelos..."
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/20" />
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          <option value="todos">Todos os tipos</option>
          <option value="texto">Texto</option>
          <option value="botoes">Botões</option>
        </select>
      </motion.div>

      {/* Tabela */}
      <motion.div
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Lista de Modelos</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <IconLoader size={24} className="animate-spin mr-2" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : modelosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-3">
            <IconTemplate size={40} strokeWidth={1} />
            <p className="text-sm">
              {modelos.length === 0 ? 'Nenhum modelo cadastrado.' : 'Nenhum modelo encontrado para os filtros aplicados.'}
            </p>
            {modelos.length === 0 && (
              <button onClick={() => setModalAberto('novo')} className="text-sm text-primary hover:underline font-medium">
                Criar primeiro modelo
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                {['Nome', 'Tipo', 'Mensagem', 'Criado em', 'Ações'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody
              className="divide-y divide-slate-100 dark:divide-slate-700"
              variants={stagger} initial="hidden" animate="show"
            >
              {modelosFiltrados.map(m => (
                <motion.tr key={m.id} variants={staggerItem} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconTemplate size={16} className="text-primary" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{m.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${
                      m.tipo === 'botoes'
                        ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                    }`}>
                      {m.tipo === 'botoes' ? 'Botões' : 'Texto'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 max-w-[220px]">
                    <span className="block truncate">
                      {m.mensagem ? m.mensagem.slice(0, 50) + (m.mensagem.length > 50 ? '…' : '') : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatarData(m.criado_em)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setModalAberto(m)}
                        className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                        <IconPencil size={13} /> Editar
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => excluir(m.id)}
                        className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 font-medium hover:underline">
                        <IconTrash size={13} /> Excluir
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        )}
      </motion.div>

      <AnimatePresence>
        {modalAberto !== null && (
          <ModalModelo key="modal-modelo" modalAberto={modalAberto} onClose={() => setModalAberto(null)} onSalvo={carregar} />
        )}
      </AnimatePresence>
    </div>
  )
}
