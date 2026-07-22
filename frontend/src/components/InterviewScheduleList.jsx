import { CalendarClock, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

const OUTCOME_META = {
  pending: { color: '#6b7280', bg: '#f3f4f6', Icon: Clock },
  passed:  { color: '#065f46', bg: '#d1fae5', Icon: CheckCircle2 },
  failed:  { color: '#991b1b', bg: '#fee2e2', Icon: XCircle },
}

/**
 * Read-only interview schedule for a candidate's own application. Only
 * ever receives the candidate-facing serializer's fields (round_type,
 * scheduled_at, outcome) — feedback/score/interviewer_name are stripped
 * server-side before this ever sees them, so there's nothing to
 * accidentally leak here even if the prop shape changes upstream.
 */
export default function InterviewScheduleList({ rounds }) {
  if (!rounds?.length) return null
  return (
    <div>
      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
        <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" /> Interview schedule
      </p>
      <div className="space-y-1.5">
        {rounds.map((r) => {
          const meta = OUTCOME_META[r.outcome] || OUTCOME_META.pending
          return (
            <div key={r.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <div className="min-w-0">
                <p className="font-medium truncate" style={{ color: 'var(--text-1)' }}>
                  Round {r.round_number} — {r.round_type_display}
                </p>
                {r.scheduled_at && (
                  <p style={{ color: 'var(--text-3)' }}>{format(new Date(r.scheduled_at), 'PPp')}</p>
                )}
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold flex-shrink-0" style={{ background: meta.bg, color: meta.color }}>
                <meta.Icon className="w-3 h-3" aria-hidden="true" />{r.outcome_display}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
