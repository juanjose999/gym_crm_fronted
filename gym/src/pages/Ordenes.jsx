import { useEffect, useState } from 'react'
import { api, formatMoney, formatDateTime } from '../api.js'
import Modal from '../components/Modal.jsx'
import EstadoBadge from '../components/EstadoBadge.jsx'

// Órdenes de compra: /ordenes (solo crear y listar)
const EMPTY_ITEM = { productoId: '', cantidad: 1, estado: '' }

// Estado de pago de cada ítem
const ESTADOS_ITEM = [
  { value: 'PAGADO', label: 'Pagado' },
  { value: 'DEUDA', label: 'Deuda' },
]

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([])
  const [socios, setSocios] = useState([])
  const [productos, setProductos] = useState([])
  const [socioId, setSocioId] = useState('')
  const [items, setItems] = useState([EMPTY_ITEM])
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      setOrdenes(await api('/ordenes'))
      // Recargamos productos para ver el stock actualizado
      setProductos(await api('/productos'))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    api('/socios').then(setSocios).catch((err) => setError(err.message))
  }, [])

  // ---------- Ítems de la orden ----------

  function changeItem(index, field, value) {
    const copia = [...items]
    copia[index] = { ...copia[index], [field]: value }
    setItems(copia)
  }

  function addItem() {
    setItems([...items, EMPTY_ITEM])
  }

  function removeItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await api('/ordenes', 'POST', {
        socioId: Number(socioId),
        items: items.map((it) => ({ productoId: Number(it.productoId), cantidad: Number(it.cantidad), estado: it.estado })),
      })
      closeForm()
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function openForm() {
    setSocioId('')
    setItems([EMPTY_ITEM])
    setError('')
    setFormOpen(true)
  }

  function closeForm() {
    setSocioId('')
    setItems([EMPTY_ITEM])
    setFormOpen(false)
  }

  return (
    <section className="page">
      <div className="page__header">
        <h2 className="page__title">Órdenes</h2>
        <button className="button button--primary" onClick={openForm}>+ Registrar orden</button>
      </div>
      {error && !formOpen && <p className="alert alert--error">{error}</p>}

      {formOpen && (
        <Modal title="Nueva orden" onClose={closeForm} wide>
          <form className="form" onSubmit={handleSubmit}>
            {error && <p className="alert alert--error">{error}</p>}
            <label className="form__field">
              <span className="form__label">Socio</span>
              <select className="form__input" value={socioId} onChange={(e) => setSocioId(e.target.value)} required>
                <option value="">Selecciona...</option>
                {socios.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombres} {s.apellidos}</option>
                ))}
              </select>
            </label>

            {items.map((item, index) => (
              <div key={index} className="form__row">
                <label className="form__field">
                  <span className="form__label">Producto</span>
                  <select className="form__input" value={item.productoId} onChange={(e) => changeItem(index, 'productoId', e.target.value)} required>
                    <option value="">Selecciona...</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} — {formatMoney(p.precio)} (stock {p.stock})</option>
                    ))}
                  </select>
                </label>
                <label className="form__field">
                  <span className="form__label">Cantidad</span>
                  <input className="form__input" type="number" min="1" value={item.cantidad} onChange={(e) => changeItem(index, 'cantidad', e.target.value)} required />
                </label>
                <label className="form__field">
                  <span className="form__label">Estado</span>
                  <select className="form__input" value={item.estado} onChange={(e) => changeItem(index, 'estado', e.target.value)} required>
                    <option value="">Selecciona...</option>
                    {ESTADOS_ITEM.map((e) => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </label>
                {items.length > 1 && (
                  <button className="button button--small button--danger" type="button" onClick={() => removeItem(index)}>Quitar</button>
                )}
              </div>
            ))}

            <div className="form__actions">
              <button className="button button--ghost" type="button" onClick={addItem}>+ Agregar producto</button>
              <button className="button button--primary" type="submit">Crear orden</button>
              <button className="button button--ghost" type="button" onClick={closeForm}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      <table className="table">
        <thead>
          <tr>
            <th className="table__head">ID</th>
            <th className="table__head">Socio</th>
            <th className="table__head">Fecha</th>
            <th className="table__head">Productos</th>
            <th className="table__head">Total</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map((o) => (
            <tr key={o.id} className="table__row">
              <td className="table__cell">{o.id}</td>
              <td className="table__cell">{o.socioNombre}</td>
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
      {ordenes.length === 0 && <p className="page__empty">No hay órdenes registradas.</p>}
    </section>
  )
}
