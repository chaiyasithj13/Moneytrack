import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { Icon, Avatar, Field, Input, Toggle, Card } from '../components/MoneyUI'

function Row({ title, desc, children, icon, iconColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0', borderBottom: '1px solid var(--border-2)' }}>
      {icon && <div style={{ width: 38, height: 38, borderRadius: 11, background: iconColor + '1c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon n={icon} s={18} style={{ color: iconColor }} /></div>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted-2)', marginTop: 1 }}>{desc}</div>
      </div>
      {children}
    </div>
  )
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
    setSaving(true); setMsg({ type: '', text: '' })
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
      const { error } = await supabase.auth.updateUser({ data: { full_name: name, avatar_url: newAvatarUrl } })
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-grad)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', maxWidth: 600, margin: '0 auto' }}>
        <button onClick={onBack} className="mt-btn" style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow)' }}><Icon n="ti-arrow-left" s={20} /></button>
        <span style={{ fontSize: 20, fontWeight: 800 }}>โปรไฟล์</span>
      </header>

      <div className="mt-anim" style={{ maxWidth: 560, margin: '0 auto', padding: '4px 20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            {displayAvatar
              ? <img src={displayAvatar} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', flexShrink: 0 }} />
              : <Avatar initial={initials} size={72} style={{ fontSize: 28, boxShadow: '0 14px 26px -12px rgba(26,60,143,.8)' }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{name || 'ไม่ระบุชื่อ'}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{user?.email}</div>
              <button onClick={() => document.getElementById('avatar-input').click()} className="mt-btn" style={{ marginTop: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--primary)', borderRadius: 10, padding: '6px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon n="ti-camera" s={15} /> เปลี่ยนรูป</button>
              <input id="avatar-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
          </div>

          {msg.text && <div style={{ background: msg.type === 'success' ? 'var(--teal-soft)' : 'var(--red-soft)', color: msg.type === 'success' ? 'var(--teal-ink)' : 'var(--red-ink)', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{msg.text}</div>}

          <Field label="ชื่อ-นามสกุล"><Input value={name} onChange={e => setName(e.target.value)} placeholder="กรอกชื่อของคุณ" /></Field>
          <Field label="อีเมล"><Input value={user?.email || ''} disabled style={{ opacity: .6 }} /></Field>
          <button onClick={saveProfile} disabled={saving} className="mt-btn" style={{ width: '100%', border: 'none', background: 'var(--grad)', color: '#fff', borderRadius: 14, padding: '12px 0', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 12px 24px -12px rgba(26,60,143,.9)', opacity: saving ? .7 : 1 }}>
            {saving ? 'กำลังบันทึก…' : 'บันทึกข้อมูล'}
          </button>
        </Card>

        <Card>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>การตั้งค่า</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted-2)', marginBottom: 10 }}>ปรับแต่งประสบการณ์การใช้งาน</div>
          <Row title="โหมดมืด" desc="ธีมสีเข้มถนอมสายตา" icon="ti-moon" iconColor="#6f5bd0"><Toggle on={darkMode} onChange={() => setDarkMode(p => !p)} /></Row>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 0' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: '#f39c121c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon n="ti-bell" s={18} style={{ color: '#f39c12' }} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>Push Notification</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted-2)', marginTop: 1 }}>{!pushSupported ? 'เบราว์เซอร์ไม่รองรับ' : pushEnabled ? 'เปิดอยู่' : 'ปิดอยู่'}</div>
            </div>
            <Toggle on={pushEnabled} onChange={togglePush} color="var(--teal)" />
          </div>
        </Card>

        <button onClick={signOut} className="mt-btn" style={{ background: 'var(--surface)', color: 'var(--red-ink)', border: '1.5px solid var(--red)', borderRadius: 16, padding: '13px 0', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon n="ti-logout" s={18} /> ออกจากระบบ</button>
      </div>
    </div>
  )
}
