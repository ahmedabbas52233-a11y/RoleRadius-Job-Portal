import { useState, memo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Banknote, Bookmark, BookmarkCheck, Zap, Building2, Briefcase } from 'lucide-react'
import { jobsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const TYPE_COLORS = {
  full_time:  {bg:'#eef2ff',color:'#4338ca',label:'Full-time'},
  part_time:  {bg:'#f0fdf4',color:'#166534',label:'Part-time'},
  contract:   {bg:'#fef3c7',color:'#92400e',label:'Contract'},
  freelance:  {bg:'#fdf4ff',color:'#7e22ce',label:'Freelance'},
  internship: {bg:'#fff7ed',color:'#c2410c',label:'Internship'},
}
const MODE_STYLES = {
  remote: {bg:'#d1fae5',color:'#065f46',label:'Remote'},
  hybrid: {bg:'#dbeafe',color:'#1e40af',label:'Hybrid'},
  onsite: {bg:'#f3f4f6',color:'#374151',label:'On-site'},
}

function JobCard({ job, onSaveToggle }) {
  const { isAuthenticated, isCandidate } = useAuth()
  const [saved, setSaved]   = useState(job.is_saved || false)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault(); e.stopPropagation()
    if (!isAuthenticated) { toast.error('Sign in to save jobs'); return }
    if (!isCandidate)     { toast.error('Only candidates can save jobs'); return }
    setSaving(true)
    try {
      await jobsAPI.saveJob(job.id)
      const next = !saved
      setSaved(next)
      toast.success(next ? '🔖 Saved!' : 'Removed from saved')
      onSaveToggle?.(job.id, next)
    } catch { toast.error('Could not save job') }
    finally  { setSaving(false) }
  }

  const type = TYPE_COLORS[job.job_type] || {bg:'#f3f4f6',color:'#374151',label:job.job_type}
  const mode = MODE_STYLES[job.work_mode] || {bg:'#f3f4f6',color:'#374151',label:job.work_mode}

  const salary = job.salary_min && job.salary_max
    ? `£${(job.salary_min/1000).toFixed(0)}k–£${(job.salary_max/1000).toFixed(0)}k`
    : job.salary_min ? `From £${(job.salary_min/1000).toFixed(0)}k` : 'Competitive'

  return (
    <article className="card card-hover-lift flex flex-col h-full group overflow-hidden">
      {job.match_score != null && (
        <div style={{height:'3px',background:'linear-gradient(to right,#6366f1,#a855f7)',width:`${Math.round(job.match_score)}%`,transition:'width .5s ease'}} aria-hidden="true" />
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0"
              style={{background:'var(--surface-2)',borderColor:'var(--border)'}}>
              {job.company_logo
                ? <img src={job.company_logo} alt={`${job.company_name} logo`} loading="lazy" decoding="async" className="w-8 h-8 object-contain rounded-lg" />
                : <Building2 className="w-5 h-5" style={{color:'var(--text-3)'}} aria-hidden="true" />}
            </div>
            <div className="min-w-0">
              <Link to={`/jobs/${job.id}`} className="font-bold text-sm leading-snug line-clamp-2 block transition-colors hover:text-primary-600" style={{color:'var(--text-1)'}}>
                {job.title}
              </Link>
              <p className="text-xs mt-0.5 truncate" style={{color:'var(--text-3)'}}>{job.company_name}</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} aria-pressed={saved} aria-label={saved ? `Unsave ${job.title}` : `Save ${job.title}`}
            className="p-2 rounded-xl transition-all flex-shrink-0"
            style={{color: saved ? 'var(--primary)' : 'var(--text-3)', background: saved ? 'var(--primary-light)' : 'transparent'}}>
            {saved ? <BookmarkCheck className="w-4 h-4" aria-hidden="true" /> : <Bookmark className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="badge text-xs" style={{background:type.bg,color:type.color}}>{type.label}</span>
          <span className="badge text-xs" style={{background:mode.bg,color:mode.color}}>{mode.label}</span>
          {job.category && <span className="badge text-xs" style={{background:'var(--surface-2)',color:'var(--text-2)',border:'1px solid var(--border)'}}>{job.category}</span>}
        </div>

        {job.skills_required?.length > 0 && (
          <div className="hidden xs:flex flex-wrap gap-1 mb-4">
            {job.skills_required.slice(0,3).map(s=>(
              <span key={s} className="px-2 py-0.5 rounded-md text-xs font-medium" style={{background:'var(--surface-2)',color:'var(--text-2)',border:'1px solid var(--border)'}}>{s}</span>
            ))}
            {job.skills_required.length > 3 && <span className="px-2 py-0.5 text-xs" style={{color:'var(--text-3)'}}>+{job.skills_required.length-3}</span>}
          </div>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-auto pt-3 border-t" style={{borderColor:'var(--border)',color:'var(--text-3)'}}>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true"/>{job.location}</span>
          <span className="flex items-center gap-1"><Banknote className="w-3 h-3" aria-hidden="true"/>{salary}</span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" aria-hidden="true"/>{formatDistanceToNow(new Date(job.created_at),{addSuffix:true})}
          </span>
        </div>

        {job.match_score != null && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{borderColor:'var(--border)'}}>
            <span className="text-xs" style={{color:'var(--text-3)'}}>AI match</span>
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg" style={{background:'var(--primary-light)',color:'var(--primary)'}}>
              <Zap className="w-3 h-3" aria-hidden="true"/>{Math.round(job.match_score)}%
            </span>
          </div>
        )}

        <Link to={`/jobs/${job.id}`} className="btn-secondary w-full justify-center mt-4 text-xs py-2.5">
          View Role <Briefcase className="w-3.5 h-3.5" aria-hidden="true"/>
        </Link>
      </div>
    </article>
  )
}

export default memo(JobCard)
