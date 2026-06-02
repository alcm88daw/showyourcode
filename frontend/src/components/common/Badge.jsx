const variants = {
  active:   'bg-app-green/20 text-app-green border border-app-green/30',
  inactive: 'bg-gray-700/50 text-gray-400 border border-gray-600/30',
  easy:     'bg-green-500/20 text-green-400 border border-green-500/30',
  medium:   'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  hard:     'bg-red-500/20 text-red-400 border border-red-500/30',
  blue:     'bg-app-blue/20 text-app-blue border border-app-blue/30',
}

const DIFICULTAD = { 1: 'easy', 2: 'medium', 3: 'hard' }
const DIFICULTAD_LABEL = { 1: 'Fácil', 2: 'Media', 3: 'Difícil' }

export function DifficultyBadge({ level }) {
  return <Badge variant={DIFICULTAD[level] ?? 'easy'}>{DIFICULTAD_LABEL[level] ?? level}</Badge>
}

export default function Badge({ children, variant = 'active' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
