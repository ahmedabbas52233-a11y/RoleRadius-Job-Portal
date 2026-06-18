import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { jobsAPI, applicationsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { MapPin, Clock, Banknote, Briefcase, Monitor, GraduationCap, Zap, Building2, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const TYPE_LABELS = { full_time:'Full-time', part_time:'Part-time', contract:'Contract', freelance:'Freelance', internship:'Internship' }
const MODE_LABELS = { onsite:'On-site', remote:'Remote', hybrid:'Hybrid' }
const EXP_LABELS  = { entry:'Entry Level', mid:'Mid Level', senior:'Senior', lead:'Lead', executive:'Executive' }

export default function JobDetail() {
  const { id } = useParams()
  const { isAuthenticated, isCandidate } = useAuth()
  const [job, setJob]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied]   = useState(false)
  const [cover, setCover]       = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    jobsAPI.detail(id).then(({ data }) => { setJob(data); setApplied(data.has_applied) }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const handleApply = async (e) => {
    e.preventDefault(); setApplying(true)
    try {
      await applicationsAPI.apply(id, { cover_letter: cover })
      setApplied(true); setShowForm(false); toast.success('Application submitted!')
    } catch (err) { toast.error(err.response?.data?.detail || 'Could not submit application') }
    finally { setApplying(false) }
  }

  if (loading) return (
    <div className="page-container py-10 flex justify-center" style={{background:'var(--surface-2)'}}>
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{borderColor:'var(--primary-light)',borderTopColor:'var(--primary)'}}/>
    </div>
  )

  if (!job) return (
    <div className="page-container py-12 text-center" style={{background:'var(--surface-2)'}}>
      <h1 className="page-title mb-4">Job not found</h1>
      <Link to="/jobs" className="btn-secondary">Browse Jobs</Link>
    </div>
  )

  return (
    <div style={{background:'var(--surface-2)',minHeight:'100vh'}}>
      <div className="page-container py-6 sm:py-8">
        <Link to="/jobs" className="btn-ghost mb-4 -ml-2"><ArrowLeft className="w-4 h-4" aria-hidden="true" /> All Jobs</Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--surface-2)',border:'1px solid var(--border)'}}>
                  <Building2 className="w-6 h-6" style={{color:'var(--text-3)'}} aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold" style={{color:'var(--text-1)'}}>{job.title}</h1>
                  <p className="font-medium mt-0.5" style={{color:'var(--text-2)'}}>{job.company_name}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-5 text-sm" style={{color:'var(--text-2)'}}>
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" aria-hidden="true" />{job.location}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" aria-hidden="true" />{TYPE_LABELS[job.job_type]}</span>
                <span className="flex items-center gap-1.5"><Monitor className="w-4 h-4" aria-hidden="true" />{MODE_LABELS[job.work_mode]}</span>
                <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" aria-hidden="true" />{EXP_LABELS[job.experience_level]}</span>
                {(job.salary_min || job.salary_max) && (
                  <span className="flex items-center gap-1.5"><Banknote className="w-4 h-4" aria-hidden="true" />
                    {job.salary_display || `£${job.salary_min?.toLocaleString()}–£${job.salary_max?.toLocaleString()}`}
                  </span>
                )}
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" aria-hidden="true" />{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
              </div>

              {job.match_score != null && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium" style={{background:'var(--primary-light)',color:'var(--primary-dark)',border:'1px solid rgba(99,102,241,.2)'}}>
                  <Zap className="w-4 h-4" aria-hidden="true" /> {Math.round(job.match_score)}% match with your profile
                </div>
              )}
            </div>

            {job.description && (
              <div className="card p-5 sm:p-6">
                <h2 className="font-semibold mb-3" style={{color:'var(--text-1)'}}>About the Role</h2>
                <p className="whitespace-pre-line leading-relaxed text-sm sm:text-base" style={{color:'var(--text-2)'}}>{job.description}</p>
              </div>
            )}
            {job.requirements && (
              <div className="card p-5 sm:p-6">
                <h2 className="font-semibold mb-3" style={{color:'var(--text-1)'}}>Requirements</h2>
                <p className="whitespace-pre-line text-sm sm:text-base" style={{color:'var(--text-2)'}}>{job.requirements}</p>
              </div>
            )}
            {job.responsibilities && (
              <div className="card p-5 sm:p-6">
                <h2 className="font-semibold mb-3" style={{color:'var(--text-1)'}}>Responsibilities</h2>
                <p className="whitespace-pre-line text-sm sm:text-base" style={{color:'var(--text-2)'}}>{job.responsibilities}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="card p-5 sticky top-20">
              {applied ? (
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{background:'#d1fae5'}}>
                    <Zap className="w-6 h-6" style={{color:'#059669'}} aria-hidden="true" />
                  </div>
                  <p className="font-semibold mb-1" style={{color:'var(--text-1)'}}>Application submitted!</p>
                  <p className="text-sm" style={{color:'var(--text-3)'}}>You'll be notified of any updates.</p>
                </div>
              ) : !isAuthenticated ? (
                <div className="text-center">
                  <p className="text-sm mb-4" style={{color:'var(--text-2)'}}>Sign in to apply for this job</p>
                  <Link to={`/login?next=/jobs/${job.id}`} className="btn-primary w-full justify-center">Sign In to Apply</Link>
                  <Link to="/register" className="btn-secondary w-full justify-center mt-2">Create Account</Link>
                </div>
              ) : !isCandidate ? (
                <p className="text-sm text-center" style={{color:'var(--text-3)'}}>Only candidates can apply</p>
              ) : !showForm ? (
                <button onClick={() => setShowForm(true)} className="btn-primary w-full justify-center">Apply Now</button>
              ) : (
                <form onSubmit={handleApply}>
                  <h3 className="font-semibold mb-3" style={{color:'var(--text-1)'}}>Your Application</h3>
                  <label htmlFor="cover" className="label">Cover Letter (optional)</label>
                  <textarea id="cover" value={cover} onChange={e => setCover(e.target.value)} className="input h-32 resize-none mb-3" placeholder="Briefly explain why you're a great fit..." />
                  <div className="flex gap-2">
                    <button type="submit" disabled={applying} className="btn-primary flex-1 justify-center">{applying ? 'Submitting…' : 'Submit Application'}</button>
                    <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-3">Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {job.skills_required?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold mb-3" style={{color:'var(--text-1)'}}>Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map(s => (
                    <span key={s} className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{background:'var(--surface-2)',color:'var(--text-2)',border:'1px solid var(--border)'}}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
