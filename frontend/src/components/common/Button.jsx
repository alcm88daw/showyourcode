const variants = {
  primary: 'bg-app-blue hover:bg-app-blue-dark text-white',
  secondary: 'bg-app-surface hover:bg-app-border text-white border border-app-border',
  danger: 'bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30',
  ghost: 'hover:bg-app-surface text-gray-400 hover:text-white',
  success: 'bg-app-green/20 hover:bg-app-green/30 text-app-green border border-app-green/30',
}

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
