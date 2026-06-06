import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { jobsAPI } from '../services/api'
import { ArrowLeft, PlusCircle, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loadingJob, setLoadingJob] = useState(true)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    jobsAPI.detail(id)
      .then(({ data }) => {
        setJob(data)
        setSkills(data.skills_required || [])
        reset({
          title: data.title,
          job_type: data.job_type,
          work_mode: data.work_mode,
          experience_level: data.experience_level,
          location: data.location,
          category: data.category,
          salary_currency: data.salary_currency,
          salary_min: data.salary_min || '',
          salary_max: data.salary_max || '',
          description: data.description,
          requirements: data.requirements,
          responsibilities: data.responsibilities || '',
          application_deadline: data.application_deadline || '',
        })
      })
      .catch(() => { toast.error('Job not found'); navigate('/recruiter/dashboard') })
      .finally(() => setLoadingJob(false))
  }, [id])

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) setSkills(p => [...p, s])
    setSkillInput('')
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      await jobsAPI.update(id, {
        ...data,
        skills_required: skills,
        salary_min: data.salary_min ? parseInt(data.salary_min) : null,
        salary_max: data.salary_max ? parseInt(data.salary_max) : null,
      })
      toast.success('Job updated!')
      navigate('/recruiter/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update job')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingJob) return (
    <div className="page-container py-16 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  )

  return (
    <div className="page-container py-8 max-w-3xl">
      <Link to="/recruiter/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
      <div className="mb-8">
        <h1 className="section-title">Edit Job</h1>
        <p className="text-gray-500 mt-1">{job?.title}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 space-y-5">
          <div>
            <label className="label">Job Title *</label>
            <input className="input" {...register('title', { required: 'Required' })} />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Job Type</label>
              <select className="input" {...register('job_type')}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="label">Work Mode</label>
              <select className="input" {...register('work_mode')}>
                <option value="onsite">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Location *</label>
            <input className="input" {...register('location', { required: 'Required' })} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Currency</label>
              <select className="input" {...register('salary_currency')}>
                <option value="GBP">GBP £</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
              </select>
            </div>
            <div>
              <label className="label">Min Salary</label>
              <input type="number" className="input" {...register('salary_min')} />
            </div>
            <div>
              <label className="label">Max Salary</label>
              <input type="number" className="input" {...register('salary_max')} />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <label className="label">Description *</label>
            <textarea rows={6} className="input resize-none" {...register('description', { required: 'Required' })} />
          </div>
          <div>
            <label className="label">Requirements *</label>
            <textarea rows={4} className="input resize-none" {...register('requirements', { required: 'Required' })} />
          </div>
          <div>
            <label className="label">Responsibilities</label>
            <textarea rows={3} className="input resize-none" {...register('responsibilities')} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Required Skills</h2>
          <div className="flex gap-2 mb-3">
            <input className="input flex-1" value={skillInput}
              placeholder="Add a skill and press Enter"
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} />
            <button type="button" onClick={addSkill} className="btn-secondary px-4">
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-100 rounded-xl text-sm font-medium">
                {s}
                <button type="button" onClick={() => setSkills(p => p.filter(x => x !== s))}>
                  <X className="w-3.5 h-3.5 hover:text-red-500" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link to="/recruiter/dashboard" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
