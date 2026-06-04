import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const CAT_META = {
  บันเทิง:  { color: '#7f77dd', icon: 'ti-device-tv' },
  เพลง:     { color: '#1db954', icon: 'ti-music' },
  วิดีโอ:   { color: '#e84c4c', icon: 'ti-brand-youtube' },
  Cloud:    { color: '#378add', icon: 'ti-cloud' },
  อาหาร:   { color: '#f39c12', icon: 'ti-motorbike' },
  เดินทาง: { color: '#d4537e', icon: 'ti-car' },
  ช้อปปิ้ง:{ color: '#639922', icon: 'ti-shopping-cart' },
  สาธารณูปโภค: { color: '#8888a0', icon: 'ti-bolt' },
  รายได้:  { color: '#00b894', icon: 'ti-trending-up' },
  อื่นๆ:   { color: '#aaaaaa', icon: 'ti-star' },
}

const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const CURR = { THB: { sym: '฿', rate: 1 }, USD: { sym: '$', rate: 0.027 }, EUR: { sym: '€', rate: 0.025 } }

function fmt(v, currency) {
  const c = CURR[currency]
  const n = v * c.rate
  if (currency === 'THB') return c.sym + Math.round(n).toLocaleString('th-TH')
  return c.sym + n.toFixed(2)
}

