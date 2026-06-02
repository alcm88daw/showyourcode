import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/profesor',            label: 'Inicio',          end: true  },
  { to: '/profesor/uts',        label: 'Unidades de Trabajo'          },
  { to: '/profesor/alumnos',    label: 'Alumnos'                      },
  { to: '/profesor/resultados', label: 'Resultados'                   },
]

export default function ProfesorLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-app-bg">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-app-surface border-r border-app-border flex flex-col">
        <div className="px-5 py-6 border-b border-app-border">
          <span className="text-lg font-bold bg-gradient-to-r from-app-blue to-purple-400 bg-clip-text text-transparent">
            TestsApp
          </span>
          <p className="text-xs text-gray-500 mt-1 truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5">
          {NAV.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-app-blue/15 text-app-blue font-medium'
                    : 'text-gray-400 hover:bg-app-border/60 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-app-border">
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 text-sm text-gray-500 hover:text-white hover:bg-app-border/60 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
