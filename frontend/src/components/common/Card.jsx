export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-app-surface border border-app-border rounded-xl ${className}`}>
      {children}
    </div>
  )
}
