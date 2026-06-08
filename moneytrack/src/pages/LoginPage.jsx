import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Icon, Field, Input, Segmented } from '../components/MoneyUI'

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
    setLoading(true); setError(''); setSuccess('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message === 'Invalid login credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้องครับ' : error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      if (error) setError(error.message)
      else setSuccess('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีครับ')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-grad)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,96,200,.18), transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,168,232,.14), transparent 70%)' }} />

      <div className="mt-anim" style={{ background: 'var(--surface)', borderRadius: 28, padding: '34px 30px', width: '100%', maxWidth: 410, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-2)', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 14px 26px -10px rgba(26,60,143,.8)', marginBottom: 14 }}><Icon n="ti-wallet" s={28} /></div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>MoneyTrack</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 4 }}>{mode === 'login' ? 'ยินดีต้อนรับกลับมาครับ 👋' : 'เริ่มจัดการการเงินของคุณ'}</div>
        </div>

        <Segmented value={mode} onChange={(m) => { setMode(m); setError(''); setSuccess('') }}
          options={[{ value: 'login', label: 'เข้าสู่ระบบ' }, { value: 'register', label: 'สมัครสมาชิก' }]} style={{ marginBottom: 22 }} />

        {error && <div style={{ background: 'var(--red-soft)', color: 'var(--red-ink)', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}><Icon n="ti-alert-circle" s={15} /> {error}</div>}
        {success && <div style={{ background: 'var(--teal-soft)', color: 'var(--teal-ink)', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}><Icon n="ti-check" s={15} /> {success}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && <Field label="ชื่อ-นามสกุล"><Input type="text" placeholder="กรอกชื่อของคุณ" value={name} onChange={e => setName(e.target.value)} required /></Field>}
          <Field label="อีเมล"><Input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
          <Field label="รหัสผ่าน"><Input type="password" placeholder={mode === 'register' ? 'อย่างน้อย 6 ตัวอักษร' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></Field>
          <button type="submit" disabled={loading} className="mt-btn" style={{ width: '100%', border: 'none', background: 'var(--grad)', color: '#fff', borderRadius: 14, padding: '13px 0', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', marginTop: 6, boxShadow: '0 12px 24px -12px rgba(26,60,143,.9)', opacity: loading ? .75 : 1 }}>
            {loading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'mt-spin .7s linear infinite' }} />กำลังดำเนินการ…</span> : (mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: 'var(--muted-2)', fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />หรือ<div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <button onClick={handleGoogle} className="mt-btn" style={{ width: '100%', background: 'var(--surface-2)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 14, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, fontFamily: 'inherit' }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          เข้าสู่ระบบด้วย Google
        </button>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'var(--muted-2)' }}><Icon n="ti-lock" s={13} /> ข้อมูลของคุณปลอดภัยและเป็นส่วนตัว</div>
      </div>
    </div>
  )
}
