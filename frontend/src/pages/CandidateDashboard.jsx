import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { applicationsAPI, matchingAPI, jobsAPI } from '../services/api'
import JobCard from '../components/JobCard'
import { Briefcase, FileText, Zap, Star, Clock, CheckCircle, XCircle, BookmarkCheck, ArrowRight, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const STATUS_META = {
  pending:     {color:'#6b7280',bg:'#f3f4f6',label:'Pending',       Icon:Clock},
  reviewing:   {color:'#1d4ed8',bg:'#dbeafe',label:'Reviewing',     Icon:FileText},
  shortlisted: {color:'#7c3aed',bg:'#ede9fe',label:'Shortlisted',   Icon:Star},
  interview:   {color:'#c2410c',bg:'#ffedd5',label:'Interview',      Icon:Briefcase},
  offered:     {color:'#065f46',bg:'#d1fae5',label:'Offered 🎉',    Icon:CheckCircle},
  rejected:    {color:'#991b1b',bg:'#fee2e2',label:'Rejected',       Icon:XCircle},
  withdrawn:   {color:'#4b5563',bg:'#f3f4f6',label:'Withdrawn',     Icon:XCircle},
}
const TABS = ['Applications','AI Matches','Saved Jobs']

export default function CandidateDashboard() {
  const { user, profile } = useAuth()
  const [tab, setTab]       = useState('Applications')
  const [apps, setApps]     = useState([])
  const [matches, setMatches] = useState([])
  const [saved, setSaved]   = useState([])
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    Promise.allSettled([
      applicationsAPI.myApplications(),
      applicationsAPI.candidateStats(),
      matchingAPI.matchedJobs({top:6}),
      jobsAPI.savedJobs(),
    ]).then(([a,s,m,sv])=>{
      if (a.status==='fulfilled') setApps(a.value.data.results||[])
      if (s.status==='fulfilled') setStats(s.value.data)
      if (m.status==='fulfilled') setMatches(m.value.data.results||[])
      if (sv.status==='fulfilled') setSaved(sv.value.data.results||[])
    }).finally(()=>setLoading(false))
  },[])

  const STAT_CARDS = [
    {label:'Applied',     v:stats?.total_applications??'—',          color:'#6366f1',bg:'#eef2ff'},
    {label:'Reviewing',   v:stats?.status_breakdown?.reviewing??'—', color:'#2563eb',bg:'#dbeafe'},
    {label:'Shortlisted', v:stats?.status_breakdown?.shortlisted??'—',color:'#7c3aed',bg:'#ede9fe'},
    {label:'Offers',      v:stats?.status_breakdown?.offered??'—',   color:'#059669',bg:'#d1fae5'},
  ]

  return (
    <div style={{background:'var(--surface-2)',minHeight:'100vh'}}>
      <div style={{background:'linear-gradient(135deg,#1e1b4b,#4c1d95)',padding:'32px 0 80px'}}>
        <div className="page-container">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold mb-1" style={{color:'rgba(165,180,252,.8)'}}>Welcome back 👋</p>
              <h1 className="font-extrabold text-white" style={{fontSize:'clamp(1.5rem,4vw,2rem)',letterSpacing:'-.02em'}}>{user?.full_name}</h1>
              <p className="text-sm mt-1" style={{color:'rgba(255,255,255,.6)'}}>{profile?.headline||'Complete your profile to get AI matches'}</p>
            </div>
            <div className="flex gap-2">
              <Link to="/profile" className="btn-ghost text-white text-sm border" style={{borderColor:'rgba(255,255,255,.2)',background:'rgba(255,255,255,.1)'}}>
                <User className="w-4 h-4" aria-hidden="true"/> Edit Profile
              </Link>
              <Link to="/jobs" className="btn-primary text-sm" style={{background:'rgba(255,255,255,.15)',boxShadow:'none'}}>
                Browse Jobs <ArrowRight className="w-4 h-4" aria-hidden="true"/>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {STAT_CARDS.map(({label,v,color,bg})=>(
              <div key={label} className="card p-4" style={{borderColor:'transparent'}}>
                <p className="text-2xl font-extrabold mb-0.5" style={{color}}>{v}</p>
                <p className="text-xs font-semibold" style={{color:'var(--text-2)'}}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container" style={{marginTop:'-40px',paddingBottom:'40px'}}>
        <div className="flex gap-1 mb-6 p-1 rounded-xl w-full sm:w-auto inline-flex" style={{background:'white',border:'1px solid var(--border)',display:'inline-flex'}} role="tablist">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} role="tab" aria-selected={tab===t}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={tab===t ? {background:'var(--primary)',color:'white',boxShadow:'0 2px 8px rgba(99,102,241,.35)'} : {color:'var(--text-2)'}}>
              {t}
            </button>
          ))}
        </div>

        {tab==='Applications' && (
          loading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_,i)=><div key={i} className="skeleton h-24 rounded-2xl" aria-hidden="true"/>)}</div>
          ) : apps.length===0 ? (
            <div className="card p-14 text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-3" style={{color:'var(--text-3)'}} aria-hidden="true"/>
              <p className="font-semibold mb-4" style={{color:'var(--text-2)'}}>No applications yet</p>
              <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map(app=>{
                const meta = STATUS_META[app.status]||STATUS_META.pending
                const {Icon} = meta
                return (
                  <div key={app.id} className="card p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:meta.bg}}>
                      <Icon className="w-5 h-5" style={{color:meta.color}} aria-hidden="true"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" style={{color:'var(--text-1)'}}>{app.job?.title}</p>
                      <p className="text-sm truncate" style={{color:'var(--text-3)'}}>{app.job?.company_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="badge text-xs" style={{background:meta.bg,color:meta.color}}>{meta.label}</span>
                      {app.match_score!=null && (
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg" style={{background:'var(--primary-light)',color:'var(--primary)'}}>
                          <Zap className="w-3 h-3" aria-hidden="true"/>{Math.round(app.match_score)}%
                        </span>
                      )}
                      <span className="text-xs" style={{color:'var(--text-3)'}}>{formatDistanceToNow(new Date(app.applied_at),{addSuffix:true})}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {tab==='AI Matches' && (
          matches.length===0 ? (
            <div className="card p-14 text-center">
              <Zap className="w-12 h-12 mx-auto mb-3" style={{color:'var(--text-3)'}} aria-hidden="true"/>
              <p className="font-semibold mb-2" style={{color:'var(--text-2)'}}>No matches yet</p>
              <p className="text-sm mb-5" style={{color:'var(--text-3)'}}>Upload your CV and add skills to get AI-ranked job recommendations.</p>
              <Link to="/profile" className="btn-primary">Complete Profile</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">{matches.map(job=><JobCard key={job.id} job={job}/>)}</div>
          )
        )}

        {tab==='Saved Jobs' && (
          saved.length===0 ? (
            <div className="card p-14 text-center">
              <BookmarkCheck className="w-12 h-12 mx-auto mb-3" style={{color:'var(--text-3)'}} aria-hidden="true"/>
              <p className="font-semibold mb-4" style={{color:'var(--text-2)'}}>No saved jobs yet</p>
              <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">{saved.map(s=><JobCard key={s.id} job={s.job||s}/>)}</div>
          )
        )}
      </div>
    </div>
  )
}
