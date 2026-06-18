import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { applicationsAPI, jobsAPI } from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'
import { Briefcase, Users, Star, Award, PlusCircle, Eye, EyeOff, Trash2, Pencil, Zap, ChevronRight, Building2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_META = {
  pending:     {bg:'#f3f4f6',color:'#374151',label:'Pending'},
  reviewing:   {bg:'#dbeafe',color:'#1e40af',label:'Reviewing'},
  shortlisted: {bg:'#ede9fe',color:'#6d28d9',label:'Shortlisted'},
  interview:   {bg:'#ffedd5',color:'#c2410c',label:'Interview'},
  offered:     {bg:'#d1fae5',color:'#065f46',label:'Offered 🎉'},
  rejected:    {bg:'#fee2e2',color:'#991b1b',label:'Rejected'},
  withdrawn:   {bg:'#f3f4f6',color:'#4b5563',label:'Withdrawn'},
}
const NEXT_STATUSES = ['reviewing','shortlisted','interview','offered','rejected']

function ApplicantCard({ app, onUpdate }) {
  const [open, setOpen]       = useState(false)
  const [updating, setUpdating] = useState(false)

  const moveTo = async (status) => {
    setUpdating(true)
    try {
      const { data } = await applicationsAPI.updateStatus(app.id, { status })
      onUpdate(app.id, data)
      toast.success(`Moved to ${status}`)
    } catch { toast.error('Could not update') }
    finally { setUpdating(false) }
  }

  const meta = STATUS_META[app.status] || STATUS_META.pending

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm text-white" style={{background:'linear-gradient(135deg,#6366f1,#a855f7)'}}>
            {app.candidate?.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{color:'var(--text-1)'}}>{app.candidate?.full_name}</p>
            <p className="text-xs truncate" style={{color:'var(--text-3)'}}>{app.candidate_profile?.headline||'No headline'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="badge text-xs" style={{background:meta.bg,color:meta.color}}>{meta.label}</span>
          {app.match_score!=null && (
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg" style={{background:'var(--primary-light)',color:'var(--primary)'}}>
              <Zap className="w-3 h-3" aria-hidden="true"/>{Math.round(app.match_score)}%
            </span>
          )}
        </div>
      </div>
      {app.candidate_profile?.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {app.candidate_profile.skills.slice(0,4).map(s=>(
            <span key={s} className="px-2 py-0.5 rounded-md text-xs" style={{background:'var(--surface-2)',color:'var(--text-2)',border:'1px solid var(--border)'}}>{s}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs" style={{color:'var(--text-3)'}}>{formatDistanceToNow(new Date(app.applied_at),{addSuffix:true})}</span>
        <button onClick={()=>setOpen(!open)} className="flex items-center gap-1 text-xs font-semibold transition-colors" style={{color:'var(--primary)'}} aria-expanded={open}>
          Actions <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open?'rotate-90':''}`} aria-hidden="true"/>
        </button>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t animate-fade-up" style={{borderColor:'var(--border)'}}>
          <p className="text-xs font-semibold mb-2" style={{color:'var(--text-2)'}}>Move to:</p>
          <div className="flex flex-wrap gap-1.5">
            {NEXT_STATUSES.filter(s=>s!==app.status).map(s=>{
              const m=STATUS_META[s]
              return (
                <button key={s} onClick={()=>moveTo(s)} disabled={updating} className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-50" style={{background:m.bg,color:m.color}}>
                  {m.label}
                </button>
              )
            })}
          </div>
          {app.cover_letter && (
            <div className="mt-3">
              <p className="text-xs font-semibold mb-1" style={{color:'var(--text-2)'}}>Cover letter:</p>
              <p className="text-xs rounded-xl p-3 line-clamp-3" style={{background:'var(--surface-2)',color:'var(--text-2)'}}>{app.cover_letter}</p>
            </div>
          )}
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

export default function RecruiterDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats]               = useState(null)
  const [jobs, setJobs]                 = useState([])
  const [selectedJob, setSelectedJob]   = useState(null)
  const [applications, setApplications] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loadingApps, setLoadingApps]   = useState(false)
  const [loading, setLoading]           = useState(true)

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
    applicationsAPI.jobApplications(selectedJob.id, statusFilter?{status:statusFilter}:{})
      .then(({data})=>setApplications(data.results||[]))
      .catch(()=>setApplications([]))
      .finally(()=>setLoadingApps(false))
  },[selectedJob,statusFilter])

  const handleAppUpdate = (id,updated) => setApplications(prev=>prev.map(a=>a.id===id?updated:a))
  const handleJobDelete = id => {
    setJobs(prev=>{ const n=prev.filter(j=>j.id!==id); if(selectedJob?.id===id)setSelectedJob(n[0]||null); return n })
  }

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
            <Link to="/recruiter/post-job" className="btn-primary text-sm" style={{background:'rgba(255,255,255,.15)',boxShadow:'none'}}>
              <PlusCircle className="w-4 h-4" aria-hidden="true"/> Post a Job
            </Link>
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
                      {['','reviewing','shortlisted','interview','offered'].map(s=>(
                        <button key={s} onClick={()=>setStatusFilter(s)} className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all"
                          style={statusFilter===s ? {background:'var(--primary)',color:'white'} : {background:'var(--surface)',color:'var(--text-2)',border:'1px solid var(--border)'}}>
                          {s===''?'All':(STATUS_META[s]?.label||s)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {loadingApps ? (
                    <div className="space-y-3">{Array(3).fill(0).map((_,i)=><div key={i} className="skeleton h-24 rounded-2xl" aria-hidden="true"/>)}</div>
                  ) : applications.length===0 ? (
                    <div className="card p-12 text-center">
                      <Users className="w-10 h-10 mx-auto mb-3" style={{color:'var(--text-3)'}} aria-hidden="true"/>
                      <p style={{color:'var(--text-2)'}}>No {statusFilter||''} applicants yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">{applications.map(app=><ApplicantCard key={app.id} app={app} onUpdate={handleAppUpdate}/>)}</div>
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
