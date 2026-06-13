import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import { User, Upload, Plus, X, Save, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const SKILL_SUGGESTIONS = ['Python', 'JavaScript', 'React', 'Django', 'TypeScript',
  'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'Machine Learning', 'SQL', 'Git',
  'Figma', 'Product Management', 'Marketing', 'Data Analysis']

export default function Profile() {
  const { user, profile, refreshProfile, isCandidate, isRecruiter } = useAuth()
  const [form, setForm]       = useState({})
  const [skills, setSkills]   = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [cvFile, setCvFile]   = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchProfile = isCandidate
      ? authAPI.getCandidateProfile()
      : authAPI.getRecruiterProfile()

    fetchProfile.then(({ data }) => {
      setForm(data)
      if (isCandidate) setSkills(data.skills || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user, isCandidate])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      const payload = isCandidate ? { ...form, skills } : form
      if (isCandidate) await authAPI.updateCandidateProfile(payload)
      else await authAPI.updateRecruiterProfile(payload)
      setSaved(true)
      refreshProfile()
      toast.success('Profile saved!')
      setTimeout(() => setSaved(false), 3000)
    } catch {
      toast.error('Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const addSkill = (skill) => {
    const trimmed = skill.trim()
    if (trimmed && !skills.includes(trimmed)) setSkills(s => [...s, trimmed])
    setSkillInput('')
  }

  const removeSkill = (skill) => setSkills(s => s.filter(sk => sk !== skill))

  const handleCvUpload = async () => {
    if (!cvFile) return
    setUploading(true)
    try {
      await authAPI.uploadCV(cvFile)
      toast.success('CV uploaded and indexed for AI matching!')
      setCvFile(null)
      refreshProfile()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return (
    <div className="page-container py-10 flex justify-center">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="page-container py-6 sm:py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isCandidate ? 'Keep your profile up to date for better AI matching' : 'Update your company information'}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Avatar header */}
        <div className="card p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="text-brand-700 font-bold text-xl">
              {user?.full_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.full_name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className={`badge mt-1 ${user?.is_email_verified ? 'badge-green' : 'badge-orange'}`}>
              {user?.is_email_verified ? '✓ Email verified' : '⚠ Email not verified'}
            </span>
          </div>
        </div>

        {isCandidate && (
          <>
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Professional Details</h2>
              <div>
                <label className="label">Headline</label>
                <input value={form.headline || ''} onChange={e => setForm(f => ({...f, headline: e.target.value}))}
                  className="input" placeholder="e.g. Full-Stack Developer | React & Django" />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea value={form.bio || ''} onChange={e => setForm(f => ({...f, bio: e.target.value}))}
                  className="input h-24 resize-none" placeholder="Tell recruiters about yourself..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Location</label>
                  <input value={form.location || ''} onChange={e => setForm(f => ({...f, location: e.target.value}))}
                    className="input" placeholder="e.g. London, UK" />
                </div>
                <div>
                  <label className="label">Years of Experience</label>
                  <input type="number" min="0" max="50" value={form.experience_years || 0}
                    onChange={e => setForm(f => ({...f, experience_years: parseInt(e.target.value) || 0}))}
                    className="input" />
                </div>
              </div>
              <div>
                <label className="label flex items-center justify-between">
                  Open to work
                  <input type="checkbox" checked={!!form.open_to_work}
                    onChange={e => setForm(f => ({...f, open_to_work: e.target.checked}))}
                    className="w-4 h-4 accent-brand-600" aria-label="Open to work status" />
                </label>
              </div>
            </div>

            {/* Skills */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map(skill => (
                  <span key={skill} className="flex items-center gap-1 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium border border-brand-200">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}
                      className="hover:text-red-500 transition-colors" aria-label={`Remove ${skill}`}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                  className="input flex-1" placeholder="Add a skill (Enter to add)" />
                <button type="button" onClick={() => addSkill(skillInput)} className="btn-secondary px-3">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <p className="w-full text-xs text-gray-400 mb-1">Quick add:</p>
                {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 8).map(s => (
                  <button key={s} type="button" onClick={() => addSkill(s)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-700 border border-gray-100 transition-colors">
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* CV Upload */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-1">CV / Resume</h2>
              <p className="text-xs text-gray-500 mb-4">Upload your CV to improve AI match accuracy. PDF, DOCX, or TXT. Max 5 MB.</p>
              {profile?.cv && (
                <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  CV uploaded and indexed for matching
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-all text-sm text-gray-500">
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  {cvFile ? cvFile.name : 'Choose file…'}
                  <input type="file" accept=".pdf,.docx,.txt" className="sr-only"
                    onChange={e => setCvFile(e.target.files?.[0] || null)}
                    aria-label="Upload CV file" />
                </label>
                {cvFile && (
                  <button type="button" onClick={handleCvUpload} disabled={uploading}
                    className="btn-primary whitespace-nowrap">
                    {uploading ? 'Uploading…' : 'Upload CV'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {isRecruiter && (
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Company Details</h2>
            <div>
              <label className="label">Company Name</label>
              <input value={form.company_name || ''} onChange={e => setForm(f => ({...f, company_name: e.target.value}))}
                className="input" placeholder="e.g. TechCorp Solutions" />
            </div>
            <div>
              <label className="label">Industry</label>
              <input value={form.industry || ''} onChange={e => setForm(f => ({...f, industry: e.target.value}))}
                className="input" placeholder="e.g. Software / Technology" />
            </div>
            <div>
              <label className="label">Company Description</label>
              <textarea value={form.company_description || ''} onChange={e => setForm(f => ({...f, company_description: e.target.value}))}
                className="input h-24 resize-none" placeholder="Describe your company..." />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Location</label>
                <input value={form.location || ''} onChange={e => setForm(f => ({...f, location: e.target.value}))}
                  className="input" placeholder="e.g. London, UK" />
              </div>
              <div>
                <label className="label">Company Size</label>
                <select value={form.company_size || ''} onChange={e => setForm(f => ({...f, company_size: e.target.value}))}
                  className="input">
                  <option value="">Select size</option>
                  {['1-10','11-50','51-200','201-1000','1001-5000','5000+'].map(s => (
                    <option key={s} value={s}>{s} employees</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto justify-center">
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </span>
          ) : saved ? (
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Saved!</span>
          ) : (
            <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Profile</span>
          )}
        </button>
      </form>
    </div>
  )
}
