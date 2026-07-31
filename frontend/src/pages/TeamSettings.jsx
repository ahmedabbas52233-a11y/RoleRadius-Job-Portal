import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import {
  Building2, Users, Copy, Check, Plus, LogIn, LogOut, Crown, Shield,
  Eye, UserMinus, ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from '../components/ConfirmDialog'

const ROLE_META = {
  owner:  { label: 'Owner',  color: '#92400e', bg: '#fef3c7', Icon: Crown },
  admin:  { label: 'Admin',  color: '#1e40af', bg: '#dbeafe', Icon: Shield },
  member: { label: 'Member', color: '#374151', bg: '#f3f4f6', Icon: Users },
  viewer: { label: 'Viewer', color: '#6b7280', bg: '#f3f4f6', Icon: Eye },
}

const ASSIGNABLE_ROLES = ['admin', 'member', 'viewer']

function TeammateRow({ teammate, myRole, myUserId, onRemoved, onRoleChanged }) {
  const [changing, setChanging] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const meta = ROLE_META[teammate.role] || ROLE_META.member
  const isSelf = teammate.id === myUserId
  const isOwner = teammate.role === 'owner'
  const iAmOwner = myRole === 'owner'
  const iAmAdmin = myRole === 'admin'
  const canRemove = !isSelf && !isOwner && (iAmOwner || (iAmAdmin && teammate.role !== 'admin'))
  const canChangeRole = iAmOwner && !isSelf && !isOwner

  const changeRole = async (role) => {
    setChanging(true)
    setRoleMenuOpen(false)
    try {
      await authAPI.updateTeammateRole(teammate.id, role)
      onRoleChanged()
      toast.success(`${teammate.full_name} is now ${role}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not update role')
    } finally {
      setChanging(false)
    }
  }

  const remove = async () => {
    setRemoving(true)
    try {
      await authAPI.removeTeammate(teammate.id)
      onRemoved()
      toast.success(`${teammate.full_name} removed from the team`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not remove teammate')
    } finally {
      setRemoving(false)
      setConfirmRemove(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)' }}>
            {teammate.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>
              {teammate.full_name}{isSelf && ' (you)'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{teammate.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {canChangeRole ? (
            <div className="relative">
              <button onClick={() => setRoleMenuOpen(!roleMenuOpen)} disabled={changing}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50"
                style={{ background: meta.bg, color: meta.color }}>
                <meta.Icon className="w-3 h-3" aria-hidden="true" />{meta.label}
                <ChevronDown className="w-3 h-3" aria-hidden="true" />
              </button>
              {roleMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-10 rounded-xl shadow-lg py-1 min-w-[120px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <button key={r} onClick={() => changeRole(r)}
                      className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--surface-2)]"
                      style={{ color: r === teammate.role ? 'var(--primary)' : 'var(--text-2)' }}>
                      {ROLE_META[r].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: meta.bg, color: meta.color }}>
              <meta.Icon className="w-3 h-3" aria-hidden="true" />{meta.label}
            </span>
          )}
          {canRemove && (
            <button onClick={() => setConfirmRemove(true)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" aria-label={`Remove ${teammate.full_name}`}>
              <UserMinus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmRemove}
        title="Remove teammate?"
        message={`${teammate.full_name} will lose access to every job on this team immediately.`}
        confirmLabel="Remove"
        danger
        loading={removing}
        onConfirm={remove}
        onCancel={() => setConfirmRemove(false)}
      />
    </>
  )
}

function CreateOrJoinPrompt({ onDone }) {
  const [mode, setMode] = useState(null) // 'create' | 'join' | null
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)

  const create = async () => {
    if (!name.trim()) { toast.error('Company name is required'); return }
    setLoading(true)
    try {
      await authAPI.createCompany({ name, description })
      toast.success('Company created!')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || err.response?.data?.detail || 'Could not create company')
    } finally {
      setLoading(false)
    }
  }

  const join = async () => {
    if (!joinCode.trim()) { toast.error('Enter a join code'); return }
    setLoading(true)
    try {
      await authAPI.joinCompany(joinCode.trim())
      toast.success('Joined the team!')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.join_code || err.response?.data?.detail || 'Could not join company')
    } finally {
      setLoading(false)
    }
  }

  if (!mode) {
    return (
      <div className="card p-8 text-center">
        <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-3)' }} aria-hidden="true" />
        <h2 className="font-bold mb-1" style={{ color: 'var(--text-1)' }}>You&apos;re recruiting solo</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>
          Create a team so colleagues can see and manage your jobs together, or join one with a code.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setMode('create')} className="btn-primary"><Plus className="w-4 h-4" aria-hidden="true" /> Create a team</button>
          <button onClick={() => setMode('join')} className="btn-secondary"><LogIn className="w-4 h-4" aria-hidden="true" /> Join with a code</button>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="card p-6">
        <h2 className="font-bold mb-3" style={{ color: 'var(--text-1)' }}>Create a team</h2>
        <label className="label" htmlFor="company-name">Company name</label>
        <input id="company-name" value={name} onChange={(e) => setName(e.target.value)} className="input mb-3" placeholder="Acme Recruiting" />
        <label className="label" htmlFor="company-desc">Description (optional)</label>
        <textarea id="company-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="input h-20 resize-none mb-4" placeholder="What your team recruits for…" />
        <div className="flex gap-2">
          <button onClick={create} disabled={loading} className="btn-primary">{loading ? 'Creating…' : 'Create'}</button>
          <button onClick={() => setMode(null)} className="btn-ghost">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h2 className="font-bold mb-3" style={{ color: 'var(--text-1)' }}>Join a team</h2>
      <label className="label" htmlFor="join-code">Join code</label>
      <input id="join-code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} className="input mb-4 uppercase tracking-widest font-mono" placeholder="K3F9QX2P" maxLength={8} />
      <div className="flex gap-2">
        <button onClick={join} disabled={loading} className="btn-primary">{loading ? 'Joining…' : 'Join'}</button>
        <button onClick={() => setMode(null)} className="btn-ghost">Cancel</button>
      </div>
    </div>
  )
}

export default function TeamSettings() {
  const { user } = useAuth()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    authAPI.getMyCompany()
      .then(({ data }) => setCompany(data))
      .catch((err) => { if (err.response?.status === 404) setCompany(null) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const copyCode = () => {
    navigator.clipboard.writeText(company.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const leave = async () => {
    setLeaving(true)
    try {
      await authAPI.leaveCompany()
      toast.success('You have left the team')
      setCompany(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not leave team')
    } finally {
      setLeaving(false)
      setLeaveConfirm(false)
    }
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
        <div className="page-container py-10">
          <div className="skeleton h-40 rounded-2xl" aria-hidden="true" />
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#4c1d95)', padding: '32px 0 56px' }}>
        <div className="page-container">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
              <Users className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'rgba(165,180,252,.8)' }}>Recruiting team</p>
              <h1 className="font-extrabold text-white" style={{ fontSize: 'clamp(1.25rem,3vw,1.75rem)', letterSpacing: '-.02em' }}>Team Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container max-w-2xl" style={{ marginTop: '-32px', paddingBottom: '40px' }}>
        {!company ? (
          <CreateOrJoinPrompt onDone={load} />
        ) : (
          <>
            <div className="card p-6 mb-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-bold text-lg" style={{ color: 'var(--text-1)' }}>{company.name}</h2>
                  {company.description && <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{company.description}</p>}
                </div>
                <span className="badge text-xs" style={{ background: ROLE_META[company.my_role]?.bg, color: ROLE_META[company.my_role]?.color }}>
                  You&apos;re {ROLE_META[company.my_role]?.label || company.my_role}
                </span>
              </div>

              {company.can_manage_teammates && (
                <div className="mt-4 p-3 rounded-xl flex items-center justify-between gap-3" style={{ background: 'var(--surface-2)' }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Invite code</p>
                    <p className="font-mono font-bold tracking-widest" style={{ color: 'var(--text-1)' }}>{company.join_code}</p>
                  </div>
                  <button onClick={copyCode} className="btn-secondary text-xs px-3 py-1.5">
                    {copied ? <><Check className="w-3.5 h-3.5" aria-hidden="true" /> Copied</> : <><Copy className="w-3.5 h-3.5" aria-hidden="true" /> Copy</>}
                  </button>
                </div>
              )}

              <button onClick={() => setLeaveConfirm(true)} className="flex items-center gap-1.5 text-xs font-semibold mt-4" style={{ color: '#dc2626' }}>
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" /> Leave this team
              </button>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold mb-3" style={{ color: 'var(--text-1)' }}>
                Teammates <span style={{ color: 'var(--text-3)' }}>({company.teammates?.length || 0})</span>
              </h3>
              <div className="space-y-2">
                {company.teammates?.map((t) => (
                  <TeammateRow
                    key={t.id}
                    teammate={t}
                    myRole={company.my_role}
                    myUserId={user?.id}
                    onRemoved={load}
                    onRoleChanged={load}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={leaveConfirm}
        title="Leave this team?"
        message="You'll immediately lose access to every teammate's job postings and applicants. You can rejoin later with the team's join code."
        confirmLabel="Leave Team"
        danger
        loading={leaving}
        onConfirm={leave}
        onCancel={() => setLeaveConfirm(false)}
      />
    </div>
  )
}
