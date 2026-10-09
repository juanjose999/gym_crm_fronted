import { useEffect, useRef } from 'react'

// Ventana superpuesta: oscurece lo de abajo y se cierra con la X, Escape o clic fuera.
// Se pueden apilar (p. ej. el formulario de pago encima del detalle de la membresía).
let abiertos = 0

export default function Modal({ title, onClose, children, wide = false }) {
  const dialogRef = useRef(null)

  // Bloquea el scroll de la página mientras haya algún modal abierto
  useEffect(() => {
    abiertos++
    document.body.style.overflow = 'hidden'
    dialogRef.current.focus()
    return () => {
      abiertos--
      if (abiertos === 0) document.body.style.overflow = ''
    }
  }, [])

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation() // solo se cierra el modal de más arriba
      onClose()
    }
  }

  return (
    <div className="modal" onKeyDown={handleKeyDown} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className={'modal__dialog' + (wide ? ' modal__dialog--wide' : '')} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" type="button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
