import { Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const STATUS_LABELS = {
  pending: 'Pending', reviewing: 'Under Review', shortlisted: 'Shortlisted',
  interview: 'Interview Scheduled', offered: 'Offer Extended', hired: 'Hired',
  offer_declined: 'Offer Declined', rejected: 'Rejected', withdrawn: 'Withdrawn',
}

/**
 * Renders Application.history (ApplicationStatusHistory rows) so both
 * candidates and recruiters can see exactly when/why a status changed,
 * instead of a status badge with no context.
 */
export default function StatusHistoryTimeline({ history }) {
  if (!history?.length) return null
  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>History:</p>
      <div className="space-y-2">
        {history.map((h) => (
          <div key={h.id} className="flex items-start gap-2 text-xs">
            <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-3)' }} aria-hidden="true" />
            <div>
              <span style={{ color: 'var(--text-2)' }}>
                {(STATUS_LABELS[h.from_status] || h.from_status)} → {(STATUS_LABELS[h.to_status] || h.to_status)}
              </span>
              <span style={{ color: 'var(--text-3)' }}> · {formatDistanceToNow(new Date(h.changed_at), { addSuffix: true })}</span>
              {h.note && <p style={{ color: 'var(--text-3)' }}>&quot;{h.note}&quot;</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
