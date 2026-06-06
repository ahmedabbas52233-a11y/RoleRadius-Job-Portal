import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { jobsAPI, applicationsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import {
  MapPin, Clock, Banknote, Bookmark, BookmarkCheck, Share2,
  Building2, Users, Zap, ArrowLeft, ExternalLink, CheckCircle,
  Upload, X, AlertCircle
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'

const BADGE_CLASS = {
  full_time: 'badge-blue', part_time: 'badge-purple',
  contract: 'badge-orange', freelance: 'badge-orange', internship: 'badge-green',
}

export default function JobDetail() {
  const { id } = useParams()
  const { isAuthenticated, isCandidate, user, profile } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    jobsAPI.detail(id)
      .then(({ data }) => {
        setJob(data)
        setSaved(data.is_saved)
        setApplied(data.has_applied)
      })
      .catch(() => navigate('/jobs', { replace: true }))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!isAuthenticated || !isCandidate) { navigate('/login'); return }
    try {
      const { data } = await jobsAPI.saveJob(id)
      setSaved(data.saved)
      toast.success(data.saved ? 'Job saved!' : 'Removed from saved')
    } catch {
      toast.error('Could not save job')
    }
  }

  const handleApply = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!isCandidate) return
    setApplying(true)
    try {
      const form = new FormData()
      if (coverLetter.trim()) form.append('cover_letter', coverLetter.trim())
      if (cvFile) form.append('cv', cvFile)
      await applicationsAPI.apply(id, form)
      setApplied(true)
      setApplyOpen(false)
      toast.success('Application submitted! 🎉')
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.detail
        || 'Could not submit application'
      toast.error(msg)
    } finally {
      setApplying(false)
    }
  }

  const handleShare = () => {
    navigator.share?.({ title: job.title, url: window.location.href })
      || navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!'))
  }

  if (loading) return (
    <div className="page-container py-12 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-100 rounded w-1/4 mb-8" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )

  if (!job) return null

  return (
    <div className="page-container py-8">
      {/* Back */}
      <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                {job.company_logo
                  ? <img src={job.company_logo} alt={job.company_name} className="w-full h-full object-contain p-1.5" />
                  : <Building2 className="w-8 h-8 text-gray-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <p className="text-gray-600 mt-0.5">{job.company_name}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`badge ${BADGE_CLASS[job.job_type] || 'badge-gray'}`}>{job.job_type?.replace('_', ' ')}</span>
                  <span className="badge badge-gray">{job.work_mode}</span>
                  <span className="badge badge-gray">{job.experience_level?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-gray-400" /> {job.location}
              </div>
              {(job.salary_min || job.salary_max) && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Banknote className="w-4 h-4 text-gray-400" /> {job.salary_display}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4 text-gray-400" />
                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About the Role</h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
              {job.description}
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                {job.requirements}
              </div>
            </div>
          )}

          {/* Skills */}
          {job.skills_required?.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills Required</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map((skill) => (
                  <span key={skill} className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium border border-brand-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Apply card */}
          <div className="card p-6">
            {applied ? (
              <div className="text-center">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">Applied!</p>
                <p className="text-sm text-gray-500 mt-1">Track your application in your dashboard</p>
                <Link to="/dashboard" className="btn-secondary w-full justify-center mt-4 text-sm">
                  View Dashboard
                </Link>
              </div>
            ) : (
              <>
                {isCandidate && (
                  <button onClick={() => setApplyOpen(true)} className="btn-primary w-full justify-center mb-3">
                    Apply Now
                  </button>
                )}
                {!isAuthenticated && (
                  <Link to="/login" state={{ from: { pathname: `/jobs/${id}` } }}
                    className="btn-primary w-full justify-center mb-3 block text-center">
                    Sign in to Apply
                  </Link>
                )}
                <div className="flex gap-2">
                  <button onClick={handleSave} className={`flex-1 btn-secondary justify-center text-sm ${saved ? 'text-brand-600 border-brand-200' : ''}`}>
                    {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    {saved ? 'Saved' : 'Save'}
                  </button>
                  <button onClick={handleShare} className="btn-secondary px-3">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Job summary */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Job Summary</h3>
            <dl className="space-y-3">
              {[
                ['Posted', formatDistanceToNow(new Date(job.created_at), { addSuffix: true })],
                ['Deadline', job.application_deadline ? format(new Date(job.application_deadline), 'dd MMM yyyy') : 'Open'],
                ['Applications', `${job.application_count} applicants`],
                ['Views', `${job.views_count} views`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="text-gray-900 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {applyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-lg text-gray-900">Apply to {job.title}</h2>
                <p className="text-sm text-gray-500">{job.company_name}</p>
              </div>
              <button onClick={() => setApplyOpen(false)} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Profile CV note */}
              {profile?.cv_url && (
                <div className="flex items-center gap-2.5 p-3 bg-green-50 rounded-xl text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  Your saved CV will be attached automatically.
                </div>
              )}
              {!profile?.cv_url && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>No CV on file. Upload one below or <Link to="/profile" className="underline">add it to your profile</Link>.</span>
                </div>
              )}

              {/* Cover letter */}
              <div>
                <label className="label" htmlFor="cover_letter">Cover Letter <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  id="cover_letter"
                  rows={5}
                  className="input resize-none"
                  placeholder="Tell the employer why you're a great fit…"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>

              {/* CV upload */}
              <div>
                <label className="label">Attach CV <span className="text-gray-400 font-normal">(optional override)</span></label>
                <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">{cvFile ? cvFile.name : 'Click to upload PDF, DOCX, or TXT'}</span>
                  <input type="file" className="hidden" accept=".pdf,.docx,.txt"
                    onChange={(e) => setCvFile(e.target.files[0])} />
                </label>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setApplyOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleApply} disabled={applying} className="btn-primary flex-1 justify-center">
                {applying ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
