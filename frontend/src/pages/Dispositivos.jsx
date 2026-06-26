import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconDeviceMobile, IconPlus, IconWifi, IconWifiOff, IconLoader,
  IconQrcode, IconTrash, IconRefresh, IconX,
} from '@tabler/icons-react'
import { fadeUp, stagger, staggerItem, toastV } from '../lib/motion'
import ModalWrapper from '../components/ModalWrapper'

const API = `${import.meta.env.VITE_API_URL}/api/dispositivos`

const statusConfig = {
  open:       { label: 'Conectado',    icon: IconWifi,    classes: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  close:      { label: 'Desconectado', icon: IconWifiOff, classes: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'               },
  connecting: { label: 'Conectando',   icon: IconLoader,  classes: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'              },
}

function ModalQRCode({ dispositivo, onClose, onConectado }) {
  const [qrData, setQrData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState(null)

  useEffect(() => {
    const buscarQR = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${API}/${dispositivo.id}/qrcode/`)
        setQrData(res.data)
      } catch {
        setErro('Não foi possível obter o QR Code. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
    buscarQR()
    const intervalQR = setInterval(buscarQR, 30000)

    const checarStatus = async () => {
      try {
        const res = await axios.get(`${API}/${dispositivo.id}/status/`)
        if (res.data.status === 'open') { onConectado(); onClose() }
      } catch {}
    }
    const intervalStatus = setInterval(checarStatus, 2000)

    return () => { clearInterval(intervalQR); clearInterval(intervalStatus) }
  }, [dispositivo.id])

  return (
    <ModalWrapper onClose={onClose} maxWidth="384px">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Conectar WhatsApp</h3>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <IconX size={20} />
          </motion.button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center">
          Abra o WhatsApp → Aparelhos conectados → Conectar aparelho
        </p>

        <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl p-4 min-h-48">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
              <IconLoader size={32} className="animate-spin" />
              <span className="text-sm">Gerando QR Code...</span>
            </div>
          )}
          {erro && <p className="text-sm text-red-500 text-center">{erro}</p>}
          {qrData?.base64 && <img src={qrData.base64} alt="QR Code WhatsApp" className="w-48 h-48" />}
          {qrData?.code && !qrData?.base64 && (
            <p className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all text-center">{qrData.code}</p>
          )}
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-3">
          O QR Code expira em 45 segundos. Atualizando automaticamente.
        </p>
      </div>
    </ModalWrapper>
  )
}

function ModalNovoDispositivo({ onClose, onSalvo }) {
  const [form, setForm]       = useState({ nome: '', instance_name: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nome || !form.instance_name) return
    setLoading(true)
    setErro(null)
    try {
      await axios.post(`${API}/`, form)
      onSalvo()
      onClose()
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao criar dispositivo.')
    } finally {
      setLoading(false)
    }
  }

  const handleNomeChange = (e) => {
    const nome = e.target.value
    const instanceName = nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setForm({ nome, instance_name: instanceName })
  }

  return (
    <ModalWrapper onClose={onClose} maxWidth="448px">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Novo Dispositivo</h3>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <IconX size={20} />
          </motion.button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Nome do dispositivo
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={handleNomeChange}
              placeholder="Ex: Motorola G22 - Pedro"
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary/20"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              ID da instância
            </label>
            <input
              type="text"
              value={form.instance_name}
              onChange={e => setForm({ ...form, instance_name: e.target.value })}
              placeholder="Ex: motorola-pedro"
              className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary/20 font-mono"
              required
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Apenas letras minúsculas, números e hifens.</p>
          </div>

          {erro && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400">{erro}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <motion.button type="submit" disabled={loading}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <IconLoader size={16} className="animate-spin" /> : <IconPlus size={16} />}
              {loading ? 'Criando...' : 'Criar Dispositivo'}
            </motion.button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  )
}

export default function Dispositivos() {
  const [dispositivos, setDispositivos]   = useState([])
  const [loading, setLoading]             = useState(true)
  const [sincronizando, setSincronizando] = useState(false)
  const [modalNovo, setModalNovo]         = useState(false)
  const [modalQR, setModalQR]             = useState(null)
  const [toast, setToast]                 = useState(null)

  const exibirToast = (mensagem) => {
    setToast(mensagem)
    setTimeout(() => setToast(null), 4000)
  }

  const carregar = async () => {
    try {
      const res = await axios.get(`${API}/`)
      setDispositivos(res.data)
    } catch {}
    finally { setLoading(false) }
  }

  const sincronizar = async () => {
    setSincronizando(true)
    try {
      const res = await axios.get(`${API}/sincronizar/`)
      setDispositivos(res.data)
    } catch {}
    finally { setSincronizando(false) }
  }

  const excluir = async (id) => {
    if (!confirm('Excluir este dispositivo?')) return
    try {
      await axios.delete(`${API}/${id}/`)
      setDispositivos(prev => prev.filter(d => d.id !== id))
    } catch { alert('Erro ao excluir dispositivo.') }
  }

  useEffect(() => {
    carregar()
    const interval = setInterval(sincronizar, 30000)
    return () => clearInterval(interval)
  }, [])

  const conectados    = dispositivos.filter(d => d.status === 'open').length
  const desconectados = dispositivos.filter(d => d.status === 'close').length
  const conectando    = dispositivos.filter(d => d.status === 'connecting').length

  const kpis = [
    { label: 'Total',         value: dispositivos.length, color: 'text-slate-700 dark:text-slate-200' },
    { label: 'Conectados',    value: conectados,          color: 'text-slate-700 dark:text-slate-200' },
    { label: 'Desconectados', value: desconectados,       color: 'text-slate-700 dark:text-slate-200' },
    { label: 'Conectando',    value: conectando,          color: 'text-slate-700 dark:text-slate-200' },
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Dispositivos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Gerencie os números WhatsApp conectados</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={sincronizar} disabled={sincronizando}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <IconRefresh size={15} className={sincronizando ? 'animate-spin' : ''} />
            Sincronizar
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() => setModalNovo(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <IconPlus size={16} strokeWidth={2.5} />
            Novo Dispositivo
          </motion.button>
        </div>
      </motion.div>

      {/* KPI cards */}
      <motion.div
        className="grid grid-cols-4 gap-4"
        variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        {kpis.map(kpi => (
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

      {/* Table */}
      <motion.div
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
      >
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Lista de Dispositivos</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 dark:text-slate-500">
            <IconLoader size={24} className="animate-spin mr-2" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : dispositivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-3">
            <IconDeviceMobile size={40} strokeWidth={1} />
            <p className="text-sm">Nenhum dispositivo cadastrado.</p>
            <button onClick={() => setModalNovo(true)} className="text-sm text-primary hover:underline font-medium">
              Adicionar primeiro dispositivo
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                {['Dispositivo', 'Instância', 'Número', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody
              className="divide-y divide-slate-100 dark:divide-slate-700"
              variants={stagger} initial="hidden" animate="show"
            >
              {dispositivos.map(d => {
                const cfg        = statusConfig[d.status] || statusConfig['close']
                const StatusIcon = cfg.icon
                return (
                  <motion.tr
                    key={d.id}
                    variants={staggerItem}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconDeviceMobile size={16} className="text-primary" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{d.nome}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 font-mono">{d.instance_name}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">{d.numero || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.classes}`}>
                        <StatusIcon size={11} strokeWidth={2.5} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {d.status !== 'open' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setModalQR(d)}
                            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                          >
                            <IconQrcode size={13} /> QR Code
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => excluir(d.id)}
                          className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 font-medium hover:underline"
                        >
                          <IconTrash size={13} /> Excluir
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </motion.tbody>
          </table>
        )}
      </motion.div>

      <AnimatePresence>
        {modalNovo && (
          <ModalNovoDispositivo key="modal-novo"
            onClose={() => setModalNovo(false)}
            onSalvo={carregar}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalQR && (
          <ModalQRCode key="modal-qr"
            dispositivo={modalQR}
            onClose={() => setModalQR(null)}
            onConectado={() => { exibirToast('WhatsApp conectado com sucesso!'); carregar() }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            variants={toastV} initial="hidden" animate="show" exit="exit"
            className="fixed top-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <IconWifi size={18} strokeWidth={2.5} />
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
