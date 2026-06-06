import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Prevent React 18 StrictMode from calling me() twice in development.
  // StrictMode intentionally double-invokes effects — the ref ensures we
  // only make one real network request on mount.
  const hasFetched = useRef(false)

  const fetchProfile = useCallback(async (role) => {
    try {
      if (role === 'candidate') {
        const { data } = await authAPI.getCandidateProfile()
        setProfile(data)
      } else if (role === 'recruiter') {
        const { data } = await authAPI.getRecruiterProfile()
        setProfile(data)
      }
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    // Guard against StrictMode double-invocation
    if (hasFetched.current) return
    hasFetched.current = true

    authAPI.me()
      .then(({ data }) => {
        setUser(data)
        fetchProfile(data.role)
      })
      .catch(() => {
        // Normal for unauthenticated visitors — not an error.
        // ProtectedRoute handles redirecting private routes to /login.
        setUser(null)
        setProfile(null)
      })
      .finally(() => setLoading(false))
  }, [fetchProfile])

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    setUser(data.user)
    await fetchProfile(data.user.role)
    return data.user
  }, [fetchProfile])

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData)
    setUser(data.user)
    await fetchProfile(data.user.role)
    return data.user
  }, [fetchProfile])

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch {}
    setUser(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(() => {
    if (user) fetchProfile(user.role)
  }, [user, fetchProfile])

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAuthenticated: !!user,
      isCandidate:     user?.role === 'candidate',
      isRecruiter:     user?.role === 'recruiter',
      login,
      register,
      logout,
      refreshProfile,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
