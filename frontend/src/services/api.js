/**
 * Axios API service — cookie-based JWT auth.
 *
 * Key fix: the refresh interceptor no longer calls window.location.href.
 * Redirecting in the interceptor caused an infinite loop:
 *   me() 401 → try refresh → refresh 401 → redirect to /login
 *   → page reload → me() 401 → ... forever
 *
 * Instead, we simply reject the promise. ProtectedRoute handles redirects
 * for private pages. Public pages (home, jobs) work fine without auth.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// CSRF token for Django (reads the readable cookie, not the httpOnly one)
function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match ? match[1] : ''
}

api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase() || ''
  if (!['get', 'head', 'options'].includes(method)) {
    config.headers['X-CSRFToken'] = getCsrfToken()
  }
  return config
})

// ── In-flight GET request dedup ────────────────────────────────────────────────
// If the same GET (same URL + same params) is already in flight, return the
// existing promise instead of firing a second identical network request.
// This only collapses concurrent duplicate calls — once a response lands the
// entry is cleared immediately, so nothing is ever served stale. It changes
// *when* a request resolves, never *what* it resolves to. Wraps api.get
// directly so every existing *API.xxx() call below benefits with zero changes.
const inFlightGetRequests = new Map()
const _rawGet = api.get.bind(api)

api.get = (url, config = {}) => {
  const key = `${url}?${JSON.stringify(config.params || {})}`
  const pending = inFlightGetRequests.get(key)
  if (pending) return pending

  const promise = _rawGet(url, config).finally(() => {
    inFlightGetRequests.delete(key)
  })
  inFlightGetRequests.set(key, promise)
  return promise
}

// Auto-refresh on 401 — but NEVER redirect from here
let isRefreshing = false
let failedQueue  = []

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  )
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // Don't retry auth endpoints themselves — would create loops
    const isAuthEndpoint = original.url?.includes('/auth/me') ||
                           original.url?.includes('/auth/token/refresh')

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(original))
      }

      original._retry = true
      isRefreshing = true

      try {
        await axios.post(
          `${BASE_URL}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        )
        processQueue(null)
        return api(original)
      } catch (err) {
        processQueue(err)
        // Do NOT redirect here — let AuthContext + ProtectedRoute handle it
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:  (data)  => api.post('/auth/register/', data),
  login:     (data)  => api.post('/auth/login/', data),
  logout:    ()      => api.post('/auth/logout/'),
  me:        ()      => api.get('/auth/me/'),
  updateMe:  (data)  => api.patch('/auth/me/', data),
  changePassword: (data) => api.post('/auth/me/change-password/', data),

  verifyEmail:        (token) => api.get(`/auth/verify-email/${token}/`),
  resendVerification: ()      => api.post('/auth/verify-email/resend/'),

  requestPasswordReset: (email) => api.post('/auth/password-reset/', { email }),
  confirmPasswordReset: (data)  => api.post('/auth/password-reset/confirm/', data),

  getCandidateProfile:    ()     => api.get('/auth/profile/candidate/'),
  updateCandidateProfile: (data) => api.patch('/auth/profile/candidate/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  uploadCV: (file) => {
    const form = new FormData()
    form.append('cv', file)
    return api.post('/auth/profile/candidate/cv/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getRecruiterProfile:    ()     => api.get('/auth/profile/recruiter/'),
  updateRecruiterProfile: (data) => api.patch('/auth/profile/recruiter/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  getPublicCandidate: (userId) => api.get(`/auth/candidates/${userId}/`),
  getPublicRecruiter: (userId) => api.get(`/auth/recruiters/${userId}/`),
}

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobsAPI = {
  list:         (params) => api.get('/jobs/', { params }),
  detail:       (id)     => api.get(`/jobs/${id}/`),
  myJobs:       (params) => api.get('/jobs/my/', { params }),
  create:       (data)   => api.post('/jobs/create/', data),
  update:       (id, data) => api.patch(`/jobs/${id}/update/`, data),
  delete:       (id)     => api.delete(`/jobs/${id}/delete/`),
  toggleActive: (id)     => api.post(`/jobs/${id}/toggle/`),
  saveJob:      (id)     => api.post(`/jobs/${id}/save/`),
  savedJobs:    ()       => api.get('/jobs/saved/'),
}

// ── Applications ──────────────────────────────────────────────────────────────
export const applicationsAPI = {
  apply: (jobId, data) => api.post(`/applications/apply/${jobId}/`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  myApplications:      (params) => api.get('/applications/my/', { params }),
  myApplicationDetail: (id)     => api.get(`/applications/my/${id}/`),
  withdraw:            (id)     => api.post(`/applications/my/${id}/withdraw/`),
  candidateStats:      ()       => api.get('/applications/my/stats/'),
  jobApplications:     (jobId, params) => api.get(`/applications/job/${jobId}/`, { params }),
  updateStatus:        (id, data)      => api.patch(`/applications/${id}/status/`, data),
  recruiterStats:      ()       => api.get('/applications/recruiter/stats/'),
}

// ── Matching ──────────────────────────────────────────────────────────────────
export const matchingAPI = {
  matchedJobs:       (params)        => api.get('/matching/jobs/', { params }),
  matchedCandidates: (jobId, params) => api.get(`/matching/candidates/${jobId}/`, { params }),
}

export default api
