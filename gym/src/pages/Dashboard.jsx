import { useEffect, useState } from 'react'
import { api, getSession, saveSession, formatMoney, formatDateTime } from '../api.js'
import Icon from '../components/Icon.jsx'
import EstadoBadge from '../components/EstadoBadge.jsx'

// Resumen del gimnasio: GET /dashboard cada vez que se abre.
// Mientras llega, se muestra el último guardado en sesión (login / signup).
const METRICAS = [
  { key: 'ingresosDelMes', label: 'Ingresos del mes', icon: 'dinero' },
  { key: 'sociosActivos', label: 'Socios activos', icon: 'socios' },
  { key: 'ventasHoy', label: 'Ventas hoy', icon: 'ordenes' },
  { key: 'membresiasVigentes', label: 'Membresías vigentes', icon: 'membresias' },
]

function saludo(ahora) {
  const hora = ahora.getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function capitalizar(texto = '') {
  const palabra = texto.trim().split(' ')[0] ?? ''
  return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
}

// Verde si sube, rojo si baja, gris si no cambia
function tendencia(cambio = '') {
  if (cambio.startsWith('-')) return 'dashboard__trend--down'
  if (cambio.startsWith('+') && cambio !== '+0%') return 'dashboard__trend--up'
  return ''
}

export default function Dashboard({ onNavigate }) {
  const session = getSession()
  const [data, setData] = useState(session?.dashboardResponse)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/dashboard')
      .then((res) => {
        const dashboard = res?.dashboardResponse ?? res
        setData(dashboard)
        setError('')
        saveSession({ ...getSession(), dashboardResponse: dashboard })
      })
      .catch((err) => setError(err.message))
  }, [])

  const [ahora] = useState(() => new Date())
  const hoy = ahora.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })

  const header = (
    <div className="dashboard__header">
      <div>
        <p className="dashboard__breadcrumb">
          Workspace <span>›</span> <strong>Resumen</strong>
        </p>
        <h2 className="dashboard__title">{saludo(ahora)}, {capitalizar(session?.user.nombres)}</h2>
        <p className="dashboard__subtitle">Aquí tienes el pulso de tu gimnasio hoy.</p>
      </div>
      <div className="dashboard__actions">
        <span className="dashboard__date">Hoy, {hoy}</span>
        <button className="button button--primary dashboard__cta" onClick={() => onNavigate('pedidos')}>
          <Icon name="mas" size={16} /> Nueva venta
        </button>
      </div>
    </div>
  )

  if (!data) {
    return (
      <section className="page dashboard">
        {header}
        {error && <p className="alert alert--error">{error}</p>}
        <p className="page__empty">{error ? 'No hay indicadores disponibles.' : 'Cargando indicadores...'}</p>
      </section>
    )
  }

  const { metricasSuperiores, rendimientoIngresosYVentas, membresiasActivasDistribucion, tablaMembresias, ultimasOrdenes } = data

  const dias = rendimientoIngresosYVentas?.graficoDias ?? []
  const maxIngreso = Math.max(...dias.map((d) => Number(d.ingresos) || 0), 0)

  const planes = membresiasActivasDistribucion?.planes ?? []
  const totalSocios = planes.reduce((sum, p) => sum + p.cantidadSocios, 0)

  return (
    <section className="page dashboard">
      {header}
      {error && <p className="alert alert--error">{error}</p>}

      {/* ---------- métricas superiores ---------- */}
      <div className="dashboard__metrics">
        {METRICAS.map(({ key, label, icon }) => {
          const m = metricasSuperiores?.[key]
          if (!m) return null
          return (
            <div key={key} className="card metric">
              <div className="metric__top">
                <span className="metric__label">{label}</span>
                <span className="metric__icon"><Icon name={icon} size={16} /></span>
              </div>
              <p className="metric__value">{m.valor}</p>
              <div className="metric__footer">
                <span className={'dashboard__trend ' + tendencia(m.cambioPorcentaje)}>{m.cambioPorcentaje}</span>
                <span className="metric__detail">{m.comparativa ?? m.detalle}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="dashboard__grid">
        {/* ---------- gráfico de ingresos ---------- */}
        <div className="card">
          <div className="dashboard__card-head">
            <div>
              <h3 className="dashboard__card-title">Ingresos y ventas</h3>
              <p className="dashboard__card-subtitle">Rendimiento de los {rendimientoIngresosYVentas?.periodo?.toLowerCase()}</p>
            </div>
            <span className="dashboard__pill">{rendimientoIngresosYVentas?.periodo}</span>
          </div>

          <div className="chart">
            {dias.map((d) => {
              const ingresos = Number(d.ingresos) || 0
              const alto = maxIngreso ? Math.max((ingresos / maxIngreso) * 100, 4) : 4
              return (
                <div key={d.dia} className={'chart__col' + (d.activo ? ' chart__col--active' : '')}>
                  <div className="chart__track" title={formatMoney(ingresos)}>
                    <div className="chart__bar" style={{ height: alto + '%' }} />
                  </div>
                  <span className="chart__label">{d.dia}</span>
                </div>
              )
            })}
          </div>

          <div className="chart__legend">
            <span className="chart__dot" /> Ingresos
            <span className="chart__total-label">Total semana</span>
            <strong>{rendimientoIngresosYVentas?.totalSemana}</strong>
          </div>
        </div>

        {/* ---------- distribución por plan ---------- */}
        <div className="card">
          <div className="dashboard__card-head">
            <div>
              <h3 className="dashboard__card-title">Membresías activas</h3>
              <p className="dashboard__card-subtitle">Distribución actual por plan</p>
            </div>
            <span className="metric__icon"><Icon name="membresias" size={16} /></span>
          </div>

          <ul className="distribution">
            {planes.map((p) => (
              <li key={p.nombre} className="distribution__item">
                <div className="distribution__row">
                  <span className="distribution__name">{p.nombre}</span>
                  <span className="distribution__count">{p.cantidadSocios} socios</span>
                </div>
                <div className="distribution__track">
                  <div className="distribution__bar" style={{ width: (totalSocios ? (p.cantidadSocios / totalSocios) * 100 : 0) + '%' }} />
                </div>
              </li>
            ))}
          </ul>
          {planes.length === 0 && <p className="page__empty">Sin planes activos.</p>}

          <button className="dashboard__link" onClick={() => onNavigate('membresias')}>
            Gestionar membresías <Icon name="flecha" size={12} />
          </button>
        </div>
      </div>

      {/* ---------- tabla de membresías ---------- */}
      <div className="card">
        <div className="dashboard__card-head">
          <div>
            <h3 className="dashboard__card-title">Membresías</h3>
            <p className="dashboard__card-subtitle">Planes activos y próximos vencimientos</p>
          </div>
          <button className="button button--small" onClick={() => onNavigate('membresias')}>Ver todas</button>
        </div>

        <table className="dashboard__table">
          <thead>
            <tr>
              <th>Membresía</th>
              <th>Socio</th>
              <th>Precio</th>
              <th>Estado</th>
              <th className="dashboard__table-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {(tablaMembresias ?? []).map((m, i) => (
              <tr key={i}>
                <td><strong>{m.membresia}</strong></td>
                <td>{m.socios}</td>
                <td><strong>{m.precio}</strong></td>
                <td><EstadoBadge estado={m.estado} /></td>
                <td className="dashboard__table-right">
                  <button className="dashboard__link" onClick={() => onNavigate('membresias')}>Administrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tablaMembresias?.length && <p className="page__empty">No hay membresías registradas.</p>}
      </div>

      {/* ---------- últimas órdenes ---------- */}
      <div className="card">
        <div className="dashboard__card-head">
          <div>
            <h3 className="dashboard__card-title">Últimas órdenes</h3>
            <p className="dashboard__card-subtitle">Gestiona las ventas más recientes</p>
          </div>
          <button className="button button--small" onClick={() => onNavigate('pedidos')}>Ver todas</button>
        </div>

        <table className="dashboard__table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Socio</th>
              <th>Producto</th>
              <th>Monto</th>
              <th className="dashboard__table-right">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {(ultimasOrdenes ?? []).map((o, i) => (
              <tr key={o.id ?? i}>
                <td className="dashboard__accent">#{o.orden ?? o.id}</td>
                <td>{o.socio ?? '-'}</td>
                <td>{o.producto ?? '-'}</td>
                <td><strong>{typeof o.monto === 'number' ? formatMoney(o.monto) : o.monto ?? o.total}</strong></td>
                <td className="dashboard__table-right dashboard__muted">{o.fecha ? formatDateTime(o.fecha) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!ultimasOrdenes?.length && <p className="page__empty">Aún no hay órdenes.</p>}
      </div>
    </section>
  )
}
