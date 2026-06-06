import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import { useForm } from 'react-hook-form'
import {
  User, Building2, UploadCloud, PlusCircle, X,
  CheckCircle, AlertCircle, Download, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

function SkillsInput({ skills, onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const s = input.trim()
    if (s && !skills.includes(s)) onChange([...skills, s])
    setInput('')
  }
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input className="input flex-1" value={input} placeholder="Add a skill"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <button type="button" onClick={add} className="btn-secondary px-3">
          <PlusCircle className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-100 rounded-xl text-sm font-medium">
            {s}
            <button type="button" onClick={() => onChange(skills.filter(x => x !== s))}>
              <X className="w-3.5 h-3.5 hover:text-red-500" />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

function CandidateProfileForm({ profile, onSaved }) {
  const [skills, setSkills] = useState(profile?.skills || [])
  const [cvFile, setCvFile] = useState(null)
  const [uploadingCV, setUploadingCV] = useState(false)
  const [saving, setSaving] = useState(false)
  const cvRef = useRef()

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      headline: profile?.headline || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      linkedin: profile?.linkedin || '',
      github: profile?.github || '',
      experience_years: profile?.experience_years || 0,
      desired_salary_min: profile?.desired_salary_min || '',
      desired_salary_max: profile?.desired_salary_max || '',
      open_to_work: profile?.open_to_work ?? true,
    }
  })

  const handleCVUpload = async () => {
    if (!cvFile) return
    setUploadingCV(true)
    try {
      await authAPI.uploadCV(cvFile)
      toast.success('CV uploaded and indexed for AI matching!')
      setCvFile(null)
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'CV upload failed')
    } finally {
      setUploadingCV(false)
    }
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await authAPI.updateCandidateProfile({ ...data, skills })
      toast.success('Profile updated!')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* CV Section */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Your CV</h2>
        {profile?.cv_url ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl mb-4">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800">CV on file</p>
              <p className="text-xs text-green-600">Used for AI matching and applications</p>
            </div>
            <a href={profile.cv_url} target="_blank" rel="noreferrer"
              className="btn-secondary text-xs border-green-200 text-green-700 hover:bg-green-100 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> View
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">No CV uploaded yet. Add one to unlock AI matching.</p>
          </div>
        )}

        <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-colors">
          <UploadCloud className="w-7 h-7 text-gray-400" />
          <p className="text-sm text-gray-500 text-center">
            {cvFile ? cvFile.name : 'Click to upload PDF, DOCX, or TXT'}
          </p>
          <input type="file" className="hidden" accept=".pdf,.docx,.txt" ref={cvRef}
            onChange={(e) => setCvFile(e.target.files[0])} />
        </label>

        {cvFile && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600 flex-1 truncate">{cvFile.name}</span>
            <button type="button" onClick={() => setCvFile(null)} className="text-gray-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
            <button type="button" onClick={handleCVUpload} disabled={uploadingCV} className="btn-primary text-sm">
              {uploadingCV ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading…</span>
              ) : 'Upload CV'}
            </button>
          </div>
        )}
      </div>

      {/* Personal info */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 text-lg">Personal Details</h2>
        <div>
          <label className="label">Professional Headline</label>
          <input className="input" placeholder="e.g. Full-Stack Developer | React & Python"
            {...register('headline')} />
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea rows={4} className="input resize-none" placeholder="Tell employers about yourself…"
            {...register('bio')} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="London, UK" {...register('location')} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="+44 7700 900000" {...register('phone')} />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Website</label>
            <input className="input" placeholder="https://yoursite.com" {...register('website')} />
          </div>
          <div>
            <label className="label">LinkedIn</label>
            <input className="input" placeholder="linkedin.com/in/you" {...register('linkedin')} />
          </div>
          <div>
            <label className="label">GitHub</label>
            <input className="input" placeholder="github.com/you" {...register('github')} />
          </div>
        </div>
        <div>
          <label className="label">Years of Experience</label>
          <input type="number" min={0} max={50} className="input max-w-xs"
            {...register('experience_years', { valueAsNumber: true })} />
        </div>
      </div>

      {/* Skills */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">Skills</h2>
        <p className="text-sm text-gray-500 mb-3">These are used for AI job matching</p>
        <SkillsInput skills={skills} onChange={setSkills} />
      </div>

      {/* Job preferences */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 text-lg">Job Preferences</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Min Expected Salary (£)</label>
            <input type="number" className="input" placeholder="40000" {...register('desired_salary_min')} />
          </div>
          <div>
            <label className="label">Max Expected Salary (£)</label>
            <input type="number" className="input" placeholder="60000" {...register('desired_salary_max')} />
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-brand-600" {...register('open_to_work')} />
          <span className="text-sm text-gray-700 font-medium">Open to work — visible to recruiters</span>
        </label>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </span>
          ) : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}

function RecruiterProfileForm({ profile, onSaved }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit } = useForm({
    defaultValues: {
      company_name: profile?.company_name || '',
      company_description: profile?.company_description || '',
      company_website: profile?.company_website || '',
      company_size: profile?.company_size || '',
      industry: profile?.industry || '',
      location: profile?.location || '',
      phone: profile?.phone || '',
      linkedin: profile?.linkedin || '',
    }
  })

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await authAPI.updateRecruiterProfile(data)
      toast.success('Company profile updated!')
      onSaved()
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 text-lg">Company Details</h2>
        <div>
          <label className="label">Company Name *</label>
          <input className="input" {...register('company_name', { required: true })} />
        </div>
        <div>
          <label className="label">About the Company</label>
          <textarea rows={4} className="input resize-none" placeholder="Describe your company, culture, and mission…"
            {...register('company_description')} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Industry</label>
            <input className="input" placeholder="Technology, Finance…" {...register('industry')} />
          </div>
          <div>
            <label className="label">Company Size</label>
            <select className="input" {...register('company_size')}>
              <option value="">Select…</option>
              <option value="1-10">1–10 employees</option>
              <option value="11-50">11–50 employees</option>
              <option value="51-200">51–200 employees</option>
              <option value="201-1000">201–1,000 employees</option>
              <option value="1000+">1,000+ employees</option>
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Headquarters</label>
            <input className="input" placeholder="London, UK" {...register('location')} />
          </div>
          <div>
            <label className="label">Website</label>
            <input className="input" placeholder="https://company.com" {...register('company_website')} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">LinkedIn</label>
            <input className="input" placeholder="linkedin.com/company/…" {...register('linkedin')} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="+44 20 0000 0000" {...register('phone')} />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </span>
          ) : 'Save Company Profile'}
        </button>
      </div>
    </form>
  )
}

export default function Profile() {
  const { user, profile, isCandidate, isRecruiter, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(!profile)

  useEffect(() => {
    if (!profile) {
      refreshProfile()
    } else {
      setLoading(false)
    }
  }, [profile])

  if (loading) return (
    <div className="page-container py-16 flex justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  )

  return (
    <div className="page-container py-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center">
          {isCandidate
            ? <User className="w-8 h-8 text-brand-600" />
            : <Building2 className="w-8 h-8 text-brand-600" />}
        </div>
        <div>
          <h1 className="section-title">{user?.full_name}</h1>
          <p className="text-gray-500 capitalize">{user?.role} · {user?.email}</p>
        </div>
      </div>

      {isCandidate && <CandidateProfileForm profile={profile} onSaved={refreshProfile} />}
      {isRecruiter && <RecruiterProfileForm profile={profile} onSaved={refreshProfile} />}
    </div>
  )
}
