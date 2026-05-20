import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Input, Btn, Card, Divider } from '../components/UI'
import { useI18n } from '../lib/i18n'
import { supabase } from '../lib/supabase'

function AuthLayout({ children, title, sub }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px 16px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(120,80,255,0.12) 0%, transparent 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900,
            color: '#c084fc', letterSpacing: 4,
            textShadow: '0 0 30px rgba(192,132,252,0.5)',
          }}>TETRIX</div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, color: 'rgba(180,140,255,0.6)', marginTop: 6, letterSpacing: 2 }}>{title}</div>
          {sub && <div style={{ fontSize: 12, color: 'rgba(180,140,255,0.4)', marginTop: 4 }}>{sub}</div>}
        </div>
        <Card>{children}</Card>
      </div>
    </div>
  )
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await signIn(email, password)
      navigate('/menu')
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  async function handleGoogle() {
    try { await signInWithGoogle() }
    catch (err) { setError(err.message) }
  }

  return (
    <AuthLayout title={t('signIn')} sub="Welcome back, player">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label={t('email')} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        <Input label={t('password')} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        {error && <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center' }}>{error}</div>}
        <Btn onClick={handleSubmit} loading={loading}>{t('enterGrid')}</Btn>
        <div style={{ textAlign: 'right' }}>
          <Link to="/forgot-password" style={{ fontSize: 11, color: 'rgba(180,140,255,0.5)', textDecoration: 'none' }}>{t('forgotPassword')}</Link>
        </div>
        <Divider label="or" />
        <Btn variant="google" onClick={handleGoogle}>
          <span style={{ marginRight: 8 }}>G</span> {t('continueGoogle')}
        </Btn>
        <Btn variant="ghost" onClick={() => navigate('/menu?guest=1')}>{t('playGuest')}</Btn>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(180,140,255,0.4)' }}>
          {t('noAccount')}{' '}
          <Link to="/register" style={{ color: '#c084fc', textDecoration: 'none' }}>Register</Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false) // FIX #11
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()

  function set(key) { return e => setForm(f => ({ ...f, [key]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.username.trim()) return setError(t('username') + ' is required')
    if (form.username.length < 3) return setError(t('username') + ' must be 3+ chars')
    if (form.password !== form.confirm) return setError(t('password') + 's do not match')
    if (form.password.length < 6) return setError(t('password') + ' must be 6+ chars')
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.username.trim())
      navigate('/menu')
    } catch (err) {
      if (err.code === 'CHECK_EMAIL') {
        setEmailSent(true) // FIX #11: show confirmation message instead of error
      } else {
        setError(err.message)
      }
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout title={t('register')} sub={t('leaderboard')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label={t('username')} value={form.username} onChange={set('username')} placeholder="YourCallsign" maxLength={20} />
        <Input label={t('email')} type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
        <Input label={t('password')} type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
        <Input label={t('confirmPassword')} type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" />
        {emailSent && (
          <div style={{ background:'rgba(5,150,105,0.1)', border:'1px solid rgba(5,150,105,0.3)', borderRadius:8, padding:'12px', textAlign:'center', fontSize:12, color:'#34d399' }}>
            {t('emailConfirmRequired')}
          </div>
        )}
        {error && <div style={{ fontSize: 12, color: '#f87171', textAlign: 'center' }}>{error}</div>}
        {!emailSent && <Btn onClick={handleSubmit} loading={loading}>{t('createAccount')}</Btn>}
        {emailSent && <Btn onClick={() => navigate('/login')}>{t('signIn')}</Btn>}
        <Divider label="or" />
        <Btn variant="google" onClick={signInWithGoogle}>
          <span style={{ marginRight: 8 }}>G</span> {t('continueGoogle')}
        </Btn>
        <Btn variant="ghost" onClick={() => navigate('/menu?guest=1')}>{t('playGuest')}</Btn>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(180,140,255,0.4)' }}>
          Have an account?{' '}
          <Link to="/login" style={{ color: '#c084fc', textDecoration: 'none' }}>{t('signIn')}</Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useI18n()
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (err) throw err
      setSent(true)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <AuthLayout title={t('forgotPassword')} sub="We'll send you a link">
      {sent ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📨</div>
          <div style={{ color: '#c084fc', fontFamily: "'Orbitron',sans-serif", fontSize: 12, letterSpacing: 2 }}>{t('checkEmail')}</div>
          <div style={{ fontSize: 12, color: 'rgba(180,140,255,0.5)', marginTop: 8 }}>{t('resetSent')} {email}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label={t('email')} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          {error && <div style={{ fontSize: 12, color: '#f87171' }}>{error}</div>}
          <Btn onClick={handleSubmit} loading={loading}>{t('sendResetLink')}</Btn>
          <Link to="/login" style={{ textAlign: 'center', fontSize: 12, color: 'rgba(180,140,255,0.5)', textDecoration: 'none' }}>{t('back')}</Link>
        </div>
      )}
    </AuthLayout>
  )
}
