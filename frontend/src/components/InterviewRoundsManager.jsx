import { useState } from 'react'
import { applicationsAPI } from '../services/api'
import { CalendarClock, Plus, Trash2, Star } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const ROUND_TYPES = [
  { value: 'screen', label: 'Phone/Video Screen' },
  { value: 'technical', label: 'Technical Interview' },
  { value: 'onsite', label: 'Onsite' },
  { value: 'final', label: 'Final Round' },
  { value: 'other', label: 'Other' },
]

const OUTCOME_META = {
  pending: { color: '#6b7280', bg: '#f3f4f6', label: 'Pending' },
  passed:  { color: '#065f46', bg: '#d1fae5', label: 'Passed' },
  failed:  { color: '#991b1b', bg: '#fee2e2', label: 'Failed' },
}

function RoundRow({ applicationId, round, onUpdated, onDeleted }) {
  const [editingFeedback, setEditingFeedback] = useState(false)
  const [feedback, setFeedback] = useState(round.feedback || '')
  const [score, setScore] = useState(round.score || 0)
  const [saving, setSaving] = useState(false)

  const setOutcome = async (outcome) => {
    setSaving(true)
    try {
      const { data } = await applicationsAPI.updateInterviewRound(applicationId, round.id, { outcome })
      onUpdated(data)
    } catch { toast.error('Could not update outcome') }
    finally { setSaving(false) }
  }

  const saveFeedback = async () => {
    setSaving(true)
    try {
      const { data } = await applicationsAPI.updateInterviewRound(applicationId, round.id, {
        feedback, score: score || null,
      })
      onUpdated(data)
      setEditingFeedback(false)
      toast.success('Feedback saved')
    } catch { toast.error('Could not save feedback') }
    finally { setSaving(false) }
  }

  const deleteRound = async () => {
    try {
      await applicationsAPI.deleteInterviewRound(applicationId, round.id)
      onDeleted(round.id)
    } catch { toast.error('Could not delete round') }
  }

  const meta = OUTCOME_META[round.outcome] || OUTCOME_META.pending

  return (
    <div className="p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>
            Round {round.round_number} — {round.round_type_display}
          </p>
          {round.interviewer_name && <p className="text-xs" style={{ color: 'var(--text-3)' }}>with {round.interviewer_name}</p>}
          {round.scheduled_at && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{format(new Date(round.scheduled_at), 'PPp')}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
          <button onClick={deleteRound} className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50" aria-label="Delete round">
            <Trash2 className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-2">
        {['pending', 'passed', 'failed'].map((o) => (
          <button key={o} onClick={() => setOutcome(o)} disabled={saving}
            className="text-xs px-2 py-1 rounded-lg font-semibold disabled:opacity-50"
            style={round.outcome === o ? { background: OUTCOME_META[o].bg, color: OUTCOME_META[o].color } : { background: 'var(--surface)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
            {OUTCOME_META[o].label}
          </button>
        ))}
        <button onClick={() => setEditingFeedback(!editingFeedback)} className="text-xs px-2 py-1 rounded-lg font-semibold ml-auto" style={{ color: 'var(--primary)' }}>
          {round.feedback || round.score ? 'Edit feedback' : '+ Feedback'}
        </button>
      </div>

      {editingFeedback && (
        <div className="mt-2 animate-fade-up">
          <div className="flex items-center gap-1 mb-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setScore(n)} aria-label={`Rate ${n} out of 5`}>
                <Star className="w-4 h-4" fill={n <= score ? '#f59e0b' : 'none'} style={{ color: n <= score ? '#f59e0b' : 'var(--text-3)' }} aria-hidden="true" />
              </button>
            ))}
          </div>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} className="input text-xs h-16 resize-none" placeholder="Private interviewer feedback…" />
          <button onClick={saveFeedback} disabled={saving} className="btn-secondary text-xs px-3 py-1.5 mt-1.5">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {!editingFeedback && round.feedback && (
        <p className="text-xs mt-2 italic" style={{ color: 'var(--text-3)' }}>&quot;{round.feedback}&quot;</p>
      )}
    </div>
  )
}

/**
 * Recruiter-facing interview round manager. Full CRUD: add a round, set
 * outcome, leave private scorecard feedback, delete a round. This is the
 * "real" structured-interview feature — Application.interview_date (the
 * single datetime field) still exists for the simple one-shot flow, this
 * is the richer opt-in layer on top of it.
 */
export default function InterviewRoundsManager({ applicationId, rounds: initialRounds }) {
  const [rounds, setRounds] = useState(initialRounds || [])
  const [showAdd, setShowAdd] = useState(false)
  const [newType, setNewType] = useState('screen')
  const [newInterviewer, setNewInterviewer] = useState('')
  const [newDate, setNewDate] = useState('')
  const [creating, setCreating] = useState(false)

  const addRound = async () => {
    setCreating(true)
    try {
      const { data } = await applicationsAPI.createInterviewRound(applicationId, {
        round_type: newType,
        interviewer_name: newInterviewer,
        ...(newDate ? { scheduled_at: newDate } : {}),
      })
      setRounds((prev) => [...prev, data])
      setShowAdd(false)
      setNewInterviewer(''); setNewDate(''); setNewType('screen')
      toast.success('Round added')
    } catch {
      toast.error('Could not add round')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdated = (updated) => setRounds((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
  const handleDeleted = (id) => setRounds((prev) => prev.filter((r) => r.id !== id))

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
          <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" /> Interview rounds
        </p>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
          <Plus className="w-3 h-3" aria-hidden="true" /> Add round
        </button>
      </div>

      {showAdd && (
        <div className="p-2.5 rounded-lg mb-2 animate-fade-up" style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)' }}>
          <select value={newType} onChange={(e) => setNewType(e.target.value)} className="input text-xs mb-1.5">
            {ROUND_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input value={newInterviewer} onChange={(e) => setNewInterviewer(e.target.value)} className="input text-xs mb-1.5" placeholder="Interviewer name (optional)" />
          <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="input text-xs mb-1.5" />
          <div className="flex gap-1.5">
            <button onClick={addRound} disabled={creating} className="btn-primary text-xs px-3 py-1.5">
              {creating ? 'Adding…' : 'Add'}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {rounds.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>No structured rounds yet.</p>
      ) : (
        <div className="space-y-2">
          {rounds.map((r) => (
            <RoundRow key={r.id} applicationId={applicationId} round={r} onUpdated={handleUpdated} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  )
}
