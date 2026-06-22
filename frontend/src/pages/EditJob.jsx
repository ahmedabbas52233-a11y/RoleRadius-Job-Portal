import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { jobsAPI } from '../services/api'
import { PlusCircle, X, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const JOB_TYPES  = ['full_time', 'part_time', 'contract', 'freelance', 'internship']
const WORK_MODES = ['onsite', 'remote', 'hybrid']
const EXP_LEVELS  = ['entry', 'mid', 'senior', 'lead', 'executive']
const TYPE_LABELS = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', freelance: 'Freelance', internship: 'Internship' }
const MODE_LABELS = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' }
const EXP_LABELS  = { entry: 'Entry Level', mid: 'Mid Level', senior: 'Senior', lead: 'Lead / Principal', executive: 'Executive' }

export default function EditJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', requirements: '', responsibilities: '',
    location: '', category: '', job_type: 'full_time', work_mode: 'hybrid',
    experience_level: 'mid', salary_min: '', salary_max: '', is_active: true,
  })
  const [skills, setSkills]         = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [errors, setErrors]         = useState({})
  const [notFound, setNotFound]     = useState(false)

  useEffect(() => {
    jobsAPI.detail(id)
      .then(({ data }) => {
        setForm({
          title: data.title || '',
          description: data.description || '',
          requirements: data.requirements || '',
          responsibilities: data.responsibilities || '',
          location: data.location || '',
          category: data.category || '',
          job_type: data.job_type || 'full_time',
          work_mode: data.work_mode || 'hybrid',
          experience_level: data.experience_level || 'mid',
          salary_min: data.salary_min ?? '',
          salary_max: data.salary_max ?? '',
          is_active: data.is_active,
        })
        setSkills(data.skills_required || [])
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const addSkill = (s) => { const t = s.trim(); if (t && !skills.includes(t)) setSkills(p => [...p, t]); setSkillInput('') }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErrors({})
    try {
      const payload = {
        ...form, skills_required: skills,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      }
      await jobsAPI.update(id, payload)
      toast.success('Job updated successfully!')
      navigate('/recruiter/dashboard')
    } catch (err) {
      setErrors(err.response?.data || {})
      toast.error('Please fix the errors below')
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, id: fid, error, children }) => (
    <div>
      <label htmlFor={fid} className="label">{label}</label>
      {children}
      {error && <p className="error-msg">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  )

  if (loading) return (
    <div className="page-container py-10 flex justify-center" style={{ background: 'var(--surface-2)' }}>
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary-light)', borderTopColor: 'var(--primary)' }} />
    </div>
  )

  if (notFound) return (
    <div className="page-container py-12 text-center" style={{ background: 'var(--surface-2)' }}>
      <h1 className="page-title mb-4">Job not found</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
        This job may have been deleted, or you don't have permission to edit it.
      </p>
      <Link to="/recruiter/dashboard" className="btn-secondary">Back to Dashboard</Link>
    </div>
  )

  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
      <div className="page-container py-6 sm:py-8 max-w-2xl mx-auto">
        <Link to="/recruiter/dashboard" className="btn-ghost mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Dashboard
        </Link>
        <h1 className="page-title mb-6">Edit Job</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Job Details</h2>
            <Field label="Job Title *" id="title" error={errors.title}>
              <input id="title" required value={form.title} onChange={set('title')} className={`input ${errors.title ? 'input-error' : ''}`} />
            </Field>
            <Field label="Description *" id="description" error={errors.description}>
              <textarea id="description" required value={form.description} onChange={set('description')} className={`input h-32 resize-none ${errors.description ? 'input-error' : ''}`} />
            </Field>
            <Field label="Requirements *" id="requirements" error={errors.requirements}>
              <textarea id="requirements" required value={form.requirements} onChange={set('requirements')} className={`input h-24 resize-none ${errors.requirements ? 'input-error' : ''}`} />
            </Field>
            <Field label="Responsibilities" id="responsibilities">
              <textarea id="responsibilities" value={form.responsibilities} onChange={set('responsibilities')} className="input h-24 resize-none" />
            </Field>
          </div>

          <div className="card p-5 space-y-4">
            <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Classification</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Job Type" id="job_type">
                <select id="job_type" value={form.job_type} onChange={set('job_type')} className="input">
                  {JOB_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </Field>
              <Field label="Work Mode" id="work_mode">
                <select id="work_mode" value={form.work_mode} onChange={set('work_mode')} className="input">
                  {WORK_MODES.map(m => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
                </select>
              </Field>
              <Field label="Experience Level" id="experience_level">
                <select id="experience_level" value={form.experience_level} onChange={set('experience_level')} className="input">
                  {EXP_LEVELS.map(l => <option key={l} value={l}>{EXP_LABELS[l]}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Location *" id="location" error={errors.location}>
                <input id="location" required value={form.location} onChange={set('location')} className={`input ${errors.location ? 'input-error' : ''}`} />
              </Field>
              <Field label="Category" id="category">
                <input id="category" value={form.category} onChange={set('category')} className="input" />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Salary Min (£)" id="salary_min">
                <input id="salary_min" type="number" min="0" value={form.salary_min} onChange={set('salary_min')} className="input" />
              </Field>
              <Field label="Salary Max (£)" id="salary_max">
                <input id="salary_max" type="number" min="0" value={form.salary_max} onChange={set('salary_max')} className="input" />
              </Field>
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="label mb-0">Job is active and accepting applications</span>
              <input type="checkbox" checked={!!form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="w-4 h-4" style={{ accentColor: 'var(--primary)' }} aria-label="Job active status" />
            </label>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Required Skills</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map(s => (
                <span key={s} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', border: '1px solid rgba(99,102,241,.2)' }}>
                  {s}
                  <button type="button" onClick={() => setSkills(p => p.filter(x => x !== s))} aria-label={`Remove ${s}`} className="hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                className="input flex-1" placeholder="Add required skill (Enter to add)" />
              <button type="button" onClick={() => addSkill(skillInput)} className="btn-secondary px-3">
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1 sm:flex-none justify-center">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => navigate('/recruiter/dashboard')} className="btn-secondary justify-center">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
