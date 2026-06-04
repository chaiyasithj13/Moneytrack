import { useState } from 'react'
import { supabase } from '../lib/supabase'

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 420 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, justifyContent: 'center' },
  logoDot: { width: 10, height: 10, background: 'var(--accent)', borderRadius: '50%' },
  logoText: { fontSize: 24, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.5px' },
  title: { fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 },
  sub: { fontSize: 14, color: 'var(--muted)', marginBottom: 24 },
  tabs: { display: 'flex', background: 'var(--bg3)', borderRadius: 10, padding: 3, marginBottom: 24 },
  tab: { flex: 1, padding: '8px 0', border: 'none', background: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: 'var(--muted)', transition: '.2s', fontFamily: 'var(--font)' },
  tabActive: { background: 'var(--bg2)', color: 'var(--primary)', boxShadow: '0 1px 4px rgba(0,0,0,.08)' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' },
  input: { width: '100%', background: 'var(--bg3)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '10px 12px', fontSize: 14, marginBottom: 14, outline: 'none', fontFamily: 'var(--font)' },
  btn: { width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4, letterSpacing: '.3px', fontFamily: 'var(--font)' },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: 'var(--muted)', fontSize: 12 },
  line: { flex: 1, height: 1, background: 'var(--border)' },
  googleBtn: { width: '100%', background: 'var(--bg3)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font)' },
  error: { background: '#fdeaea', border: '1px solid #f5b5b5', color: '#c0392b', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 },
  success: { background: '#e8f8f0', border: '1px solid #9ee5c4', color: '#0b6e4f', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 },
}

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message === 'Invalid login credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้องครับ' : error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } }
      })
      if (error) setError(error.message)
      else setSuccess('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีครับ')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoDot}></div>
          <div style={styles.logoText}>MoneyTrack</div>
        </div>

        <div style={styles.title}>{mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</div>
        <div style={styles.sub}>{mode === 'login' ? 'ยินดีต้อนรับกลับมาครับ' : 'เริ่มจัดการการเงินของคุณ'}</div>

        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(mode === 'login' ? styles.tabActive : {}) }} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>เข้าสู่ระบบ</button>
          <button style={{ ...styles.tab, ...(mode === 'register' ? styles.tabActive : {}) }} onClick={() => { setMode('register'); setError(''); setSuccess('') }}>สมัครสมาชิก</button>
        </div>

        {error && <div style={styles.error}><i className="ti ti-alert-circle" /> {error}</div>}
        {success && <div style={styles.success}><i className="ti ti-check" /> {success}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div>
              <label style={styles.label}>ชื่อ-นามสกุล</label>
              <input style={styles.input} type="text" placeholder="กรอกชื่อของคุณ" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <label style={styles.label}>อีเมล</label>
            <input style={styles.input} type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={styles.label}>รหัสผ่าน</label>
            <input style={styles.input} type="password" placeholder={mode === 'register' ? 'อย่างน้อย 6 ตัวอักษร' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button style={{ ...styles.btn, opacity: loading ? .7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'กำลังดำเนินการ...' : (mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.line} />
          <span>หรือ</span>
          <div style={styles.line} />
        </div>

        <button style={styles.googleBtn} onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          เข้าสู่ระบบด้วย Google
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
          ข้อมูลของคุณปลอดภัยและเป็นส่วนตัว 🔒
        </div>
      </div>
    </div>
  )
}
