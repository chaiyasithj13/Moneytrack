import { useState, useEffect, useCallback } from 'react'
import ProfilePage from './ProfilePage'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import {
  Icon, Avatar, IconBtn, AddButton, Modal, Field, Input, Select, Segmented,
  CURR, SUB_CATS, TXN_CATS, CAT_META, useIsMobile,
} from '../components/MoneyUI'
import { DashboardView, SubscriptionsView, TransactionsView, AlertsView, buildStats } from '../components/DashboardTabs'

const NAV = [
  { id: 'dashboard',     icon: 'ti-layout-dashboard', label: 'ภาพรวม',         short: 'ภาพรวม' },
  { id: 'subscriptions', icon: 'ti-repeat',           label: 'Subscription',   short: 'Sub' },
  { id: 'transactions',  icon: 'ti-arrows-exchange',  label: 'รายรับ-รายจ่าย', short: 'รายการ' },
  { id: 'alerts',        icon: 'ti-bell',             label: 'แจ้งเตือน',       short: 'แจ้งเตือน' },
]
const TITLES = { dashboard: 'ภาพรวม', subscriptions: 'Subscription', transactions: 'รายรับ-รายจ่าย', alerts: 'แจ้งเตือน' }

export default function Dashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('dashboard')
  const [subs, setSubs] = useState([])
  const [txns, setTxns] = useState([])
  const [currency, setCurrency] = useState('THB')
  const [darkMode, setDarkMode] = useState(false)
  const [modal, setModal] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [filterMonth, setFilterMonth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const mobile = useIsMobile()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').order('date', { ascending: false }),
    ])
    setSubs(s || [])
    setTxns(t || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // notify on upcoming subscriptions
  useEffect(() => {
    if (subs.length === 0) return
    const today = new Date().getDate()
    subs.filter(s => s.billing_day >= today && s.billing_day <= today + 3).forEach(s => {
      const diff = s.billing_day - today
      sendPushNotification('MoneyTrack — ใกล้ถึงวันตัดบัญชี', `${s.name} จะหักเงิน ${s.amount} บาท ${diff === 0 ? 'วันนี้' : 'ใน ' + diff + ' วัน'}`)
    })
  }, [subs])

  const sendPushNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/pwa-192x192.png' })
    }
  }

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

  // ── subscriptions ──
  const openAddSub = () => { setForm({ name: '', category: 'บันเทิง', amount: '', billing_day: '1' }); setImgFile(null); setImgPreview(null); setModal('add-sub') }
  const saveSub = async () => {
    if (!form.name || !form.amount) return
    setSaving(true)
    const meta = CAT_META[form.category] || CAT_META['อื่นๆ']
    const image_url = await uploadImage(imgFile, 'sub')
    const { error } = await supabase.from('subscriptions').insert({
      user_id: user.id, name: form.name, category: form.category,
      amount: parseFloat(form.amount), billing_day: parseInt(form.billing_day) || 1,
      color: meta.color, icon: meta.icon, image_url,
    })
    if (!error) { await loadData(); setModal(null) }
    setSaving(false)
  }
  const openEditSub = (sub) => {
    setForm({ _editId: sub.id, name: sub.name, category: sub.category, amount: String(sub.amount), billing_day: String(sub.billing_day) })
    setImgFile(null); setImgPreview(sub.image_url || null); setModal('edit-sub')
  }
  const updateSub = async () => {
    if (!form.name || !form.amount) return
    setSaving(true)
    const meta = CAT_META[form.category] || CAT_META['อื่นๆ']
    const image_url = imgPreview && imgPreview.startsWith('blob:') ? await uploadImage(imgFile, 'sub') : (imgPreview || null)
    const { error } = await supabase.from('subscriptions').update({
      name: form.name, category: form.category, amount: parseFloat(form.amount),
      billing_day: parseInt(form.billing_day) || 1, color: meta.color, icon: meta.icon, image_url,
    }).eq('id', form._editId)
    if (!error) { await loadData(); setModal(null) }
    setSaving(false)
  }
  const delSub = async (id) => {
    await supabase.from('subscriptions').delete().eq('id', id)
    setSubs(prev => prev.filter(s => s.id !== id))
  }

  // ── transactions ──
  const openAddTxn = () => {
    const today = new Date().toISOString().split('T')[0]
    setForm({ type: 'expense', name: '', amount: '', category: 'อาหาร', date: today })
    setImgFile(null); setImgPreview(null); setModal('add-txn')
  }
  const saveTxn = async () => {
    if (!form.name || !form.amount) return
    setSaving(true)
    let image_url = null
    if (imgFile) image_url = await uploadImage(imgFile, 'txn')
    else if (imgPreview && !imgPreview.startsWith('blob:')) image_url = imgPreview
    const meta = CAT_META[form.category] || CAT_META['อื่นๆ']
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id, type: form.type, name: form.name, amount: parseFloat(form.amount),
      category: form.category, date: form.date, icon: meta.icon, image_url,
    })
    if (!error) { await loadData(); setModal(null) }
    setSaving(false)
  }
  const delTxn = async (id) => {
    await supabase.from('transactions').delete().eq('id', id)
    setTxns(prev => prev.filter(t => t.id !== id))
  }

  const signOut = () => supabase.auth.signOut()
  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const goTab = (t) => { setTab(t); setShowProfile(false) }
  const totalSubs = subs.reduce((s, x) => s + Number(x.amount), 0)
  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'คุณ'
  const initial = (displayName || 'U').charAt(0).toUpperCase()

  if (showProfile) return <ProfilePage onBack={() => setShowProfile(false)} darkMode={darkMode} setDarkMode={setDarkMode} />

  // ── shared chrome ──
  const CurrencySelect = (
    <div style={{ position: 'relative' }}>
      <select value={currency} onChange={e => setCurrency(e.target.value)} className="mt-input"
        style={{ appearance: 'none', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 12, padding: '0 32px 0 14px', height: 44, minWidth: 96, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', boxShadow: 'var(--shadow)' }}>
        {Object.keys(CURR).map(k => <option key={k} value={k}>{CURR[k].sym} {k}</option>)}
      </select>
      <Icon n="ti-chevron-down" s={14} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
    </div>
  )

  const content = loading ? (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 34, height: 34, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'mt-spin .8s linear infinite' }} />
    </div>
  ) : tab === 'dashboard' ? <DashboardView subs={subs} txns={txns} currency={currency} mobile={mobile} goTab={goTab} />
    : tab === 'subscriptions' ? <SubscriptionsView subs={subs} currency={currency} mobile={mobile} openAddSub={openAddSub} openEditSub={openEditSub} delSub={delSub} />
    : tab === 'transactions' ? <TransactionsView txns={txns} currency={currency} mobile={mobile} filterMonth={filterMonth} setFilterMonth={setFilterMonth} openAddTxn={openAddTxn} delTxn={delTxn} totalSubs={totalSubs} />
    : <AlertsView subs={subs} txns={txns} currency={currency} mobile={mobile} />

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: mobile ? 'column' : 'row', background: 'var(--bg-grad)' }}>
      {/* Sidebar (desktop) */}
      {!mobile && (
        <aside style={{ width: 232, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '22px 14px', position: 'sticky', top: 0, height: '100vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 22px', fontSize: 18, fontWeight: 800 }}>
            <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--grad)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon n="ti-wallet" s={17} /></span>MoneyTrack
          </div>
          <nav style={{ flex: 1 }}>
            {NAV.map(n => {
              const active = tab === n.id
              return (
                <button key={n.id} onClick={() => goTab(n.id)} className="mt-nav mt-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 15, fontSize: 14, fontWeight: active ? 700 : 600, fontFamily: 'inherit', cursor: 'pointer', border: 'none', textAlign: 'left', color: active ? '#fff' : 'var(--muted)', background: active ? 'var(--grad)' : 'transparent', boxShadow: active ? '0 10px 20px -10px rgba(26,60,143,.7)' : 'none', marginBottom: 5 }}>
                  <Icon n={n.icon} s={19} />{n.label}
                </button>
              )
            })}
          </nav>
          <button onClick={() => setShowProfile(true)} className="mt-btn" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 12, borderRadius: 16, background: 'var(--surface-2)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
            <Avatar initial={initial} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
            <Icon n="ti-settings" s={18} style={{ color: 'var(--muted-2)' }} />
          </button>
        </aside>
      )}

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        {mobile ? (
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: 10, position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 17, fontWeight: 800 }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--grad)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon n="ti-wallet" s={16} /></span>MoneyTrack
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {CurrencySelect}
              <IconBtn n={darkMode ? 'ti-sun' : 'ti-moon'} onClick={() => setDarkMode(p => !p)} />
              <button onClick={() => setShowProfile(true)} className="mt-btn" style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}><Avatar initial={initial} size={44} /></button>
            </div>
          </header>
        ) : (
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 30px 6px', gap: 16 }}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab === 'dashboard' ? `สวัสดี, ${displayName} ☀️` : TITLES[tab]}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {CurrencySelect}
              <IconBtn n={darkMode ? 'ti-sun' : 'ti-moon'} onClick={() => setDarkMode(p => !p)} />
              <IconBtn n="ti-bell" dot onClick={() => goTab('alerts')} active={tab === 'alerts'} />
              <AddButton onClick={openAddTxn}>เพิ่มรายการ</AddButton>
            </div>
          </header>
        )}

        <div style={{ flex: 1, padding: mobile ? '6px 16px 96px' : '6px 30px 30px' }}>
          <div style={{ maxWidth: 1060, margin: '0 auto' }}>{content}</div>
        </div>
      </main>

      {/* Bottom nav (mobile) */}
      {mobile && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '8px 6px 10px' }}>
          {NAV.slice(0, 2).map(n => <NavBtn key={n.id} n={n} active={tab === n.id} onClick={() => goTab(n.id)} />)}
          <button onClick={openAddTxn} className="mt-btn" style={{ width: 54, height: 54, borderRadius: 18, background: 'var(--grad)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 12px 24px -8px rgba(26,60,143,.8)', marginTop: -22, flexShrink: 0 }}><Icon n="ti-plus" s={26} /></button>
          {NAV.slice(2).map(n => <NavBtn key={n.id} n={n} active={tab === n.id} onClick={() => goTab(n.id)} />)}
        </nav>
      )}

      {/* Modals */}
      {(modal === 'add-sub' || modal === 'edit-sub') && (
        <Modal title={modal === 'edit-sub' ? 'แก้ไข Subscription' : 'เพิ่ม Subscription'} subtitle="บริการรายเดือนที่ตัดเงินอัตโนมัติ" onClose={() => setModal(null)} mobile={mobile}>
          <ImgBlock imgPreview={imgPreview} onChange={handleImgChange} />
          <Field label="ชื่อบริการ"><Input placeholder="เช่น Disney+" value={form.name || ''} onChange={e => setField('name', e.target.value)} /></Field>
          <Field label="หมวดหมู่"><Select value={form.category || 'บันเทิง'} onChange={e => setField('category', e.target.value)}>{SUB_CATS.map(k => <option key={k}>{k}</option>)}</Select></Field>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="ราคา (บาท/เดือน)"><Input type="number" placeholder="0" value={form.amount || ''} onChange={e => setField('amount', e.target.value)} /></Field></div>
            <div style={{ width: 130 }}><Field label="วันตัดบัญชี"><Input type="number" min="1" max="31" placeholder="1" value={form.billing_day || ''} onChange={e => setField('billing_day', e.target.value)} /></Field></div>
          </div>
          <ModalButtons onClose={() => setModal(null)} onSave={modal === 'edit-sub' ? updateSub : saveSub} label={modal === 'edit-sub' ? 'บันทึกการแก้ไข' : 'บันทึก'} saving={saving} />
        </Modal>
      )}

      {modal === 'add-txn' && (
        <Modal title="เพิ่มรายการ" subtitle="บันทึกรายรับหรือรายจ่าย" onClose={() => setModal(null)} mobile={mobile}>
          <Field label="ประเภท">
            <Segmented value={form.type || 'expense'} onChange={v => setForm(p => ({ ...p, type: v, category: v === 'income' ? 'รายได้' : 'อาหาร' }))}
              options={[{ value: 'expense', label: 'รายจ่าย', icon: 'ti-arrow-up-right' }, { value: 'income', label: 'รายรับ', icon: 'ti-arrow-down-left' }]} />
          </Field>
          <ImgBlock imgPreview={imgPreview} onChange={handleImgChange} />
          {form.type !== 'income' && subs.length > 0 && (
            <Field label="เลือกจาก Subscription (ถ้ามี)">
              <Select value={form._subId || ''} onChange={e => {
                const sub = subs.find(s => s.id === e.target.value)
                if (sub) { setForm(p => ({ ...p, _subId: sub.id, name: sub.name, amount: String(sub.amount), category: sub.category })); setImgFile(null); setImgPreview(sub.image_url || null) }
                else { setForm(p => ({ ...p, _subId: '', name: '', amount: '', category: 'อาหาร' })); setImgFile(null); setImgPreview(null) }
              }}>
                <option value="">— พิมพ์เองใหม่ —</option>
                {subs.map(s => <option key={s.id} value={s.id}>{s.name} ({s.amount} บาท)</option>)}
              </Select>
            </Field>
          )}
          <Field label="ชื่อรายการ"><Input placeholder={form.type === 'income' ? 'เช่น เงินเดือน' : 'เช่น ค่าอาหาร'} value={form.name || ''} onChange={e => setField('name', e.target.value)} /></Field>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="จำนวนเงิน (บาท)"><Input type="number" placeholder="0" value={form.amount || ''} onChange={e => setField('amount', e.target.value)} /></Field></div>
            <div style={{ flex: 1 }}><Field label="วันที่"><Input type="date" value={form.date || ''} onChange={e => setField('date', e.target.value)} /></Field></div>
          </div>
          <Field label="หมวดหมู่"><Select value={form.category || 'อาหาร'} onChange={e => setField('category', e.target.value)}>{(form.type === 'income' ? ['รายได้', 'อื่นๆ'] : TXN_CATS).map(k => <option key={k}>{k}</option>)}</Select></Field>
          <ModalButtons onClose={() => setModal(null)} onSave={saveTxn} label="บันทึก" saving={saving} />
        </Modal>
      )}
    </div>
  )
}

