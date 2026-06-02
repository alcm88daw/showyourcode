export default function Input({ label, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <input
        className={`bg-app-bg border border-app-border rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-app-blue transition-colors w-full ${className}`}
        {...props}
      />
    </div>
  )
}

export function Textarea({ label, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <textarea
        className={`bg-app-bg border border-app-border rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-app-blue transition-colors w-full resize-none ${className}`}
        {...props}
      />
    </div>
  )
}

export function Select({ label, className = '', children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <select
        className={`bg-app-bg border border-app-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-app-blue transition-colors w-full ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
