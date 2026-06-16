export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export const modalOverlay = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.2 } },
  exit:   { opacity: 0, transition: { duration: 0.15 } },
}

export const modalPanel = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  show:   { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit:   { opacity: 0, scale: 0.95, y: 8,  transition: { duration: 0.15 } },
}

export const backdropV = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.2 } },
  exit:   { opacity: 0, transition: { duration: 0.15 } },
}

export const modalV = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  show:   { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit:   { opacity: 0, scale: 0.95, y: 8,  transition: { duration: 0.15 } },
}

export const toastV = {
  hidden: { opacity: 0, x: 72, scale: 0.95 },
  show:   { opacity: 1, x: 0,  scale: 1,    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:   { opacity: 0, x: 72, scale: 0.95, transition: { duration: 0.2 } },
}

export const pageV = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.28, ease: 'easeOut' } },
  exit:   { opacity: 0,        transition: { duration: 0.15 } },
}

export const sidebarV = {
  expanded:  { width: 240, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  collapsed: { width: 64,  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
}

export const sidebarLabelV = {
  expanded:  { opacity: 1, x: 0,   transition: { duration: 0.2, delay: 0.08 } },
  collapsed: { opacity: 0, x: -8,  transition: { duration: 0.12 } },
}
