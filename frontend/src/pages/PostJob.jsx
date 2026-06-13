import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobsAPI } from '../services/api'
import { PlusCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'

const JOB_TYPES       = ['full_time','part_time','contract','freelance','internship']
const WORK_MODES      = ['onsite','remote','hybrid']
const EXP_LEVELS      = ['entry','mid','senior','lead','executive']
const JOB_TYPE_LABELS = { full_time:'Full-time', part_time:'Part-time', contract:'Contract', freelance:'Freelance', internship:'Internship' }
const MODE_LABELS     = { onsite:'On-site', remote:'Remote', hybrid:'Hybrid' }
const EXP_LABELS      = { entry:'Entry Level', mid:'Mid Level', senior:'Senior', lead:'Lead / Principal', executive:'Executive' }

export default function PostJob() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title:'', description:'', requirements:'', responsibilities:'',
    location:'', category:'', job_type:'full_time', work_mode:'hybrid',
    experience_level:'mid', salary_min:'', salary_max:'',
  })
  const [skills, setSkills]       = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving]       = useState(false)
  const [errors, setErrors]       = useState({})

  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

  const addSkill = (s) => {
    const t = s.trim()
    if (t && !skills.includes(t)) setSkills(prev => [...prev, t])
    setSkillInput('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      const payload = {
        ...form,
        skills_required: skills,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      }
      await jobsAPI.create(payload)
      toast.success('Job posted successfully!')
      navigate('/recruiter/dashboard')
    } catch (err) {
      setErrors(err.response?.data || {})
      toast.error('Please fix the errors below')
    } finally {
      setSaving(false)
    }
  }

  const Field = ({ label, id, error, children }) => (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p className="error-msg">{Array.isArray(error) ? error[0] : error}</p>}
    </div>
  )

  return (
    <div className="page-container py-6 sm:py-8 max-w-2xl mx-auto">
      <h1 className="page-title mb-6">Post a New Job</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Job Details</h2>
          <Field label="Job Title *" id="title" error={errors.title}>
            <input id="title" required value={form.title} onChange={set('title')}
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g. Senior Full-Stack Developer" />
          </Field>
          <Field label="Description *" id="description" error={errors.description}>
            <textarea id="description" required value={form.description} onChange={set('description')}
              className={`input h-32 resize-none ${errors.description ? 'input-error' : ''}`}
              placeholder="Describe the role, team, and what the person will work on..." />
          </Field>
          <Field label="Requirements *" id="requirements" error={errors.requirements}>
            <textarea id="requirements" required value={form.requirements} onChange={set('requirements')}
              className={`input h-24 resize-none ${errors.requirements ? 'input-error' : ''}`}
              placeholder="List the essential qualifications and experience..." />
          </Field>
          <Field label="Responsibilities" id="responsibilities" error={errors.responsibilities}>
            <textarea id="responsibilities" value={form.responsibilities} onChange={set('responsibilities')}
              className="input h-24 resize-none"
              placeholder="What will the person be responsible for day-to-day?" />
          </Field>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Classification</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Job Type" id="job_type">
              <select id="job_type" value={form.job_type} onChange={set('job_type')} className="input">
                {JOB_TYPES.map(t => <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>)}
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
              <input id="location" required value={form.location} onChange={set('location')}
                className={`input ${errors.location ? 'input-error' : ''}`}
                placeholder="e.g. London, UK or Remote" />
            </Field>
            <Field label="Category" id="category">
              <input id="category" value={form.category} onChange={set('category')}
                className="input" placeholder="e.g. Software Engineering" />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Salary Min (£)" id="salary_min" error={errors.salary_min}>
              <input id="salary_min" type="number" min="0" value={form.salary_min} onChange={set('salary_min')}
                className="input" placeholder="e.g. 45000" />
            </Field>
            <Field label="Salary Max (£)" id="salary_max" error={errors.salary_max}>
              <input id="salary_max" type="number" min="0" value={form.salary_max} onChange={set('salary_max')}
                className="input" placeholder="e.g. 65000" />
            </Field>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Required Skills</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map(s => (
              <span key={s} className="flex items-center gap-1 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium border border-brand-200">
                {s}
                <button type="button" onClick={() => setSkills(prev => prev.filter(x => x !== s))}
                  aria-label={`Remove ${s}`} className="hover:text-red-500">
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
            {saving ? 'Posting…' : 'Post Job'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary justify-center">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
