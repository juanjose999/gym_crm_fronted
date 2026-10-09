import { useState } from 'react'
import { getSession, clearSession } from './api.js'
import Icon from './components/Icon.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Socios from './pages/Socios.jsx'
import Planes from './pages/Planes.jsx'
import Productos from './pages/Productos.jsx'
import Membresias from './pages/Membresias.jsx'
import Ordenes from './pages/Ordenes.jsx'
import Asistencias from './pages/Asistencias.jsx'
import MiCuenta from './pages/MiCuenta.jsx'

// Secciones del menú del administrador
const ADMIN_PAGES = {
  dashboard: { label: 'Resumen', icon: 'resumen', component: Dashboard },
  socios: { label: 'Socios', icon: 'socios', component: Socios },
  planes: { label: 'Planes', icon: 'planes', component: Planes },
  membresias: { label: 'Membresías', icon: 'membresias', component: Membresias },
  asistencias: { label: 'Asistencias', icon: 'asistencias', component: Asistencias },

  productos: { label: 'Productos', icon: 'productos', component: Productos },
  pedidos: { label: 'Pedidos', icon: 'ordenes', component: Ordenes },
}

function iniciales(user) {
  return ((user.nombres?.trim()[0] ?? '') + (user.apellidos?.trim()[0] ?? '')).toUpperCase()
}

export default function App() {
  const [session, setSession] = useState(getSession())
  const [page, setPage] = useState('dashboard')

  function login(data) {
    setSession(data)
    setPage('dashboard')
  }

  function logout() {
    clearSession()
    setSession(null)
  }

  if (!session) {
    return <Login onLogin={login} />
  }

  const isAdmin = session.user.rol === 'ADMIN'
  const CurrentPage = isAdmin ? ADMIN_PAGES[page].component : MiCuenta

  return (
    <div className="layout">
      <header className="header">
        <div className="header__brand">
          <span className="header__logo"><Icon name="logo" size={18} /></span>
          Gym<span className="header__accent">CRM</span>
          <span className="header__gym">{session.gimnasio.nombre}</span>
        </div>

        <div className="header__user">
          <span className="header__avatar">{iniciales(session.user)}</span>
          <div className="header__user-info">
            <strong>{session.user.nombres} ({session.user.rol})</strong>
            <small>{isAdmin ? 'Administrador' : 'Socio'}</small>
          </div>
          <button className="header__logout" onClick={logout} title="Salir">
            <Icon name="salir" size={16} />
          </button>
        </div>
      </header>

      <div className="layout__body">
        {isAdmin && (
          <aside className="sidebar">
            <p className="sidebar__section">Workspace</p>
            <nav className="sidebar__nav">
              {Object.entries(ADMIN_PAGES).map(([key, item]) => (
                <button
                  key={key}
                  className={'sidebar__item' + (page === key ? ' sidebar__item--active' : '')}
                  onClick={() => setPage(key)}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon name={item.icon} size={17} />
                  <span className="sidebar__label">{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        )}

        <main className={'layout__content' + (isAdmin ? ' layout__content--with-nav' : '')}>
          <CurrentPage onNavigate={setPage} />
        </main>
      </div>
    </div>
  )
}
