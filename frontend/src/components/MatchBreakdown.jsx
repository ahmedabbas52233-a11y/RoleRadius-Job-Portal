import { Check, X, Minus } from 'lucide-react'

const EXPERIENCE_FIT_COLOR = {
  'good fit':                 { bg: '#d1fae5', color: '#065f46' },
  'slightly under-qualified': { bg: '#fef3c7', color: '#92400e' },
  'slightly over-qualified':  { bg: '#fef3c7', color: '#92400e' },
  'under-qualified':          { bg: '#fee2e2', color: '#991b1b' },
  'over-qualified':           { bg: '#fee2e2', color: '#991b1b' },
  unknown:                    { bg: '#f3f4f6', color: '#6b7280' },
}

function CompatChip({ label, state }) {
  const cfg = state === true
    ? { bg: '#d1fae5', color: '#065f46', Icon: Check }
    : state === false
      ? { bg: '#fee2e2', color: '#991b1b', Icon: X }
      : { bg: '#f3f4f6', color: '#6b7280', Icon: Minus }
  return (
    <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>
      <cfg.Icon className="w-3 h-3" aria-hidden="true" />{label}
    </span>
  )
}

/**
 * Renders the "why this match" explanation produced by matching/engine.py
 * (compute_match_breakdown): which required skills were actually matched
 * vs missing, and whether location / experience level / salary line up —
 * instead of a bare, unexplained percentage.
 */
export default function MatchBreakdown({ breakdown }) {
  if (!breakdown) return null
  const fitColor = EXPERIENCE_FIT_COLOR[breakdown.experience_fit] || EXPERIENCE_FIT_COLOR.unknown
  const hasSkills = breakdown.matched_skills?.length > 0 || breakdown.missing_skills?.length > 0

  return (
    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Why this match:</p>
      {hasSkills && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {breakdown.matched_skills?.map((s) => (
            <span key={`m-${s}`} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium" style={{ background: '#d1fae5', color: '#065f46' }}>
              <Check className="w-2.5 h-2.5" aria-hidden="true" />{s}
            </span>
          ))}
          {breakdown.missing_skills?.map((s) => (
            <span key={`x-${s}`} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs" style={{ background: '#f3f4f6', color: '#9ca3af', textDecoration: 'line-through' }}>
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <CompatChip
          label={breakdown.location_compatible === true ? 'Location match' : breakdown.location_compatible === false ? 'Location mismatch' : 'Location unknown'}
          state={breakdown.location_compatible}
        />
        <span className="px-2 py-1 rounded-lg text-xs font-medium capitalize" style={{ background: fitColor.bg, color: fitColor.color }}>{breakdown.experience_fit}</span>
        <CompatChip
          label={breakdown.salary_compatible === true ? 'Salary in range' : breakdown.salary_compatible === false ? 'Salary mismatch' : 'Salary unknown'}
          state={breakdown.salary_compatible}
        />
      </div>
    </div>
  )
}
