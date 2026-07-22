import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { applicationsAPI, jobsAPI } from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'
import MatchBreakdown from '../components/MatchBreakdown'
import StatusHistoryTimeline from '../components/StatusHistoryTimeline'
import InterviewRoundsManager from '../components/InterviewRoundsManager'
import {
  Briefcase, Users, Star, Award, PlusCircle, Eye, EyeOff, Trash2, Pencil, Zap,
  ChevronRight, Building2, FileText, ExternalLink, CheckSquare, Square,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_META = {
  pending:        { bg: '#f3f4f6', color: '#374151', label: 'Pending' },
  reviewing:      { bg: '#dbeafe', color: '#1e40af', label: 'Reviewing' },
  shortlisted:    { bg: '#ede9fe', color: '#6d28d9', label: 'Shortlisted' },
  interview:      { bg: '#ffedd5', color: '#c2410c', label: 'Interview' },
  offered:        { bg: '#d1fae5', color: '#065f46', label: 'Offered 🎉' },
  hired:          { bg: '#bbf7d0', color: '#166534', label: 'Hired ✅' },
  offer_declined: { bg: '#fef3c7', color: '#92400e', label: 'Offer Declined' },
  rejected:       { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
  withdrawn:      { bg: '#f3f4f6', color: '#4b5563', label: 'Withdrawn' },
}

// Mirrors Application.VALID_TRANSITIONS on the backend (which is the source
// of truth and re-validates regardless). Kept in sync here purely so the UI
// only ever shows buttons that will actually succeed.
const ACTIVE_FORWARD = ['reviewing', 'shortlisted', 'interview', 'offered', 'rejected']
const TRANSITIONS = {
  pending: ACTIVE_FORWARD,
  reviewing: ACTIVE_FORWARD,
  shortlisted: ACTIVE_FORWARD,
  interview: ACTIVE_FORWARD,
  offered: ['hired', 'offer_declined', 'rejected'],
  hired: [],
  offer_declined: [],
  rejected: [],
  withdrawn: [],
}

function ApplicantCard({ app, onUpdate, selected, onToggleSelect }) {
  const [open, setOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [pendingMove, setPendingMove] = useState(null) // 'rejected' | 'interview' | null
  const [reasonText, setReasonText] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [notes, setNotes] = useState(app.recruiter_notes || '')
  const [savingNotes, setSavingNotes] = useState(false)

  const meta = STATUS_META[app.status] || STATUS_META.pending
  const availableMoves = TRANSITIONS[app.status] || []

  const applyMove = async (status, extra = {}) => {
    setUpdating(true)
    try {
      const { data } = await applicationsAPI.updateStatus(app.id, { status, ...extra })
      onUpdate(app.id, data)
      toast.success(`Moved to ${STATUS_META[status]?.label || status}`)
      setPendingMove(null); setReasonText(''); setInterviewDate('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not update')
    } finally {
      setUpdating(false)
    }
  }

  const handleMoveClick = (status) => {
    if (status === 'rejected') { setPendingMove('rejected'); return }
    if (status === 'interview') { setPendingMove('interview'); return }
    applyMove(status)
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      const { data } = await applicationsAPI.updateStatus(app.id, { recruiter_notes: notes })
      onUpdate(app.id, data)
      toast.success('Notes saved')
    } catch { toast.error('Could not save notes') }
    finally { setSavingNotes(false) }
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button onClick={() => onToggleSelect(app.id)} className="mt-1 flex-shrink-0" aria-label={selected ? 'Deselect applicant' : 'Select applicant'}>
            {selected ? <CheckSquare className="w-4 h-4" style={{ color: 'var(--primary)' }} aria-hidden="true" /> : <Square className="w-4 h-4" style={{ color: 'var(--text-3)' }} aria-hidden="true" />}
          </button>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
            {app.candidate?.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link to={`/recruiter/candidates/${app.candidate?.id}`} className="font-semibold text-sm truncate hover:underline block" style={{ color: 'var(--text-1)' }}>
              {app.candidate?.full_name}
            </Link>
            <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{app.candidate_profile?.headline || 'No headline'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="badge text-xs" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
          {app.match_score != null && (
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Zap className="w-3 h-3" aria-hidden="true" />{Math.round(app.match_score)}%
            </span>
          )}
        </div>
      </div>

      {app.candidate_profile?.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {app.candidate_profile.skills.slice(0, 4).map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>{s}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>{formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}</span>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: 'var(--primary)' }} aria-expanded={open}>
          Details <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t animate-fade-up" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap gap-2 mb-3">
            <Link to={`/recruiter/candidates/${app.candidate?.id}`} className="btn-secondary text-xs px-3 py-1.5">
              View full profile <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </Link>
            {app.cv_download_url && (
              <a href={app.cv_download_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs px-3 py-1.5">
                <FileText className="w-3 h-3" aria-hidden="true" /> View CV
              </a>
            )}
          </div>

          <div className="mt-3"><MatchBreakdown breakdown={app.match_breakdown} /></div>

          {app.cover_letter && (
            <div className="mt-3">
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Cover letter:</p>
              <p className="text-xs rounded-xl p-3" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>{app.cover_letter}</p>
            </div>
          )}

          <div className="mt-3">
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Recruiter notes (private):</p>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input text-xs h-16 resize-none" placeholder="Notes only you and your team can see…" />
            {notes !== (app.recruiter_notes || '') && (
              <button onClick={saveNotes} disabled={savingNotes} className="btn-secondary text-xs px-3 py-1.5 mt-1.5">
                {savingNotes ? 'Saving…' : 'Save notes'}
              </button>
            )}
          </div>

          {availableMoves.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Move to:</p>
              <div className="flex flex-wrap gap-1.5">
                {availableMoves.map((s) => {
                  const m = STATUS_META[s]
                  return (
                    <button key={s} onClick={() => handleMoveClick(s)} disabled={updating} className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-50" style={{ background: m.bg, color: m.color }}>
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {pendingMove === 'rejected' && (
            <div className="mt-3 p-3 rounded-xl animate-fade-up" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#991b1b' }}>Reason for rejection (optional, kept private):</label>
              <textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} className="input text-xs h-16 resize-none" placeholder="e.g. Not enough backend experience for this role" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => applyMove('rejected', { rejection_reason: reasonText })} disabled={updating} className="btn-danger text-xs px-3 py-1.5">Confirm Reject</button>
                <button onClick={() => { setPendingMove(null); setReasonText('') }} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
              </div>
            </div>
          )}

          {pendingMove === 'interview' && (
            <div className="mt-3 p-3 rounded-xl animate-fade-up" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <label className="text-xs font-semibold mb-1 block" style={{ color: '#c2410c' }}>Interview date &amp; time:</label>
              <input type="datetime-local" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="input text-xs" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => applyMove('interview', interviewDate ? { interview_date: interviewDate } : {})} disabled={updating} className="btn-primary text-xs px-3 py-1.5">Confirm Interview</button>
                <button onClick={() => { setPendingMove(null); setInterviewDate('') }} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
              </div>
            </div>
          )}

          {app.interview_date && app.status === 'interview' && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
              Scheduled for {format(new Date(app.interview_date), 'PPp')}
            </p>
          )}

          <div className="mt-3">
            <InterviewRoundsManager applicationId={app.id} rounds={app.interview_rounds} />
          </div>

          <div className="mt-3"><StatusHistoryTimeline history={app.history} /></div>
        </div>
      )}
    </div>
  )
}

function JobRow({ job, isSelected, onSelect, onToggle, onDelete }) {
  const [toggling, setToggling] = useState(false)
  const [active, setActive]     = useState(job.is_active)
  const [delConfirm, setDelConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const toggle = async e => {
    e.stopPropagation(); setToggling(true)
    try {
      const { data } = await jobsAPI.toggleActive(job.id)
      setActive(data.is_active)
      toast.success(data.is_active ? 'Job activated' : 'Job paused')
      onToggle?.(job.id, data.is_active)
    } catch { toast.error('Failed') }
    finally { setToggling(false) }
  }

  const doDelete = async () => {
    setDeleting(true)
    try { await jobsAPI.delete(job.id); toast.success('Job deleted'); onDelete?.(job.id) }
    catch { toast.error('Could not delete') }
    finally { setDeleting(false); setDelConfirm(false) }
  }

  return (
    <>
      <div onClick={onSelect} className={`card p-4 cursor-pointer transition-all ${isSelected?'ring-2':''} ${!active?'opacity-60':''}`}
        style={isSelected?{'--tw-ring-color':'var(--primary)',borderColor:'var(--primary)'}:{}}
        role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')onSelect()}}
        aria-selected={isSelected} aria-label={`Select ${job.title}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate" style={{color:'var(--text-1)'}}>{job.title}</p>
            <div className="flex items-center gap-3 mt-1 text-xs" style={{color:'var(--text-3)'}}>
              <span>{job.application_count||0} applicants</span>
              <span>{job.views_count||0} views</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link to={`/recruiter/jobs/${job.id}/edit`} onClick={e=>e.stopPropagation()} className="p-1.5 rounded-lg transition-colors" style={{color:'var(--text-3)'}} aria-label={`Edit ${job.title}`}>
              <Pencil className="w-3.5 h-3.5" aria-hidden="true"/>
            </Link>
            <button onClick={toggle} disabled={toggling}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-semibold transition-all disabled:opacity-50"
              style={active?{background:'#d1fae5',color:'#065f46'}:{background:'#f3f4f6',color:'#6b7280'}}
              aria-label={active?'Pause job':'Activate job'}>
              {active ? <Eye className="w-3 h-3" aria-hidden="true"/> : <EyeOff className="w-3 h-3" aria-hidden="true"/>}
              {active ? 'Live' : 'Paused'}
            </button>
            <button onClick={e=>{e.stopPropagation();setDelConfirm(true)}} className="p-1.5 rounded-lg transition-colors text-red-400 hover:text-red-600 hover:bg-red-50" aria-label={`Delete ${job.title}`}>
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true"/>
            </button>
          </div>
        </div>
      </div>
      <ConfirmDialog open={delConfirm} title="Delete this job?"
        message={`"${job.title}" will be removed. Applications already submitted are preserved.`}
        confirmLabel="Delete Job" danger loading={deleting} onConfirm={doDelete} onCancel={()=>setDelConfirm(false)} />
    </>
  )
}

function BulkActionBar({ count, onMove, onClear, acting }) {
  const moveOptions = ['reviewing', 'shortlisted', 'interview', 'offered', 'rejected']
  return (
    <div className="card p-3 mb-3 flex items-center justify-between gap-3 flex-wrap animate-fade-up" style={{ borderColor: 'var(--primary)' }}>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{count} selected</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {moveOptions.map((s) => {
          const m = STATUS_META[s]
          return (
            <button key={s} onClick={() => onMove(s)} disabled={acting} className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-50" style={{ background: m.bg, color: m.color }}>
              Move to {m.label}
            </button>
          )
        })}
        <button onClick={onClear} className="btn-ghost text-xs px-2 py-1.5">Clear</button>
      </div>
    </div>
  )
}

export default function RecruiterDashboard() {
  const { profile } = useAuth()
  const [stats, setStats]               = useState(null)
  const [jobs, setJobs]                 = useState([])
  const [selectedJob, setSelectedJob]   = useState(null)
  const [applications, setApplications] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loadingApps, setLoadingApps]   = useState(false)
  const [loading, setLoading]           = useState(true)
  const [selectedIds, setSelectedIds]   = useState(new Set())
  const [bulkActing, setBulkActing]     = useState(false)

  useEffect(()=>{
    Promise.allSettled([applicationsAPI.recruiterStats(), jobsAPI.myJobs()])
      .then(([s,j])=>{
        if (s.status==='fulfilled') setStats(s.value.data)
        if (j.status==='fulfilled') {
          const list = j.value.data.results||[]
          setJobs(list)
          if (list.length>0) setSelectedJob(list[0])
        }
      }).finally(()=>setLoading(false))
  },[])

  useEffect(()=>{
    if (!selectedJob) return
    setLoadingApps(true)
    setSelectedIds(new Set())
    applicationsAPI.jobApplications(selectedJob.id, statusFilter?{status:statusFilter}:{})
      .then(({data})=>setApplications(data.results||[]))
      .catch(()=>setApplications([]))
      .finally(()=>setLoadingApps(false))
  },[selectedJob,statusFilter])

  const handleAppUpdate = (id,updated) => setApplications(prev=>prev.map(a=>a.id===id?updated:a))
  const handleJobDelete = id => {
    setJobs(prev=>{ const n=prev.filter(j=>j.id!==id); if(selectedJob?.id===id)setSelectedJob(n[0]||null); return n })
  }

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkMove = async (status) => {
    setBulkActing(true)
    try {
      const ids = Array.from(selectedIds)
      const { data } = await applicationsAPI.bulkUpdateStatus(ids, status)
      const updatedSet = new Set(data.updated || [])
      setApplications(prev => prev.map(a => updatedSet.has(a.id) ? { ...a, status } : a))
      if (data.skipped?.length) {
        toast.error(`${data.updated.length} moved, ${data.skipped.length} couldn't transition from their current status`)
      } else {
        toast.success(`${data.updated.length} application(s) moved to ${STATUS_META[status]?.label || status}`)
      }
      clearSelection()
    } catch {
      toast.error('Bulk update failed')
    } finally {
      setBulkActing(false)
    }
  }

  const visibleSelectedCount = useMemo(
    () => applications.filter(a => selectedIds.has(a.id)).length,
    [applications, selectedIds]
  )

  const STATS = [
    {label:'Active Jobs',  v:stats?.active_jobs??'—',                      color:'#6366f1',bg:'#eef2ff', Icon:Briefcase},
    {label:'Applications', v:stats?.total_applications??'—',                color:'#7c3aed',bg:'#ede9fe', Icon:Users},
    {label:'Shortlisted',  v:stats?.status_breakdown?.shortlisted??'—',    color:'#d97706',bg:'#fef3c7', Icon:Star},
    {label:'Offers',       v:stats?.status_breakdown?.offered??'—',        color:'#059669',bg:'#d1fae5', Icon:Award},
  ]

  return (
    <div style={{background:'var(--surface-2)',minHeight:'100vh'}}>
      <div style={{background:'linear-gradient(135deg,#1e1b4b,#4c1d95)',padding:'32px 0 80px'}}>
        <div className="page-container">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background:'rgba(255,255,255,.15)'}}>
                <Building2 className="w-6 h-6 text-white" aria-hidden="true"/>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{color:'rgba(165,180,252,.8)'}}>{profile?.company_name||'Company'}</p>
                <h1 className="font-extrabold text-white" style={{fontSize:'clamp(1.25rem,3vw,1.75rem)',letterSpacing:'-.02em'}}>Recruiter Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link to="/recruiter/talent" className="btn-secondary text-sm" style={{background:'rgba(255,255,255,.1)',color:'white',borderColor:'rgba(255,255,255,.25)'}}>
                <Users className="w-4 h-4" aria-hidden="true"/> Find Talent
              </Link>
              <Link to="/recruiter/post-job" className="btn-primary text-sm" style={{background:'rgba(255,255,255,.15)',boxShadow:'none'}}>
                <PlusCircle className="w-4 h-4" aria-hidden="true"/> Post a Job
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {STATS.map(({label,v,color,bg,Icon})=>(
              <div key={label} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:bg}}>
                    <Icon className="w-3.5 h-3.5" style={{color}} aria-hidden="true"/>
                  </div>
                </div>
                <p className="text-2xl font-extrabold" style={{color}}>{v}</p>
                <p className="text-xs font-semibold mt-0.5" style={{color:'var(--text-2)'}}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container" style={{marginTop:'-40px',paddingBottom:'40px'}}>
        {jobs.length===0 && !loading ? (
          <div className="card p-16 text-center">
            <Briefcase className="w-14 h-14 mx-auto mb-4" style={{color:'var(--text-3)'}} aria-hidden="true"/>
            <h2 className="font-bold text-lg mb-2" style={{color:'var(--text-1)'}}>No jobs posted yet</h2>
            <p className="text-sm mb-6" style={{color:'var(--text-2)'}}>Post your first job to start receiving applications</p>
            <Link to="/recruiter/post-job" className="btn-primary"><PlusCircle className="w-4 h-4" aria-hidden="true"/> Post First Job</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold" style={{color:'var(--text-1)'}}>Your Jobs</h2>
                <Link to="/recruiter/post-job" className="flex items-center gap-1 text-xs font-semibold" style={{color:'var(--primary)'}}>
                  <PlusCircle className="w-3.5 h-3.5" aria-hidden="true"/> New
                </Link>
              </div>
              <div className="space-y-2">
                {jobs.map(job=>(
                  <JobRow key={job.id} job={job} isSelected={selectedJob?.id===job.id} onSelect={()=>setSelectedJob(job)}
                    onToggle={(id,a)=>setJobs(prev=>prev.map(j=>j.id===id?{...j,is_active:a}:j))}
                    onDelete={handleJobDelete} />
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              {selectedJob ? (
                <>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <h2 className="font-bold" style={{color:'var(--text-1)'}}>{selectedJob.title}</h2>
                      <p className="text-xs" style={{color:'var(--text-3)'}}>{applications.length} applicants</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['','reviewing','shortlisted','interview','offered','hired'].map(s=>(
                        <button key={s} onClick={()=>setStatusFilter(s)} className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all"
                          style={statusFilter===s ? {background:'var(--primary)',color:'white'} : {background:'var(--surface)',color:'var(--text-2)',border:'1px solid var(--border)'}}>
                          {s===''?'All':(STATUS_META[s]?.label||s)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {visibleSelectedCount > 0 && (
                    <BulkActionBar count={visibleSelectedCount} onMove={handleBulkMove} onClear={clearSelection} acting={bulkActing} />
                  )}

                  {applications.length > 1 && (
                    <button
                      onClick={() => {
                        const allSelected = applications.every(a => selectedIds.has(a.id))
                        setSelectedIds(allSelected ? new Set() : new Set(applications.map(a => a.id)))
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                      style={{ color: 'var(--text-3)' }}
                    >
                      {applications.every(a => selectedIds.has(a.id)) ? (
                        <><CheckSquare className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} aria-hidden="true" /> Deselect all</>
                      ) : (
                        <><Square className="w-3.5 h-3.5" aria-hidden="true" /> Select all {applications.length} visible</>
                      )}
                    </button>
                  )}

                  {loadingApps ? (
                    <div className="space-y-3">{Array(3).fill(0).map((_,i)=><div key={i} className="skeleton h-24 rounded-2xl" aria-hidden="true"/>)}</div>
                  ) : applications.length===0 ? (
                    <div className="card p-12 text-center">
                      <Users className="w-10 h-10 mx-auto mb-3" style={{color:'var(--text-3)'}} aria-hidden="true"/>
                      <p style={{color:'var(--text-2)'}}>No {statusFilter||''} applicants yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.map(app=>
                        <ApplicantCard key={app.id} app={app} onUpdate={handleAppUpdate}
                          selected={selectedIds.has(app.id)} onToggleSelect={toggleSelect} />
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="card p-12 text-center">
                  <Users className="w-10 h-10 mx-auto mb-3" style={{color:'var(--text-3)'}} aria-hidden="true"/>
                  <p style={{color:'var(--text-2)'}}>Select a job to view applicants</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
