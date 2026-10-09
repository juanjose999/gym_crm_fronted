import { useEffect, useState } from 'react'
import { api } from '../api.js'
import Modal from '../components/Modal.jsx'

// CRUD de socios: /socios
const EMPTY_FORM = { nombres: '', apellidos: '', telefono: '', email: '' }

export default function Socios() {
  const [socios, setSocios] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null) // null = creando
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      setSocios(await api('/socios'))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const body = { ...form, telefono: form.telefono || null }
    try {
      if (editingId) {
        await api(`/socios/${editingId}`, 'PUT', body)
      } else {
        await api('/socios', 'POST', body)
      }
      closeForm()
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function startEdit(id) {
    try {
      const socio = await api(`/socios/${id}`)
      setForm({
        nombres: socio.nombres,
        apellidos: socio.apellidos,
        telefono: socio.telefono ?? '',
        email: socio.email,
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
    if (!confirm('¿Eliminar este socio?')) return
    try {
      await api(`/socios/${id}`, 'DELETE')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="page">
      <div className="page__header">
        <h2 className="page__title">Socios</h2>
        <button className="button button--primary" onClick={openCreate}>+ Registrar socio</button>
      </div>
      {error && !formOpen && <p className="alert alert--error">{error}</p>}

      {formOpen && (
        <Modal title={editingId ? `Editar socio #${editingId}` : 'Nuevo socio'} onClose={closeForm}>
          <form className="form" onSubmit={handleSubmit}>
            {error && <p className="alert alert--error">{error}</p>}
            <label className="form__field">
              <span className="form__label">Nombres</span>
              <input className="form__input" name="nombres" value={form.nombres} onChange={handleChange} required />
            </label>
            <label className="form__field">
              <span className="form__label">Apellidos</span>
              <input className="form__input" name="apellidos" value={form.apellidos} onChange={handleChange} required />
            </label>
            <label className="form__field">
              <span className="form__label">Teléfono</span>
              <input className="form__input" name="telefono" value={form.telefono} onChange={handleChange} />
            </label>
            <label className="form__field">
              <span className="form__label">Correo</span>
              <input className="form__input" type="email" name="email" value={form.email} onChange={handleChange} required />
            </label>
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
            <th className="table__head">Nombre</th>
            <th className="table__head">Teléfono</th>
            <th className="table__head">Correo</th>
            <th className="table__head"></th>
          </tr>
        </thead>
        <tbody>
          {socios.map((s) => (
            <tr key={s.id} className="table__row">
              <td className="table__cell">{s.id}</td>
              <td className="table__cell">{s.nombres} {s.apellidos}</td>
              <td className="table__cell">{s.telefono || '-'}</td>
              <td className="table__cell">{s.email}</td>
              <td className="table__cell table__cell--actions">
                <button className="button button--small" onClick={() => startEdit(s.id)}>Editar</button>
                <button className="button button--small button--danger" onClick={() => remove(s.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {socios.length === 0 && <p className="page__empty">No hay socios registrados.</p>}
    </section>
  )
}
