export const PARTY_COLORS = {
  PPSO: { bg: '#003d5c', border: '#0ea5e9', badge: '#38bdf8', label: 'Pueblo Soberano' },
  PLN: { bg: '#0f3d1f', border: '#16a34a', badge: '#22c55e', label: 'Liberación Nacional' },
  FA: { bg: '#3d3000', border: '#ca8a04', badge: '#eab308', label: 'Frente Amplio' },
  PUSC: { bg: '#1e2a5c', border: '#1d4ed8', badge: '#3b82f6', label: 'Unidad Social Cristiana' },
  CAC: { bg: '#3d0f0f', border: '#b91c1c', badge: '#ef4444', label: 'Coalición Agenda Ciudadana' },
}

export const PROVINCES = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón']

export const PARTY_COLOR_FALLBACK = { bg: '#1e1e2e', border: '#6b7280', badge: '#9ca3af', label: 'Otro' }

export function getPartyColor(partido) {
  return PARTY_COLORS[partido] || PARTY_COLOR_FALLBACK
}
