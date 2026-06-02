import { useEffect, useState } from 'react'
import { getAlumnos, createAlumno, updateAlumno, deleteAlumno } from '../../services/usuarios'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Spinner from '../../components/common/Spinner'

const FORM_VACIO = { nombre: '', email: '', grupo: '' }

export default function GestionAlumnos() {
  const [alumnos, setAlumnos] = useState([])
  const [form, setForm] = useState(FORM_VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    getAlumnos().then((d) => setAlumnos(Array.isArray(d) ? d : [])).catch(() => setError('Error al cargar')).finally(() => setCargando(false))
  }, [])

  const abrirNuevo = () => { setForm(FORM_VACIO); setEditandoId(null); setMostrarForm(true); setError(''); setInfo('') }
  const abrirEdicion = (a) => { setForm({ nombre: a.nombre, email: a.email, grupo: a.grupo || '' }); setEditandoId(a.user_id); setMostrarForm(true); setError(''); setInfo('') }
  const cancelar = () => { setMostrarForm(false); setEditandoId(null); setForm(FORM_VACIO) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setGuardando(true); setError(''); setInfo('')
    try {
      if (editandoId) {
        await updateAlumno(editandoId, { nombre: form.nombre, grupo: form.grupo })
        setAlumnos((p) => p.map((a) => a.user_id === editandoId ? { ...a, ...form } : a))
        cancelar()
      } else {
        const nuevo = await createAlumno(form)
        if (nuevo.message) throw new Error(nuevo.message)
        setAlumnos((p) => [...p, nuevo])
        setInfo('Alumno creado. Entrégale las credenciales manualmente.')
        cancelar()
      }
    } catch (err) { setError(err.message || 'Error al guardar') }
    finally { setGuardando(false) }
  }

  const handleEliminar = async (alumno) => {
    if (!confirm(`¿Eliminar a ${alumno.nombre}?`)) return
    try { await deleteAlumno(alumno.user_id); setAlumnos((p) => p.filter((a) => a.user_id !== alumno.user_id)) }
    catch { setError('Error al eliminar') }
  }

  if (cargando) return <Spinner />

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Alumnos</h1>
          <p className="text-gray-400 text-sm mt-1">{alumnos.length} alumnos registrados</p>
        </div>
        <Button onClick={abrirNuevo}>+ Nuevo alumno</Button>
      </div>

      {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6">{error}</p>}
      {info && <p className="text-app-green text-sm bg-app-green/10 border border-app-green/20 rounded-lg px-4 py-3 mb-6">{info}</p>}

      {mostrarForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-base font-semibold text-white mb-5">{editandoId ? 'Editar alumno' : 'Nuevo alumno'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre completo *" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required placeholder="Nombre y apellidos" />
            <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required disabled={!!editandoId} placeholder="correo@ejemplo.com" className={editandoId ? 'opacity-50' : ''} />
            <Input label="Grupo" value={form.grupo} onChange={(e) => setForm((f) => ({ ...f, grupo: e.target.value }))} placeholder="1DAW, 2ASIR..." />
            {!editandoId && <p className="sm:col-span-2 text-xs text-gray-500">Se creará en Cognito con contraseña temporal. El alumno la cambiará en el primer acceso.</p>}
            <div className="sm:col-span-2 flex gap-3 pt-1">
              <Button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : editandoId ? 'Guardar' : 'Crear alumno'}</Button>
              <Button type="button" variant="ghost" onClick={cancelar}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {alumnos.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No hay alumnos. Crea el primero.</div>
      ) : (
        <Card>
          <table className="w-full">
            <thead>
              <tr className="border-b border-app-border">
                {['Nombre','Email','Grupo','Aciertos','Acciones'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...alumnos].sort((a, b) => (a.grupo||'').localeCompare(b.grupo||'') || a.nombre.localeCompare(b.nombre)).map((a) => (
                <tr key={a.user_id} className="border-b border-app-border/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white text-sm font-medium">{a.nombre}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{a.email}</td>
                  <td className="px-4 py-3">
                    {a.grupo ? <span className="text-xs bg-app-blue/20 text-app-blue px-2 py-0.5 rounded-full">{a.grupo}</span> : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{a.correctas_total ?? 0} / {a.intentos_total ?? 0} tests</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => abrirEdicion(a)}>Editar</Button>
                      <Button variant="danger" className="text-xs px-2 py-1" onClick={() => handleEliminar(a)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