function NavBtn({ n, active, onClick }) {
  return (
    <button onClick={onClick} className="mt-btn" style={{ flex: 1, maxWidth: 80, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 0', color: active ? 'var(--primary)' : 'var(--muted-2)', fontFamily: 'inherit' }}>
      <Icon n={n.icon} s={22} />
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 600, whiteSpace: 'nowrap' }}>{n.short}</span>
    </button>
  )
}

function ImgBlock({ imgPreview, onChange }) {
  return (
    <Field label="รูปภาพ (ไม่บังคับ)">
      <label className="mt-input" style={{ display: 'block', border: '2px dashed ' + (imgPreview ? 'var(--primary)' : 'var(--border)'), borderRadius: 14, padding: imgPreview ? 12 : 18, textAlign: 'center', cursor: 'pointer', background: 'var(--surface-2)' }}>
        {imgPreview
          ? <img src={imgPreview} alt="" style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', margin: '0 auto', display: 'block' }} />
          : <><Icon n="ti-photo-plus" s={26} style={{ color: 'var(--muted-2)' }} /><div style={{ fontSize: 12.5, color: 'var(--muted-2)', marginTop: 6 }}>แตะเพื่ออัปโหลดรูป</div></>}
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onChange} />
      </label>
    </Field>
  )
}

function ModalButtons({ onClose, onSave, label, saving }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
      <button onClick={onClose} className="mt-btn" style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 13, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>ยกเลิก</button>
      <button onClick={onSave} disabled={saving} className="mt-btn" style={{ flex: 1, border: 'none', background: 'var(--grad)', color: '#fff', borderRadius: 13, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 10px 22px -12px rgba(26,60,143,.9)', opacity: saving ? .7 : 1 }}>{saving ? 'กำลังบันทึก…' : label}</button>
    </div>
  )
}
