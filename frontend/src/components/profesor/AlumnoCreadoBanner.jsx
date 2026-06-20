import { useState } from 'react'

export default function AlumnoCreadoBanner({ email, tempPassword, onClose }) {
  const [copiada, setCopiada] = useState(false)

  const copiar = () => {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopiada(true)
      setTimeout(() => setCopiada(false), 2000)
    })
  }

  return (
    <div className="border border-l-4 border-app-green/40 border-l-app-green rounded-xl bg-app-green/5 p-5 flex flex-col gap-3 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="text-app-green" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M7 13l3 3 7-7" />
          </svg>
          <span className="text-app-green font-medium text-sm">Alumno creado</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">×</button>
      </div>

      <p className="text-app-green/70 text-sm m-0">
        Comparte esta contraseña temporal con <span className="font-medium text-app-green/90">{email}</span>:
      </p>

      <div className="flex items-center gap-3">
        <code className="flex-1 bg-app-bg text-app-green px-4 py-2 rounded-lg text-base font-mono tracking-widest border border-app-green/20">
          {tempPassword}
        </code>
        <button
          onClick={copiar}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm whitespace-nowrap transition-colors ${
            copiada
              ? 'border-app-green/40 bg-app-green/10 text-app-green'
              : 'border-app-green/20 bg-app-green/5 text-app-green/70 hover:bg-app-green/10'
          }`}
        >
          {copiada ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Copiada
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copiar contraseña
            </>
          )}
        </button>
      </div>

      <p className="text-app-green/50 text-xs m-0">
        ⚠️ Una vez cierres este aviso, no podrás recuperarla.
      </p>
    </div>
  )
}
