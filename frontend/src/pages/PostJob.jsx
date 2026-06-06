import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { jobsAPI } from '../services/api'
import { ArrowLeft, PlusCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'

const FIELD = ({ label, children, error, hint }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    {error && <p className="form-error">{error}</p>}
  </div>
)

export default function PostJob() {
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      salary_currency: 'GBP', job_type: 'full_time',
      experience_level: 'mid', work_mode: 'onsite', is_active: true,
    }
  })

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) {
      setSkills(prev => [...prev, s])
    }
    setSkillInput('')
  }

  const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s))

  const onSubmit = async (data) => {
    if (skills.length === 0) {
      toast.error('Add at least one required skill')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        skills_required: skills,
        salary_min: data.salary_min ? parseInt(data.salary_min) : null,
        salary_max: data.salary_max ? parseInt(data.salary_max) : null,
      }
      const { data: job } = await jobsAPI.create(payload)
      toast.success('Job posted successfully!')
      navigate(`/jobs/${job.id}`)
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        Object.entries(errors).forEach(([k, v]) => toast.error(`${k}: ${Array.isArray(v) ? v[0] : v}`))
      } else {
        toast.error('Failed to post job')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container py-8 max-w-3xl">
      <Link to="/recruiter/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="mb-8">
        <h1 className="section-title">Post a Job</h1>
        <p className="text-gray-500 mt-1">Fill in the details below to reach qualified candidates</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic info */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-lg">Basic Information</h2>

          <FIELD label="Job Title *" error={errors.title?.message}>
            <input className={`input ${errors.title ? 'border-red-300' : ''}`}
              placeholder="e.g. Senior Frontend Developer"
              {...register('title', { required: 'Job title is required' })} />
          </FIELD>

          <div className="grid sm:grid-cols-2 gap-4">
            <FIELD label="Job Type *">
              <select className="input" {...register('job_type')}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
                <option value="internship">Internship</option>
              </select>
            </FIELD>
            <FIELD label="Work Mode *">
              <select className="input" {...register('work_mode')}>
                <option value="onsite">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </FIELD>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <FIELD label="Experience Level *">
              <select className="input" {...register('experience_level')}>
                <option value="entry">Entry Level (0-2 yrs)</option>
                <option value="mid">Mid Level (2-5 yrs)</option>
                <option value="senior">Senior Level (5-8 yrs)</option>
                <option value="lead">Lead / Principal (8+ yrs)</option>
                <option value="executive">Executive / Director</option>
              </select>
            </FIELD>
            <FIELD label="Category" hint="e.g. Software Engineering, Design">
              <input className="input" placeholder="Software Engineering"
                {...register('category')} />
            </FIELD>
          </div>

          <FIELD label="Location *" error={errors.location?.message}>
            <input className={`input ${errors.location ? 'border-red-300' : ''}`}
              placeholder="e.g. London, UK / Remote"
              {...register('location', { required: 'Location is required' })} />
          </FIELD>
        </div>

        {/* Salary */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-lg">Compensation</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <FIELD label="Currency">
              <select className="input" {...register('salary_currency')}>
                <option value="GBP">GBP £</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
                <option value="AED">AED د.إ</option>
              </select>
            </FIELD>
            <FIELD label="Min Salary" hint="Annual">
              <input type="number" className="input" placeholder="40000" {...register('salary_min')} />
            </FIELD>
            <FIELD label="Max Salary" hint="Annual">
              <input type="number" className="input" placeholder="65000" {...register('salary_max')} />
            </FIELD>
          </div>
          <p className="text-xs text-gray-400">Leave blank to show "Competitive"</p>
        </div>

        {/* Description */}
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 text-lg">Job Details</h2>

          <FIELD label="Job Description *" error={errors.description?.message}
            hint="Describe the role, responsibilities, and what makes it exciting">
            <textarea rows={7} className={`input resize-none ${errors.description ? 'border-red-300' : ''}`}
              placeholder="We're looking for a passionate developer to join our team…"
              {...register('description', { required: 'Description is required', minLength: { value: 50, message: 'Please write at least 50 characters' } })} />
          </FIELD>

          <FIELD label="Requirements *" error={errors.requirements?.message}
            hint="List the must-have qualifications and experience">
            <textarea rows={5} className={`input resize-none ${errors.requirements ? 'border-red-300' : ''}`}
              placeholder="• 3+ years of React experience&#10;• Strong TypeScript skills&#10;• Experience with REST APIs"
              {...register('requirements', { required: 'Requirements are required' })} />
          </FIELD>

          <FIELD label="Responsibilities" hint="What will the candidate be doing day-to-day?">
            <textarea rows={4} className="input resize-none"
              placeholder="• Design and implement new features&#10;• Review code with peers"
              {...register('responsibilities')} />
          </FIELD>
        </div>

        {/* Skills */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 text-lg mb-4">Required Skills *</h2>
          <div className="flex gap-2 mb-3">
            <input className="input flex-1" value={skillInput}
              placeholder="e.g. React, Python, Docker…"
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
            />
            <button type="button" onClick={addSkill} className="btn-secondary px-4">
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((s) => (
                <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-100 rounded-xl text-sm font-medium">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="hover:text-brand-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Deadline */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 text-lg mb-4">Application Deadline</h2>
          <FIELD label="Deadline" hint="Leave blank to keep the role open indefinitely">
            <input type="date" className="input max-w-xs" {...register('application_deadline')} />
          </FIELD>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Link to="/recruiter/dashboard" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting…
              </span>
            ) : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  )
}
