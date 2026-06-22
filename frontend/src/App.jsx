import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dispositivos from './pages/Dispositivos'
import Campanhas from './pages/Campanhas'
import Modelos from './pages/Modelos'
import Contatos from './pages/Contatos'
import Relatorios from './pages/Relatorios'
import Mensagens from './pages/Mensagens'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dispositivos" replace />} />
        <Route path="/dispositivos" element={<Dispositivos />} />
        <Route path="/campanhas" element={<Campanhas />} />
        <Route path="/modelos" element={<Modelos />} />
        <Route path="/contatos" element={<Contatos />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/mensagens" element={<Mensagens />} />
      </Routes>
    </Layout>
  )
}
