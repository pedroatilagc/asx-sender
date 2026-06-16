import { motion } from 'framer-motion'
import { backdropV, modalV } from '../lib/motion'

export default function ModalWrapper({ children, onClose, maxWidth = '448px' }) {
  return (
    <motion.div
      variants={backdropV} initial="hidden" animate="show" exit="exit"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{
        backgroundColor: 'rgba(15, 17, 23, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <motion.div
        variants={modalV} initial="hidden" animate="show" exit="exit"
        onClick={e => e.stopPropagation()}
        className="w-full my-auto"
        style={{ maxWidth }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
