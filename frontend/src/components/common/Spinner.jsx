export default function Spinner({ text = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-gray-400">
      <div className="w-8 h-8 border-2 border-app-border border-t-app-blue rounded-full animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  )
}
