import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, user }   = useAuth()
  const navigate           = useNavigate()
  const location           = useLocation()
  const redirectTo         = location.state?.from || '/list'

  const [fields, setFields] = useState({ username: '', password: '' })
  const [error,  setError]  = useState('')
  const [loading, setLoad]  = useState(false)
  const [showPass, setShow] = useState(false)

  // If already authenticated, redirect
  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true })
  }, [user, navigate, redirectTo])

  if (user) return null

  const handleChange = e =>
    setFields(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoad(true)

    await new Promise(r => setTimeout(r, 420))

    const ok = login(fields.username.trim(), fields.password)
    if (ok) {
      navigate(redirectTo, { replace: true })
    } else {
      setError('Invalid credentials. Try testuser / Test123.')
      setLoad(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#08080f' }}>

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #08080f 100%)', borderRight: '1px solid #1e1e30' }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#1e1e30 1px, transparent 1px), linear-gradient(90deg, #1e1e30 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Amber glow orb */}
        <div
          className="absolute"
          style={{
            width: 360, height: 360, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
            top: '20%', left: '10%', pointerEvents: 'none',
          }}
        />

        <div className="relative z-10">
          <span
            className="text-xs tracking-[0.3em] uppercase"
            style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono' }}
          >
            JOTISH · v1.0.0
          </span>
        </div>

        <div className="relative z-10 fade-up">
          <h1
            className="text-6xl font-extrabold leading-none mb-6"
            style={{ fontFamily: 'Syne', color: '#e8e8f0', letterSpacing: '-0.03em' }}
          >
            <span style={{ color: '#f59e0b' }}>Jotish</span><br />
            Employee<br />
            <span style={{ color: '#f59e0b' }}>Insights</span><br />
            Dashboard
          </h1>
          <p style={{ color: '#8888aa', fontFamily: 'DM Sans', fontSize: '1rem', lineHeight: 1.7, maxWidth: 340 }}>
            Realtime workforce intelligence. Identity verification. Geospatial analytics all in one secure surface.
          </p>
        </div>

        <div className="relative z-10" style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#4a4a6a' }}>
          <div>SYS_STATUS: <span style={{ color: '#06b6d4' }}>NOMINAL</span></div>
          <div>BUILD: <span style={{ color: '#f59e0b' }}>2026.03.13-rc1</span></div>
        </div>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md fade-up" style={{ animationDelay: '0.1s' }}>

          {/* Header */}
          <div className="mb-10">
            <div
              className="text-xs mb-4 tracking-[0.25em] uppercase"
              style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono' }}
            >
              Authentication Required
            </div>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: 'Syne', color: '#e8e8f0', letterSpacing: '-0.02em' }}
            >
              Sign in to continue
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="space-y-5">

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs mb-2 tracking-widest uppercase"
                  style={{ color: '#8888aa', fontFamily: 'JetBrains Mono' }}
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={fields.username}
                  onChange={handleChange}
                  placeholder="testuser"
                  className="w-full px-4 py-3 text-sm outline-none transition-all duration-200"
                  style={{
                    background: '#0f0f1a',
                    border: '1px solid #1e1e30',
                    borderRadius: 6,
                    color: '#e8e8f0',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.875rem',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' }}
                  onBlur={e  => { e.target.style.borderColor = '#1e1e30'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs mb-2 tracking-widest uppercase"
                  style={{ color: '#8888aa', fontFamily: 'JetBrains Mono' }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={fields.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 text-sm outline-none transition-all duration-200"
                    style={{
                      background: '#0f0f1a',
                      border: '1px solid #1e1e30',
                      borderRadius: 6,
                      color: '#e8e8f0',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '0.875rem',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' }}
                    onBlur={e  => { e.target.style.borderColor = '#1e1e30'; e.target.style.boxShadow = 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showPass ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="text-xs px-4 py-3"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 6,
                    color: '#f87171',
                    fontFamily: 'JetBrains Mono',
                  }}
                >
                  ⚠ {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-semibold tracking-widest uppercase transition-all duration-200"
                style={{
                  background: loading ? '#2a2a3a' : '#f59e0b',
                  color: loading ? '#8888aa' : '#08080f',
                  border: 'none',
                  borderRadius: 6,
                  fontFamily: 'JetBrains Mono',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.1em',
                }}
                onMouseEnter={e => { if (!loading) e.target.style.background = '#fbbf24' }}
                onMouseLeave={e => { if (!loading) e.target.style.background = '#f59e0b' }}
              >
                {loading ? '↻ Authenticating…' : 'Authenticate →'}
              </button>
            </div>
          </form>

          <p
            className="mt-8 text-center text-xs"
            style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono' }}
          >
            <span style={{ color: '#f59e0b' }}>Jotish</span> · v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}