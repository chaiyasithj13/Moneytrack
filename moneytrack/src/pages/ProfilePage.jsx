import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' },
  topbar: { background: 'var(--primary)', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 18, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 },
  content: { padding: 20, maxWidth: 500, margin: '0 auto' },
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' },
  input: { width: '100%', background: 'var(--bg3)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '9px 12px', fontSize: 14, fontFamily: 'var(--font)', outline: 'none', marginBottom: 14 },
  btn: { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', width: '100%' },
  btnDanger: { background: 'var(--bg3)', color: 'var(--red)', border: '1.5px solid var(--red)', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', width: '100%' },
  avatar: { width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', border: '3px solid var(--primary)', flexShrink: 0 },
  toggle: { width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', transition: '.2s', flexShrink: 0 },
  toggleKnob: { width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, transition: '.2s' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' },
  success: { background: '#e8f8f0', border: '1px solid #9ee5c4', color: '#0b6e4f', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 },
  error: { background: '#fdeaea', border: '1px solid #f5b5b5', color: '#c0392b', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 14 },
}

export default function ProfilePage({ onBack, darkMode, setDarkMode }) {
  const { user } = useAuth()
  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)

  useEffect(() => {
    setPushSupported('Notification' in window)
    if ('Notification' in window) setPushEnabled(Notification.permission === 'granted')
  }, [])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const saveProfile = async () => {
    setSaving(true)
    setMsg({ type: '', text: '' })
    try {
      let newAvatarUrl = avatarUrl
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `${user.id}/avatar.${ext}`
        await supabase.storage.from('moneytrack-images').upload(path, avatarFile, { upsert: true })
        const { data } = supabase.storage.from('moneytrack-images').getPublicUrl(path)
        newAvatarUrl = data.publicUrl + '?t=' + Date.now()
        setAvatarUrl(newAvatarUrl)
      }
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name, avatar_url: newAvatarUrl }
      })
      if (error) throw error
      setMsg({ type: 'success', text: 'บันทึกข้อมูลสำเร็จครับ!' })
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    }
    setSaving(false)
  }

  const togglePush = async () => {
    if (!pushSupported) return
    if (Notification.permission === 'granted') {
      setPushEnabled(false)
      setMsg({ type: 'success', text: 'ปิดการแจ้งเตือนแล้วครับ' })
    } else {
      const result = await Notification.requestPermission()
      if (result === 'granted') {
        setPushEnabled(true)
        new Notification('MoneyTrack', { body: 'เปิดการแจ้งเตือนสำเร็จแล้วครับ! 🎉', icon: '/pwa-192x192.png' })
        setMsg({ type: 'success', text: 'เปิดการแจ้งเตือนสำเร็จแล้วครับ!' })
      } else {
        setMsg({ type: 'error', text: 'กรุณาอนุญาต notification ในการตั้งค่าเบราว์เซอร์ครับ' })
      }
    }
  }

  const signOut = () => supabase.auth.signOut()

  const initials = (name || user?.email || 'U').charAt(0).toUpperCase()
  const displayAvatar = avatarPreview || avatarUrl

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div style={s.logo}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20, padding: 0, display: 'flex', alignItems: 'center' }}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
          <span style={{ marginLeft: 8 }}>โปรไฟล์</span>
        </div>
      </div>

      <div style={s.content}>
        {/* Avatar + Name */}
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {displayAvatar
              ? <img src={displayAvatar} alt="avatar" style={s.avatar} />
              : <div style={s.avatarPlaceholder}>{initials}</div>
            }
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{name || 'ไม่ระบุชื่อ'}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{user?.email}</div>
              <button onClick={() => document.getElementById('avatar-input').click()}
                style={{ marginTop: 8, background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--primary)', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                <i className="ti ti-camera" aria-hidden="true" /> เปลี่ยนรูป
              </button>
              <input id="avatar-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
          </div>

          {msg.text && <div style={msg.type === 'success' ? s.success : s.error}>{msg.text}</div>}

          <label style={s.label}>ชื่อ-นามสกุล</label>
          <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="กรอกชื่อของคุณ" />

          <label style={s.label}>อีเมล</label>
          <input style={{ ...s.input, opacity: .6 }} value={user?.email} disabled />

          <button style={{ ...s.btn, opacity: saving ? .7 : 1 }} onClick={saveProfile} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </div>

        {/* การแจ้งเตือน */}
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>การตั้งค่า</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>ปรับแต่งประสบการณ์การใช้งาน</div>

          <div style={s.row}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Dark Mode</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>ธีมสีเข้ม</div>
            </div>
            <button onClick={() => setDarkMode(p => !p)}
              style={{ ...s.toggle, background: darkMode ? 'var(--primary)' : 'var(--bg3)' }}>
              <div style={{ ...s.toggleKnob, left: darkMode ? 23 : 3 }} />
            </button>
          </div>

          <div style={{ ...s.row, borderBottom: 'none' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                <i className="ti ti-bell" aria-hidden="true" style={{ marginRight: 6, color: 'var(--amber)' }} />
                Push Notification
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {!pushSupported ? 'เบราว์เซอร์ไม่รองรับ' : pushEnabled ? 'เปิดอยู่' : 'ปิดอยู่'}
              </div>
            </div>
            <button onClick={togglePush} disabled={!pushSupported}
              style={{ ...s.toggle, background: pushEnabled ? 'var(--teal)' : 'var(--bg3)', opacity: pushSupported ? 1 : .4 }}>
              <div style={{ ...s.toggleKnob, left: pushEnabled ? 23 : 3 }} />
            </button>
          </div>
        </div>

        {/* ออกจากระบบ */}
        <button style={s.btnDanger} onClick={signOut}>
          <i className="ti ti-logout" aria-hidden="true" /> ออกจากระบบ
        </button>
      </div>
    </div>
  )
}