function ItemIcon({ item, size = 40 }) {
  const meta = CAT_META[item.category] || CAT_META['อื่นๆ']
  const r = 12
  if (item.image_url) return (
    <div style={{ width: size, height: size, borderRadius: r, overflow: 'hidden', flexShrink: 0 }}>
      <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  )
  return (
    <div style={{ width: size, height: size, borderRadius: r, background: (item.color || meta.color) + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <i className={`ti ${item.icon || meta.icon}`} style={{ color: item.color || meta.color, fontSize: 17 }} aria-hidden="true" />
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20 }}><i className="ti ti-x" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', background: 'var(--bg3)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '9px 12px', fontSize: 14, fontFamily: 'var(--font)', outline: 'none', marginBottom: 12 }
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.5px' }
const btnPrimary = { background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }
const btnSecondary = { background: 'var(--bg3)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }

export default function Dashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [subs, setSubs] = useState([])
  const [txns, setTxns] = useState([])
  const [currency, setCurrency] = useState('THB')
  const [darkMode, setDarkMode] = useState(false)
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({})
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').order('date', { ascending: false })
    ])
    setSubs(s || [])
    setTxns(t || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const uploadImage = async (file, folder) => {
    if (!file) return null
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${folder}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('moneytrack-images').upload(path, file)
    if (error) return null
    const { data } = supabase.storage.from('moneytrack-images').getPublicUrl(path)
    return data.publicUrl
  }

  const handleImgChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImgFile(file)
    setImgPreview(URL.createObjectURL(file))
  }

  const openAddSub = () => {
    setForm({ name: '', category: 'บันเทิง', amount: '', billing_day: '1' })
    setImgFile(null); setImgPreview(null)
    setModal('add-sub')
  }

  const saveSub = async () => {
    if (!form.name || !form.amount) return
    setSaving(true)
    const meta = CAT_META[form.category] || CAT_META['อื่นๆ']
    const image_url = await uploadImage(imgFile, 'sub')
    const { error } = await supabase.from('subscriptions').insert({
      user_id: user.id,
      name: form.name,
      category: form.category,
      amount: parseFloat(form.amount),
      billing_day: parseInt(form.billing_day) || 1,
      color: meta.color,
      icon: meta.icon,
      image_url,
    })
    if (!error) { await loadData(); setModal(null) }
    setSaving(false)
  }

  const openAddTxn = () => {
    const today = new Date().toISOString().split('T')[0]
    setForm({ type: 'expense', name: '', amount: '', category: 'อาหาร', date: today })
    setImgFile(null); setImgPreview(null)
    setModal('add-txn')
  }

  const saveTxn = async () => {
    if (!form.name || !form.amount) return
    setSaving(true)
    const image_url = await uploadImage(imgFile, 'txn')
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: form.type,
      name: form.name,
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
      image_url,
    })
    if (!error) { await loadData(); setModal(null) }
    setSaving(false)
  }

  const delSub = async (id) => {
    await supabase.from('subscriptions').delete().eq('id', id)
    setSubs(prev => prev.filter(s => s.id !== id))
  }

  const delTxn = async (id) => {
    await supabase.from('transactions').delete().eq('id', id)
    setTxns(prev => prev.filter(t => t.id !== id))
  }

  const signOut = () => supabase.auth.signOut()

  const totalSubs = subs.reduce((s, x) => s + Number(x.amount), 0)
  const totalInc = txns.filter(t => t.type === 'income').reduce((s, x) => s + Number(x.amount), 0)
  const totalExp = txns.filter(t => t.type === 'expense').reduce((s, x) => s + Number(x.amount), 0) + totalSubs
  const balance = totalInc - totalExp

  const today = new Date().getDate()
  const upcoming = subs.filter(s => s.billing_day >= today && s.billing_day <= today + 7)

  const catMap = {}
  subs.forEach(s => { catMap[s.category] = (catMap[s.category] || 0) + Number(s.amount) })
  txns.filter(t => t.type === 'expense').forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount) })
  const totalCat = Object.values(catMap).reduce((a, b) => a + b, 0)

  const thisMonth = new Date().getMonth()
  const mockInc = [28000, 31000, 29000, 33000, 35000, 38500, 36000, 40000, 38000, 42000, 39000, totalInc]
  const mockExp = [22000, 25000, 21000, 27000, 30000, 28000, 26000, 31000, 29000, 33000, 30000, totalExp]
  const chartMonths = Array.from({ length: 6 }, (_, i) => (thisMonth - 5 + i + 12) % 12)
  const chartInc = chartMonths.map(m => mockInc[m])
  const chartExp = chartMonths.map(m => mockExp[m])
  const maxV = Math.max(...chartInc, ...chartExp, 1)

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'คุณ'

  const NAV = [
    { id: 'dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
    { id: 'subscriptions', icon: 'ti-refresh', label: 'Subscription' },
    { id: 'transactions', icon: 'ti-list', label: 'รายรับ-รายจ่าย' },
    { id: 'alerts', icon: 'ti-bell', label: 'แจ้งเตือน' },
  ]

  const s = {
    wrap: { minHeight: '100vh', background: 'var(--bg)' },
    topbar: { background: 'var(--primary)', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    logo: { fontSize: 18, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 },
    nav: { display: 'flex', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 20px', overflowX: 'auto' },
    nb: { padding: '11px 14px', border: 'none', background: 'none', color: 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: '2.5px solid transparent', fontFamily: 'var(--font)', whiteSpace: 'nowrap' },
    nbActive: { color: 'var(--primary)', borderBottom: '2.5px solid var(--primary)' },
    content: { padding: 20, maxWidth: 900, margin: '0 auto' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
    card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 },
    sumCard: { background: 'var(--primary)', borderRadius: 16, padding: 20, marginBottom: 16, color: '#fff' },
    ctitle: { fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    ir: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' },
    iname: { fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    isub: { fontSize: 12, color: 'var(--muted)', marginTop: 2 },
    tag: { fontSize: 10, background: 'var(--bg3)', borderRadius: 20, padding: '2px 8px', color: 'var(--muted)', fontWeight: 500 },
    addBtn: { ...btnPrimary, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 },
    delBtn: { background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px 6px', borderRadius: 6, flexShrink: 0 },
    statBox: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 15px' },
  }

  const imgUploadBlock = (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>รูปภาพ (ไม่บังคับ)</label>
      <div onClick={() => document.getElementById('img-input').click()}
        style={{ border: `2px dashed ${imgPreview ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 12, padding: 16, textAlign: 'center', cursor: 'pointer', background: 'var(--bg3)' }}>
        {imgPreview
          ? <img src={imgPreview} alt="preview" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', margin: '0 auto' }} />
          : <><i className="ti ti-photo-plus" style={{ fontSize: 28, color: 'var(--muted)' }} /><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>แตะเพื่ออัปโหลดรูป</div></>
        }
      </div>
      <input id="img-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImgChange} />
    </div>
  )

  return (
    <div style={s.wrap}>
      {/* Topbar */}
      <div style={s.topbar}>
        <div style={s.logo}><div style={{ width: 8, height: 8, background: '#00a8e8', borderRadius: '50%' }} />MoneyTrack</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 8, padding: '5px 8px', fontSize: 13, fontFamily: 'var(--font)', cursor: 'pointer' }}>
            <option value="THB">฿ บาท</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
          </select>
          <button onClick={() => setDarkMode(p => !p)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 15 }}>
            <i className={`ti ${darkMode ? 'ti-sun' : 'ti-moon'}`} />
          </button>
          <button onClick={signOut} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-logout" aria-hidden="true" /><span style={{ display: 'none' }}>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Nav */}
      <div style={s.nav}>
        {NAV.map(n => (
          <button key={n.id} style={{ ...s.nb, ...(tab === n.id ? s.nbActive : {}) }} onClick={() => setTab(n.id)}>
            <i className={`ti ${n.icon}`} aria-hidden="true" /> {n.label}
          </button>
        ))}
      </div>

      <div style={s.content}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : (
          <>
            {/* ===== DASHBOARD ===== */}
            {tab === 'dashboard' && (
              <>
                <div style={s.sumCard}>
                  <div style={{ fontSize: 11, opacity: .7, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>สวัสดี {displayName} — ยอดคงเหลือเดือนนี้</div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: balance >= 0 ? '#7fffda' : '#ffaaaa' }}>{fmt(balance, currency)}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                    <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 10, opacity: .7, marginBottom: 3 }}>↓ รายรับ</div>
                      <div style={{ fontSize: 17, fontWeight: 700 }}>{fmt(totalInc, currency)}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 10, opacity: .7, marginBottom: 3 }}>↑ รายจ่าย</div>
                      <div style={{ fontSize: 17, fontWeight: 700 }}>{fmt(totalExp, currency)}</div>
                    </div>
                  </div>
                </div>

                <div style={s.grid2}>
                  <div style={s.card}>
                    <div style={s.ctitle}>
                      รายรับ-รายจ่าย 6 เดือน
                      <span style={{ display: 'flex', gap: 8, fontWeight: 400 }}>
                        <span style={{ fontSize: 10, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 3, background: 'var(--teal)', display: 'inline-block', borderRadius: 2 }} />รับ</span>
                        <span style={{ fontSize: 10, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 3, background: 'var(--red)', display: 'inline-block', borderRadius: 2 }} />จ่าย</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 90 }}>
                      {chartMonths.map((m, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 2, height: 90 }}>
                          <div style={{ width: '50%', height: Math.round((chartInc[i] / maxV) * 82), background: 'var(--teal)', borderRadius: '4px 4px 0 0', minHeight: 3 }} />
                          <div style={{ width: '50%', height: Math.round((chartExp[i] / maxV) * 82), background: 'var(--red)', borderRadius: '4px 4px 0 0', minHeight: 3 }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                      {chartMonths.map((m, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--muted)' }}>{MONTHS[m]}</div>)}
                    </div>
                  </div>

                  <div style={s.card}>
                    <div style={s.ctitle}>สัดส่วนค่าใช้จ่าย</div>
                    {Object.keys(catMap).slice(0, 5).map(k => {
                      const pct = Math.round((catMap[k] / totalCat) * 100)
                      const col = CAT_META[k]?.color || '#888'
                      return (
                        <div key={k} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>
                            <span>{k}</span><span style={{ color: 'var(--muted)' }}>{fmt(catMap[k], currency)} <span style={{ opacity: .6 }}>{pct}%</span></span>
                          </div>
                          <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6 }}>
                            <div style={{ width: `${pct}%`, height: 6, borderRadius: 4, background: col }} />
                          </div>
                        </div>
                      )
                    })}
                    {Object.keys(catMap).length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>ยังไม่มีรายจ่ายครับ</div>}
                  </div>
                </div>

                <div style={s.grid2}>
                  <div style={s.card}>
                    <div style={s.ctitle}>Subscription ที่จะถึง</div>
                    {upcoming.length === 0
                      ? <div style={{ fontSize: 12, color: 'var(--muted)' }}>ไม่มีใน 7 วันข้างหน้าครับ</div>
                      : upcoming.map(s2 => (
                        <div key={s2.id} style={{ ...s.ir, borderBottom: 'none', paddingBottom: 0 }}>
                          <ItemIcon item={s2} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={s.iname}>{s2.name}</div>
                            <div style={s.isub}>วันที่ {s2.billing_day}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>{fmt(s2.amount, currency)}</div>
                            <span style={{ fontSize: 10, background: '#fff3cd', color: '#856404', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>ใกล้ถึง</span>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div style={s.card}>
                    <div style={s.ctitle}>รายการล่าสุด</div>
                    {txns.slice(0, 4).map(t => (
                      <div key={t.id} style={{ ...s.ir, borderBottom: 'none', paddingBottom: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === 'income' ? '#0d291822' : '#2a0e0e22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={`ti ${t.type === 'income' ? 'ti-arrow-down-left' : 'ti-arrow-up-right'}`} style={{ color: t.type === 'income' ? 'var(--teal)' : 'var(--red)', fontSize: 15 }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={s.iname}>{t.name}</div>
                          <div style={s.isub}>{t.date}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? 'var(--teal)' : 'var(--red)' }}>
                          {t.type === 'income' ? '+' : '−'}{fmt(t.amount, currency)}
                        </div>
                      </div>
                    ))}
                    {txns.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)' }}>ยังไม่มีรายการครับ</div>}
                  </div>
                </div>
              </>
            )}

            {/* ===== SUBSCRIPTIONS ===== */}
            {tab === 'subscriptions' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                  {[
                    { label: 'รวม/เดือน', val: fmt(totalSubs, currency), color: 'var(--primary)' },
                    { label: 'จำนวน', val: `${subs.length} รายการ`, color: 'var(--text)' },
                    { label: 'ใกล้ถึง', val: `${upcoming.length} รายการ`, color: 'var(--amber)' },
                  ].map(x => (
                    <div key={x.label} style={s.statBox}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>{x.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: x.color }}>{x.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <button style={s.addBtn} onClick={openAddSub}><i className="ti ti-plus" aria-hidden="true" /> เพิ่ม Subscription</button>
                </div>
                <div style={s.card}>
                  {subs.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 20 }}>ยังไม่มี subscription ครับ กด + เพื่อเพิ่มเลย</div>}
                  {subs.map((sub, i) => (
                    <div key={sub.id} style={{ ...s.ir, borderBottom: i === subs.length - 1 ? 'none' : undefined, paddingBottom: i === subs.length - 1 ? 0 : undefined }}>
                      <ItemIcon item={sub} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.iname}>{sub.name}</div>
                        <div style={s.isub}><span style={s.tag}>{sub.category}</span> &nbsp;วันที่ {sub.billing_day}</div>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>{fmt(sub.amount, currency)}/เดือน</div>
                        <span style={{ fontSize: 10, ...(sub.billing_day <= today + 7 ? { background: '#fff3cd', color: '#856404' } : { background: '#d1f2eb', color: '#0b6e4f' }), padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>
                          {sub.billing_day >= today && sub.billing_day <= today + 7 ? 'เร็วๆนี้' : 'ปกติ'}
                        </span>
                      </div>
                      <button style={s.delBtn} onClick={() => delSub(sub.id)} aria-label="ลบ"><i className="ti ti-trash" /></button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ===== TRANSACTIONS ===== */}
            {tab === 'transactions' && (
              <>
                <div style={s.grid2}>
                  <div style={{ ...s.statBox, borderLeft: '3px solid var(--teal)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>รายรับเดือนนี้</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--teal)' }}>{fmt(totalInc, currency)}</div>
                  </div>
                  <div style={{ ...s.statBox, borderLeft: '3px solid var(--red)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 5 }}>รายจ่ายเดือนนี้</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--red)' }}>{fmt(totalExp, currency)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                  <button style={s.addBtn} onClick={openAddTxn}><i className="ti ti-plus" aria-hidden="true" /> เพิ่มรายการ</button>
                </div>
                <div style={s.card}>
                  <div style={s.ctitle}>รายการทั้งหมด</div>
                  {txns.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: 20 }}>ยังไม่มีรายการครับ</div>}
                  {txns.map((t, i) => (
                    <div key={t.id} style={{ ...s.ir, borderBottom: i === txns.length - 1 ? 'none' : undefined, paddingBottom: i === txns.length - 1 ? 0 : undefined }}>
                      <ItemIcon item={{ ...t, color: t.type === 'income' ? '#00b894' : '#e84c4c', icon: t.type === 'income' ? 'ti-arrow-down-left' : 'ti-arrow-up-right' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.iname}>{t.name}</div>
                        <div style={s.isub}><span style={s.tag}>{t.category}</span> &nbsp;{t.date}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.type === 'income' ? 'var(--teal)' : 'var(--red)', marginRight: 8 }}>
                        {t.type === 'income' ? '+' : '−'}{fmt(t.amount, currency)}
                      </div>
                      <button style={s.delBtn} onClick={() => delTxn(t.id)} aria-label="ลบ"><i className="ti ti-trash" /></button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ===== ALERTS ===== */}
            {tab === 'alerts' && (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>การแจ้งเตือน</div>
                {subs.filter(s2 => s2.billing_day >= today && s2.billing_day <= today + 7).map(s2 => {
                  const diff = s2.billing_day - today
                  return (
                    <div key={s2.id} style={{ background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '11px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: diff <= 1 ? 'var(--red)' : 'var(--amber)', flexShrink: 0 }} />
                      <div style={{ fontSize: 13 }}><b>{s2.name}</b> จะหักเงิน {fmt(s2.amount, currency)} {diff === 0 ? 'วันนี้' : `ใน ${diff} วัน`}</div>
                    </div>
                  )
                })}
                <div style={{ background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 12, padding: '11px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: balance >= 0 ? 'var(--teal)' : 'var(--red)', flexShrink: 0 }} />
                  <div style={{ fontSize: 13 }}>{balance >= 0 ? `ยอดคงเหลือเดือนนี้ ${fmt(balance, currency)} — อยู่ในเกณฑ์ดี` : `รายจ่ายเกินรายรับ ${fmt(Math.abs(balance), currency)} เดือนนี้`}</div>
                </div>
                <div style={{ ...s.card, marginTop: 16 }}>
                  <div style={s.ctitle}>สรุป Subscription รายเดือน</div>
                  {subs.map((sub, i) => (
                    <div key={sub.id} style={{ ...s.ir, borderBottom: i === subs.length - 1 ? 'none' : undefined, paddingBottom: i === subs.length - 1 ? 0 : undefined }}>
                      <ItemIcon item={sub} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.iname}>{sub.name}</div>
                        <div style={s.isub}>หักวันที่ {sub.billing_day} ทุกเดือน</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>{fmt(sub.amount, currency)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ===== MODAL: Add Subscription ===== */}
      {modal === 'add-sub' && (
        <Modal title="เพิ่ม Subscription" onClose={() => setModal(null)}>
          {imgUploadBlock}
          <label style={labelStyle}>ชื่อบริการ</label>
          <input style={inputStyle} placeholder="เช่น Disney+" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <label style={labelStyle}>หมวดหมู่</label>
          <select style={inputStyle} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            {Object.keys(CAT_META).filter(k => k !== 'รายได้').map(k => <option key={k}>{k}</option>)}
          </select>
          <label style={labelStyle}>ราคา (บาท/เดือน)</label>
          <input style={inputStyle} type="number" placeholder="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          <label style={labelStyle}>วันตัดบัญชี (1-31)</label>
          <input style={inputStyle} type="number" min="1" max="31" placeholder="1" value={form.billing_day} onChange={e => setForm(p => ({ ...p, billing_day: e.target.value }))} />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button style={btnSecondary} onClick={() => setModal(null)}>ยกเลิก</button>
            <button style={{ ...btnPrimary, flex: 1, opacity: saving ? .7 : 1 }} onClick={saveSub} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </Modal>
      )}

      {/* ===== MODAL: Add Transaction ===== */}
      {modal === 'add-txn' && (
        <Modal title="เพิ่มรายรับ / รายจ่าย" onClose={() => setModal(null)}>
          {imgUploadBlock}
          <label style={labelStyle}>ประเภท</label>
          <select style={inputStyle} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
            <option value="expense">รายจ่าย</option>
            <option value="income">รายรับ</option>
          </select>
          <label style={labelStyle}>รายการ</label>
          <input style={inputStyle} placeholder="เช่น ค่าอาหาร" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <label style={labelStyle}>จำนวนเงิน (บาท)</label>
          <input style={inputStyle} type="number" placeholder="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          <label style={labelStyle}>หมวดหมู่</label>
          <select style={inputStyle} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            {Object.keys(CAT_META).map(k => <option key={k}>{k}</option>)}
          </select>
          <label style={labelStyle}>วันที่</label>
          <input style={inputStyle} type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button style={btnSecondary} onClick={() => setModal(null)}>ยกเลิก</button>
            <button style={{ ...btnPrimary, flex: 1, opacity: saving ? .7 : 1 }} onClick={saveTxn} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
