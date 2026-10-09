import { useEffect, useState } from 'react'
import { api, formatMoney, formatDateTime } from '../api.js'
import EstadoBadge from '../components/EstadoBadge.jsx'

// Vista del socio: /mi-cuenta/membresias y /mi-cuenta/compras (solo lectura)
export default function MiCuenta() {
  const [membresias, setMembresias] = useState([])
  const [compras, setCompras] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api('/mi-cuenta/membresias').then(setMembresias).catch((err) => setError(err.message))
    api('/mi-cuenta/compras').then(setCompras).catch((err) => setError(err.message))
  }, [])

  return (
    <section className="page">
      {error && <p className="alert alert--error">{error}</p>}

      <h2 className="page__title">Mis membresías</h2>
      <table className="table">
        <thead>
          <tr>
            <th className="table__head">Plan</th>
            <th className="table__head">Inicio</th>
            <th className="table__head">Fin</th>
            <th className="table__head">Estado</th>
            <th className="table__head">Pagado</th>
            <th className="table__head">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {membresias.map((m) => (
            <tr key={m.id} className="table__row">
              <td className="table__cell">{m.plan.nombre}</td>
              <td className="table__cell">{m.fechaInicio}</td>
              <td className="table__cell">{m.fechaFin}</td>
              <td className="table__cell"><EstadoBadge estado={m.estado} /></td>
              <td className="table__cell">{formatMoney(m.totalPagado)}</td>
              <td className="table__cell">{formatMoney(m.saldoPendiente)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {membresias.length === 0 && <p className="page__empty">No tienes membresías.</p>}

      <h2 className="page__title">Mis compras</h2>
      <table className="table">
        <thead>
          <tr>
            <th className="table__head">Fecha</th>
            <th className="table__head">Productos</th>
            <th className="table__head">Total</th>
          </tr>
        </thead>
        <tbody>
          {compras.map((o) => (
            <tr key={o.id} className="table__row">
              <td className="table__cell">{formatDateTime(o.fecha)}</td>
              <td className="table__cell">
                {o.items.map((it) => (
                  <div key={it.id} className="table__item">
                    {it.cantidad} x {it.productoNombre} ({formatMoney(it.subtotal)})
                    {it.estado && <EstadoBadge estado={it.estado} />}
                  </div>
                ))}
              </td>
              <td className="table__cell">{formatMoney(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {compras.length === 0 && <p className="page__empty">No tienes compras.</p>}
    </section>
  )
}
