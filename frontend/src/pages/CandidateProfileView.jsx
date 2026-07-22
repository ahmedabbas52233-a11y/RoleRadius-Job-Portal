import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import {
  ArrowLeft, MapPin, Briefcase, Mail, Phone, Linkedin, Github, Globe,
  FileText, GraduationCap, DollarSign,
} from 'lucide-react'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
        <Icon className="w-4 h-4" style={{ color: 'var(--primary)' }} aria-hidden="true" />
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function CandidateProfileView() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    authAPI.getPublicCandidate(id)
      .then(({ data }) => setProfile(data))
      .catch((err) => {
        if (err.response?.status === 404) setError('This candidate profile is not available.')
        else setError('Could not load this profile.')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="page-container py-10 flex justify-center" style={{ background: 'var(--surface-2)' }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--primary-light)', borderTopColor: 'var(--primary)' }} />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
        <div className="page-container py-16 text-center max-w-md mx-auto">
          <p className="mb-4" style={{ color: 'var(--text-2)' }}>{error || 'Profile not found.'}</p>
          <Link to="/recruiter/dashboard" className="btn-secondary"><ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  const { user, education = [], experience = [] } = profile

  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
      <div className="page-container py-6 sm:py-8 max-w-2xl mx-auto">
        <Link to="/recruiter/dashboard" className="flex items-center gap-1.5 text-sm font-semibold mb-4" style={{ color: 'var(--primary)' }}>
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Back to Dashboard
        </Link>

        <div className="card p-6 mb-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-extrabold text-xl" style={{ color: 'var(--text-1)' }}>{user?.full_name}</h1>
                <span className="badge" style={profile.open_to_work ? { background: '#d1fae5', color: '#065f46' } : { background: '#f3f4f6', color: '#6b7280' }}>
                  {profile.open_to_work ? 'Open to work' : 'Not actively looking'}
                </span>
              </div>
              {profile.headline && <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{profile.headline}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs flex-wrap" style={{ color: 'var(--text-3)' }}>
                {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" aria-hidden="true" />{profile.location}</span>}
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" aria-hidden="true" />{profile.experience_years || 0} yrs experience</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <a href={`mailto:${user?.email}`} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
              <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
              <span className="truncate">{user?.email}</span>
            </a>
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" />
                {profile.phone}
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--text-2)' }}>
                <Linkedin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" /> LinkedIn
              </a>
            )}
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--text-2)' }}>
                <Github className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" /> GitHub
              </a>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--text-2)' }}>
                <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--primary)' }} aria-hidden="true" /> Personal site
              </a>
            )}
          </div>

          {profile.cv_url && (
            <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 w-full sm:w-auto justify-center">
              <FileText className="w-4 h-4" aria-hidden="true" /> View / Download CV
            </a>
          )}
        </div>

        {profile.bio && (
          <Section icon={FileText} title="About">
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-2)' }}>{profile.bio}</p>
          </Section>
        )}

        {profile.skills?.length > 0 && (
          <div className="card p-5 mt-5">
            <h2 className="font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-xl text-sm font-medium" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {experience.length > 0 && (
          <div className="mt-5">
            <Section icon={Briefcase} title="Experience">
              <div className="space-y-4">
                {experience.map((exp, i) => (
                  <div key={i} className="pl-3" style={{ borderLeft: '2px solid var(--border)' }}>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{exp.title || exp.role}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{exp.company} {exp.duration ? `· ${exp.duration}` : ''}</p>
                    {exp.description && <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{exp.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {education.length > 0 && (
          <div className="mt-5">
            <Section icon={GraduationCap} title="Education">
              <div className="space-y-3">
                {education.map((ed, i) => (
                  <div key={i}>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{ed.degree || ed.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{ed.institution || ed.school} {ed.year ? `· ${ed.year}` : ''}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {(profile.desired_salary_min || profile.desired_salary_max) && (
          <div className="mt-5">
            <Section icon={DollarSign} title="Salary expectation">
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                {profile.desired_salary_min ? `£${profile.desired_salary_min.toLocaleString()}` : 'Any'}
                {' – '}
                {profile.desired_salary_max ? `£${profile.desired_salary_max.toLocaleString()}` : 'Any'}
              </p>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}
