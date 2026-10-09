import { useState } from 'react'
import { api, saveSession } from '../api.js'
import Icon from '../components/Icon.jsx'

// Tres formas de entrar:
//  - admin:  correo + contraseña      -> POST /auth/login
//  - socio:  solo correo              -> POST /auth/socio/acceso
//  - signup: nuevo gimnasio + admin   -> POST /auth/signup
const EMPTY_FORM = {
  email: '',
  password: '',
  nombreGimnasio: '',
  nombres: '',
  apellidos: '',
  telefono: '',
}

const YEAR = new Date().getFullYear()

const MODES = {
  admin: {
    tab: 'Administrador',
    title: 'Bienvenido de nuevo',
    subtitle: 'Ingresa a tu panel para gestionar tu gimnasio.',
    submit: 'Iniciar sesión',
  },
  socio: {
    tab: 'Socio',
    title: 'Acceso de socios',
    subtitle: 'Consulta tus membresías y compras con tu correo.',
    submit: 'Entrar',
  },
  signup: {
    tab: 'Registrar gimnasio',
    title: 'Crea tu cuenta',
    subtitle: 'Registra tu gimnasio y empieza en minutos.',
    submit: 'Crear cuenta',
  },
}

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('admin')
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const texts = MODES[mode]

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function changeMode(next) {
    setMode(next)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let data
      if (mode === 'admin') {
        data = await api('/auth/login', 'POST', { email: form.email, password: form.password })
      } else if (mode === 'socio') {
        data = await api('/auth/socio/acceso', 'POST', { email: form.email })
      } else {
        data = await api('/auth/signup', 'POST', { ...form, telefono: form.telefono || null })
      }
      saveSession(data)
      onLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__panel">
        <div className="auth__brand">
          <span className="header__logo"><Icon name="logo" size={20} /></span>
          Gym<span className="header__accent">CRM</span>
        </div>

        <div className="card auth__card">
          <h1 className="auth__title">{texts.title}</h1>
          <p className="auth__subtitle">{texts.subtitle}</p>

          <div className="tabs" role="tablist">
            {Object.entries(MODES).map(([key, m]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                className={'tabs__item' + (mode === key ? ' tabs__item--active' : '')}
                onClick={() => changeMode(key)}
              >
                {m.tab}
              </button>
            ))}
          </div>

          {error && <p className="alert alert--error">{error}</p>}

          <form className="form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <label className="form__field">
                  <span className="form__label">Nombre del gimnasio</span>
                  <input className="form__input" name="nombreGimnasio" value={form.nombreGimnasio} onChange={handleChange} placeholder="Ej. Arboledas Fitness" required />
                </label>
                <div className="auth__row">
                  <label className="form__field">
                    <span className="form__label">Nombres</span>
                    <input className="form__input" name="nombres" value={form.nombres} onChange={handleChange} autoComplete="given-name" required />
                  </label>
                  <label className="form__field">
                    <span className="form__label">Apellidos</span>
                    <input className="form__input" name="apellidos" value={form.apellidos} onChange={handleChange} autoComplete="family-name" required />
                  </label>
                </div>
                <label className="form__field">
                  <span className="form__label">Teléfono (opcional)</span>
                  <input className="form__input" type="tel" name="telefono" value={form.telefono} onChange={handleChange} autoComplete="tel" />
                </label>
              </>
            )}

            <label className="form__field">
              <span className="form__label">Correo</span>
              <input className="form__input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="tu@correo.com" autoComplete="email" required />
            </label>

            {mode !== 'socio' && (
              <label className="form__field">
                <span className="form__label">Contraseña</span>
                <input
                  className="form__input"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  minLength={mode === 'signup' ? 6 : undefined}
                />
              </label>
            )}

            <button className="button button--primary auth__submit" type="submit" disabled={loading}>
              {loading ? 'Procesando...' : texts.submit}
            </button>
          </form>
        </div>

        <p className="auth__footer">© {YEAR} GymCRM · Gestión para gimnasios</p>
      </div>
    </div>
  )
}
