import { useEffect, useState } from 'react'
import { api, formatMoney } from '../api.js'
import Modal from '../components/Modal.jsx'

// CRUD de productos: /productos
const EMPTY_FORM = { nombre: '', descripcion: '', precio: '', stock: '' }

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      setProductos(await api('/productos'))
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
    const body = {
      ...form,
      precio: Number(form.precio),
      stock: Number(form.stock),
    }
    try {
      if (editingId) {
        await api(`/productos/${editingId}`, 'PUT', body)
      } else {
        await api('/productos', 'POST', body)
      }
      closeForm()
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function startEdit(id) {
    try {
      const producto = await api(`/productos/${id}`)
      setForm({
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? '',
        precio: producto.precio,
        stock: producto.stock,
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
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await api(`/productos/${id}`, 'DELETE')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="page">
      <div className="page__header">
        <h2 className="page__title">Productos</h2>
        <button className="button button--primary" onClick={openCreate}>+ Registrar producto</button>
      </div>
      {error && !formOpen && <p className="alert alert--error">{error}</p>}

      {formOpen && (
        <Modal title={editingId ? `Editar producto #${editingId}` : 'Nuevo producto'} onClose={closeForm}>
          <form className="form" onSubmit={handleSubmit}>
            {error && <p className="alert alert--error">{error}</p>}
            <label className="form__field">
              <span className="form__label">Nombre</span>
              <input className="form__input" name="nombre" value={form.nombre} onChange={handleChange} required />
            </label>
            <label className="form__field">
              <span className="form__label">Descripción</span>
              <input className="form__input" name="descripcion" value={form.descripcion} onChange={handleChange} />
            </label>
            <label className="form__field">
              <span className="form__label">Precio</span>
              <input className="form__input" type="number" min="0" step="any" name="precio" value={form.precio} onChange={handleChange} required />
            </label>
            <label className="form__field">
              <span className="form__label">Stock</span>
              <input className="form__input" type="number" min="0" name="stock" value={form.stock} onChange={handleChange} required />
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
            <th className="table__head">Descripción</th>
            <th className="table__head">Precio</th>
            <th className="table__head">Stock</th>
            <th className="table__head"></th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id} className="table__row">
              <td className="table__cell">{p.id}</td>
              <td className="table__cell">{p.nombre}</td>
              <td className="table__cell">{p.descripcion || '-'}</td>
              <td className="table__cell">{formatMoney(p.precio)}</td>
              <td className="table__cell">{p.stock}</td>
              <td className="table__cell table__cell--actions">
                <button className="button button--small" onClick={() => startEdit(p.id)}>Editar</button>
                <button className="button button--small button--danger" onClick={() => remove(p.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {productos.length === 0 && <p className="page__empty">No hay productos registrados.</p>}
    </section>
  )
}
