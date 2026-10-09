// Etiqueta de color según el estado de la membresía: DEUDA, PAGO_PARCIAL o PAGADO
const MODIFIERS = {
  DEUDA: 'badge--danger',
  PAGO_PARCIAL: 'badge--warning',
  PAGADO: 'badge--success',
}

export default function EstadoBadge({ estado }) {
  return <span className={'badge ' + MODIFIERS[estado]}>{estado.replace('_', ' ')}</span>
}
