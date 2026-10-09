import { useEffect, useState } from 'react'
import { api, formatMoney, formatDateTime } from '../api.js'
import EstadoBadge from '../components/EstadoBadge.jsx'
import Modal from '../components/Modal.jsx'

// Membresías: /membresias  y sus pagos: /membresias/{id}/pagos
const EMPTY_FORM = { socioId: '', planId: '', fechaInicio: '', fechaFin: '', monto: '', metodoPago: '' }
const EMPTY_PAGO = { monto: '', metodoPago: '' }
const METODOS_PAGO = ['Efectivo', 'Nequi', 'Especie']

export default function Membresias() {
  const [membresias, setMembresias] = useState([])
  const [socios, setSocios] = useState([])
  const [planes, setPlanes] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')

  // Detalle de una membresía (para ver y gestionar sus pagos)
  const [detalle, setDetalle] = useState(null)
  const [pagoForm, setPagoForm] = useState(EMPTY_PAGO)
  const [editingPagoId, setEditingPagoId] = useState(null)
  const [pagoFormOpen, setPagoFormOpen] = useState(false)

  async function load() {
    try {
      setMembresias(await api('/membresias'))
    } catch (err) {
      setError(err.message)
    }
  }

  // Socios y planes se necesitan para los <select> del formulario
  async function loadOptions() {
    try {
      setSocios(await api('/socios'))
      setPlanes(await api('/planes'))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    loadOptions()
  }, [])

  // ---------- Crear / editar membresía ----------

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await api(`/membresias/${editingId}`, 'PUT', {
          planId: Number(form.planId),
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin || null,
        })
      } else {
        await api('/membresias', 'POST', {
          socioId: Number(form.socioId),
          planId: Number(form.planId),
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin || null,
          monto: form.monto ? Number(form.monto) : null,
          metodoPago: form.metodoPago || null,
        })
      }
      closeForm()
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function startEdit(id) {
    try {
      const m = await api(`/membresias/${id}`)
      setForm({
        socioId: m.usuario.id,
        planId: m.plan.id,
        fechaInicio: m.fechaInicio,
        fechaFin: m.fechaFin ?? '',
        monto: '',
        metodoPago: '',
      })
      setEditingId(id)
      setError('')
      setFormOpen(true)
    } catch (err) {
      setError(err.message)
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError('')
    setFormOpen(true)
  }

  function closeForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormOpen(false)
  }

  async function remove(id) {
    if (!confirm('¿Eliminar esta membresía?')) return
    try {
      await api(`/membresias/${id}`, 'DELETE')
      if (detalle?.id === id) setDetalle(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  // ---------- Pagos ----------

  async function openDetalle(id) {
    try {
      setDetalle(await api(`/membresias/${id}`))
      setError('')
      closePagoForm()
    } catch (err) {
      setError(err.message)
    }
  }

  function closeDetalle() {
    closePagoForm()
    setDetalle(null)
  }

  function handlePagoChange(e) {
    setPagoForm({ ...pagoForm, [e.target.name]: e.target.value })
  }

  async function handlePagoSubmit(e) {
    e.preventDefault()
    setError('')
    const body = { monto: Number(pagoForm.monto), metodoPago: pagoForm.metodoPago }
    try {
      // Ambos endpoints devuelven la membresía actualizada
      let actualizada
      if (editingPagoId) {
        actualizada = await api(`/membresias/${detalle.id}/pagos/${editingPagoId}`, 'PUT', body)
      } else {
        actualizada = await api(`/membresias/${detalle.id}/pagos`, 'POST', body)
      }
      setDetalle(actualizada)
      closePagoForm()
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function openPagoCreate() {
    setPagoForm(EMPTY_PAGO)
    setEditingPagoId(null)
    setError('')
    setPagoFormOpen(true)
  }

  function startPagoEdit(pago) {
    setPagoForm({ monto: pago.monto, metodoPago: pago.metodoPago })
    setEditingPagoId(pago.id)
    setError('')
    setPagoFormOpen(true)
  }

  function closePagoForm() {
    setPagoForm(EMPTY_PAGO)
    setEditingPagoId(null)
    setPagoFormOpen(false)
  }

  return (
    <section className="page">
      <div className="page__header">
        <h2 className="page__title">Membresías</h2>
        <button className="button button--primary" onClick={openCreate}>+ Registrar membresía</button>
      </div>
      {error && !formOpen && !detalle && <p className="alert alert--error">{error}</p>}

      {formOpen && (
        <Modal title={editingId ? `Editar membresía #${editingId}` : 'Nueva membresía'} onClose={closeForm}>
          <form className="form" onSubmit={handleSubmit}>
            {error && <p className="alert alert--error">{error}</p>}
            <label className="form__field">
              <span className="form__label">Socio</span>
              <select className="form__input" name="socioId" value={form.socioId} onChange={handleChange} required disabled={!!editingId}>
                <option value="">Selecciona...</option>
                {socios.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombres} {s.apellidos}</option>
                ))}
              </select>
            </label>
            <label className="form__field">
              <span className="form__label">Plan</span>
              <select className="form__input" name="planId" value={form.planId} onChange={handleChange} required>
                <option value="">Selecciona...</option>
                {planes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre} ({formatMoney(p.precio)})</option>
                ))}
              </select>
            </label>
            <label className="form__field">
              <span className="form__label">Fecha inicio</span>
              <input className="form__input" type="date" name="fechaInicio" value={form.fechaInicio} onChange={handleChange} required />
            </label>
            <label className="form__field">
              <span className="form__label">Fecha fin (opcional)</span>
              <input className="form__input" type="date" name="fechaFin" value={form.fechaFin} onChange={handleChange} />
            </label>

            {/* El pago inicial solo existe al crear */}
            {!editingId && (
              <>
                <label className="form__field">
                  <span className="form__label">Pago inicial (opcional)</span>
                  <input className="form__input" type="number" min="0" step="any" name="monto" value={form.monto} onChange={handleChange} />
                </label>
                <label className="form__field">
                  <span className="form__label">Método de pago</span>
                  <select className="form__input" name="metodoPago" value={form.metodoPago} onChange={handleChange} required={Number(form.monto) > 0}>
                    <option value="">Seleccionar...</option>
                    {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
              </>
            )}

            <div className="form__actions">
              <button className="button button--primary" type="submit">{editingId ? 'Guardar' : 'Crear'}</button>
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
            <th className="table__head">Plan</th>
            <th className="table__head">Inicio</th>
            <th className="table__head">Fin</th>
            <th className="table__head">Estado</th>
            <th className="table__head">Pagado</th>
            <th className="table__head">Saldo</th>
            <th className="table__head"></th>
          </tr>
        </thead>
        <tbody>
          {membresias.map((m) => (
            <tr key={m.id} className="table__row">
              <td className="table__cell">{m.id}</td>
              <td className="table__cell">{m.usuario.nombre}</td>
              <td className="table__cell">{m.plan.nombre}</td>
              <td className="table__cell">{m.fechaInicio}</td>
              <td className="table__cell">{m.fechaFin}</td>
              <td className="table__cell"><EstadoBadge estado={m.estado} /></td>
              <td className="table__cell">{formatMoney(m.totalPagado)}</td>
              <td className="table__cell">{formatMoney(m.saldoPendiente)}</td>
              <td className="table__cell table__cell--actions">
                <button className="button button--small" onClick={() => openDetalle(m.id)}>Pagos</button>
                <button className="button button--small" onClick={() => startEdit(m.id)}>Editar</button>
                <button className="button button--small button--danger" onClick={() => remove(m.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {membresias.length === 0 && <p className="page__empty">No hay membresías registradas.</p>}

      {detalle && (
        <Modal title={`Pagos de la membresía #${detalle.id} — ${detalle.usuario.nombre} (${detalle.plan.nombre})`} onClose={closeDetalle} wide>
          {error && !pagoFormOpen && <p className="alert alert--error">{error}</p>}

          <div className="card__header">
            <p className="card__text">
              Estado: <EstadoBadge estado={detalle.estado} /> · Pagado: {formatMoney(detalle.totalPagado)} · Saldo: {formatMoney(detalle.saldoPendiente)}
            </p>
            <button className="button button--primary button--small" onClick={openPagoCreate}>+ Registrar pago</button>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th className="table__head">ID</th>
                <th className="table__head">Monto</th>
                <th className="table__head">Método</th>
                <th className="table__head">Fecha</th>
                <th className="table__head"></th>
              </tr>
            </thead>
            <tbody>
              {detalle.pagos.map((p) => (
                <tr key={p.id} className="table__row">
                  <td className="table__cell">{p.id}</td>
                  <td className="table__cell">{formatMoney(p.monto)}</td>
                  <td className="table__cell">{p.metodoPago}</td>
                  <td className="table__cell">{formatDateTime(p.fechaPago)}</td>
                  <td className="table__cell table__cell--actions">
                    <button className="button button--small" onClick={() => startPagoEdit(p)}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {detalle.pagos.length === 0 && <p className="page__empty">Sin pagos todavía.</p>}

          {/* El formulario de pago se abre encima del detalle */}
          {pagoFormOpen && (
            <Modal title={editingPagoId ? `Editar pago #${editingPagoId}` : 'Registrar pago'} onClose={closePagoForm}>
              <form className="form" onSubmit={handlePagoSubmit}>
                {error && <p className="alert alert--error">{error}</p>}
                <label className="form__field">
                  <span className="form__label">Monto</span>
                  <input className="form__input" type="number" min="0.01" step="any" name="monto" value={pagoForm.monto} onChange={handlePagoChange} required />
                </label>
                <label className="form__field">
                  <span className="form__label">Método de pago</span>
                  <select className="form__input" name="metodoPago" value={pagoForm.metodoPago} onChange={handlePagoChange} required>
                    <option value="">Seleccionar...</option>
                    {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
                    {/* Pagos antiguos con un método fuera de la lista */}
                    {pagoForm.metodoPago && !METODOS_PAGO.includes(pagoForm.metodoPago) && (
                      <option value={pagoForm.metodoPago}>{pagoForm.metodoPago}</option>
                    )}
                  </select>
                </label>
                <div className="form__actions">
                  <button className="button button--primary" type="submit">
                    {editingPagoId ? 'Guardar' : 'Registrar pago'}
                  </button>
                  <button className="button button--ghost" type="button" onClick={closePagoForm}>Cancelar</button>
                </div>
              </form>
            </Modal>
          )}
        </Modal>
      )}
    </section>
  )
}
