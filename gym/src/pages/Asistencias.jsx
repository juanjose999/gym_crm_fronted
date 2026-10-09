import { useEffect, useState } from 'react'
import { api, formatDateTime } from '../api.js'
import Modal from '../components/Modal.jsx'

// Asistencias: /asistencias (registrar entrada y listar)
const EMPTY_FORM = { email: '', fechaEntrada: '', tipoAcceso: '' }

export default function Asistencias() {
  const [asistencias, setAsistencias] = useState([])
  const [socios, setSocios] = useState([])
  const [planes, setPlanes] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      setAsistencias(await api('/asistencias'))
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    // Socios y planes para los <select> del formulario
    api('/socios').then(setSocios).catch((err) => setError(err.message))
    api('/planes').then(setPlanes).catch((err) => setError(err.message))
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await api('/asistencias', 'POST', {
        email: form.email,
        tipoAcceso: form.tipoAcceso,
        // Si va vacía, la API usa la fecha y hora actual
        fechaEntrada: form.fechaEntrada || null,
      })
      closeForm()
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function openForm() {
    setForm(EMPTY_FORM)
    setError('')
    setFormOpen(true)
  }

  function closeForm() {
    setForm(EMPTY_FORM)
    setFormOpen(false)
  }

  return (
    <section className="page">
      <div className="page__header">
        <h2 className="page__title">Asistencias</h2>
        <button className="button button--primary" onClick={openForm}>+ Registrar asistencia</button>
      </div>
      {error && !formOpen && <p className="alert alert--error">{error}</p>}

      {formOpen && (
        <Modal title="Registrar asistencia" onClose={closeForm}>
          <form className="form" onSubmit={handleSubmit}>
            {error && <p className="alert alert--error">{error}</p>}
            <label className="form__field">
              <span className="form__label">Socio</span>
              {/* La API identifica al socio por su correo */}
              <select className="form__input" name="email" value={form.email} onChange={handleChange} required>
                <option value="">Selecciona...</option>
                {socios.map((s) => (
                  <option key={s.id} value={s.email}>{s.nombres} {s.apellidos}</option>
                ))}
              </select>
            </label>
            <label className="form__field">
              <span className="form__label">Tipo de acceso</span>
              {/* Se envía el nombre del plan como tipo de acceso */}
              <select className="form__input" name="tipoAcceso" value={form.tipoAcceso} onChange={handleChange} required>
                <option value="">Selecciona...</option>
                {planes.map((p) => (
                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
            </label>
            <label className="form__field">
              <span className="form__label">Fecha y hora (opcional)</span>
              <input className="form__input" type="datetime-local" name="fechaEntrada" value={form.fechaEntrada} onChange={handleChange} />
            </label>
            <div className="form__actions">
              <button className="button button--primary" type="submit">Registrar</button>
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
            <th className="table__head">Correo</th>
            <th className="table__head">Entrada</th>
            <th className="table__head">Tipo de acceso</th>
          </tr>
        </thead>
        <tbody>
          {asistencias.map((a) => (
            <tr key={a.id} className="table__row">
              <td className="table__cell">{a.id}</td>
              <td className="table__cell">{a.usuarioNombre}</td>
              <td className="table__cell">{a.usuarioEmail}</td>
              <td className="table__cell">{formatDateTime(a.fechaEntrada)}</td>
              <td className="table__cell">{a.tipoAcceso}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {asistencias.length === 0 && <p className="page__empty">No hay asistencias registradas.</p>}
    </section>
  )
}
