// MoneyTrack — shared UI primitives + helpers (Soft theme).
// Plain ES module; import what you need into the pages.
import { useState, useEffect, useRef } from 'react'

export const CAT_META = {
  'บันเทิง':      { color: '#7f77dd', icon: 'ti-device-tv' },
  'เพลง':         { color: '#1db954', icon: 'ti-music' },
  'วิดีโอ':       { color: '#e84c4c', icon: 'ti-brand-youtube' },
  'Cloud':        { color: '#378add', icon: 'ti-cloud' },
  'อาหาร':        { color: '#f39c12', icon: 'ti-motorbike' },
  'เดินทาง':      { color: '#d4537e', icon: 'ti-car' },
  'ช้อปปิ้ง':     { color: '#5fa524', icon: 'ti-shopping-bag' },
  'สาธารณูปโภค':  { color: '#8888a0', icon: 'ti-bolt' },
  'ที่อยู่อาศัย':  { color: '#3f8ad0', icon: 'ti-home' },
  'สุขภาพ':       { color: '#2bb3a3', icon: 'ti-heart-rate-monitor' },
  'รายได้':       { color: '#00b894', icon: 'ti-trending-up' },
  'อื่นๆ':        { color: '#9aa0b4', icon: 'ti-dots' },
}
export const SUB_CATS = ['บันเทิง','เพลง','วิดีโอ','Cloud','อาหาร','เดินทาง','ช้อปปิ้ง','สาธารณูปโภค','สุขภาพ','อื่นๆ']
export const TXN_CATS = ['อาหาร','เดินทาง','ช้อปปิ้ง','ที่อยู่อาศัย','สาธารณูปโภค','สุขภาพ','บันเทิง','รายได้','อื่นๆ']
export const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
export const CURR = {
  THB: { sym: '฿', rate: 1, label: '฿ บาท' },
  USD: { sym: '$', rate: 0.027, label: '$ USD' },
  EUR: { sym: '€', rate: 0.025, label: '€ EUR' },
}

export function fmt(v, currency = 'THB') {
  const c = CURR[currency] || CURR.THB
  const n = (Number(v) || 0) * c.rate
  return c.sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
export function fmtShort(v, currency = 'THB') {
  const c = CURR[currency] || CURR.THB
  return c.sym + Math.round((Number(v) || 0) * c.rate).toLocaleString('en-US')
}
export function split(v, currency = 'THB') {
  const [int, dec] = fmt(v, currency).replace(/^[^\d-]+/, '').split('.')
  return { sym: (CURR[currency] || CURR.THB).sym, int, dec }
}

export function useIsMobile(bp = 860) {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth < bp : false)
  useEffect(() => {
    const on = () => setM(window.innerWidth < bp)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [bp])
  return m
}

export const Icon = ({ n, s, style, ...p }) => <i className={'ti ' + n} style={{ fontSize: s, ...style }} {...p} />

export function Avatar({ initial, size = 42, style }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--grad)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.4, flexShrink: 0, ...style }}>{initial}</div>
}

export function ItemIcon({ item, size = 44, radius = 14 }) {
  const meta = CAT_META[item.category] || CAT_META['อื่นๆ']
  const color = item.color || meta.color
  if (item.image_url) return <div style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', flexShrink: 0 }}><img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon n={item.icon || meta.icon} s={size * 0.42} style={{ color }} />
    </div>
  )
}

export function Badge({ tone = 'amber', children, style }) {
  const map = { amber: ['var(--amber-soft)', 'var(--amber-ink)'], teal: ['var(--teal-soft)', 'var(--teal-ink)'], red: ['var(--red-soft)', 'var(--red-ink)'], blue: ['var(--primary-soft)', 'var(--primary)'] }
  const [bg, fg] = map[tone] || map.amber
  return <span style={{ fontSize: 11, fontWeight: 700, color: fg, background: bg, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap', ...style }}>{children}</span>
}

export function Toggle({ on, onChange, color = 'var(--primary)' }) {
  return (
    <button onClick={() => onChange(!on)} className="mt-btn" style={{ width: 46, height: 26, borderRadius: 14, border: 'none', cursor: 'pointer', position: 'relative', background: on ? color : 'var(--surface-3)', flexShrink: 0, padding: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s cubic-bezier(.2,.7,.3,1)', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
    </button>
  )
}

export function IconBtn({ n, onClick, dot, active, style }) {
  return (
    <button onClick={onClick} className="mt-btn" style={{ width: 44, height: 44, borderRadius: 14, background: active ? 'var(--primary-soft)' : 'var(--surface)', border: '1px solid var(--border)', color: active ? 'var(--primary)' : 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0, boxShadow: 'var(--shadow)', ...style }}>
      <Icon n={n} s={19} />
      {dot && <span style={{ position: 'absolute', top: 11, right: 12, width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', border: '2px solid var(--surface)' }} />}
    </button>
  )
}

export function AddButton({ onClick, children = 'เพิ่มรายการ', icon = 'ti-plus', full }) {
  return (
    <button onClick={onClick} className="mt-btn" style={{ border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--grad)', color: '#fff', borderRadius: 14, padding: '0 18px', height: 44, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap', boxShadow: '0 10px 22px -10px rgba(26,60,143,.8)', width: full ? '100%' : 'auto' }}>
      <Icon n={icon} s={18} /> {children}
    </button>
  )
}

export const labelStyle = { display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', marginBottom: 7, letterSpacing: '.3px' }
export const fieldStyle = { width: '100%', background: 'var(--surface-2)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 13, padding: '11px 14px', fontSize: 14.5, fontFamily: 'inherit', outline: 'none' }

export function Field({ label, children }) {
  return <div style={{ marginBottom: 14 }}>{label && <label style={labelStyle}>{label}</label>}{children}</div>
}
export const Input = (p) => <input className="mt-input" style={{ ...fieldStyle, ...p.style }} {...p} />
export function Select({ children, style, ...p }) {
  return (
    <div style={{ position: 'relative' }}>
      <select className="mt-input" style={{ ...fieldStyle, appearance: 'none', paddingRight: 36, cursor: 'pointer', ...style }} {...p}>{children}</select>
      <Icon n="ti-chevron-down" s={16} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
    </div>
  )
}

export function Segmented({ value, options, onChange, style }) {
  return (
    <div style={{ display: 'flex', background: 'var(--surface-3)', borderRadius: 13, padding: 4, gap: 4, ...style }}>
      {options.map((o) => {
        const v = o.value ?? o, label = o.label ?? o
        const active = v === value
        return (
          <button key={v} onClick={() => onChange(v)} className="mt-btn" style={{ flex: 1, border: 'none', borderRadius: 10, padding: '9px 6px', fontSize: 13.5, fontWeight: active ? 700 : 600, fontFamily: 'inherit', cursor: 'pointer', color: active ? 'var(--on-primary)' : 'var(--muted)', background: active ? 'var(--grad)' : 'transparent', boxShadow: active ? '0 6px 14px -8px rgba(26,60,143,.8)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {o.icon && <Icon n={o.icon} s={16} />}{label}
          </button>
        )
      })}
    </div>
  )
}

// Responsive modal: bottom-sheet on mobile, centered card on desktop.
export function Modal({ title, subtitle, onClose, children, mobile, maxWidth = 420 }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,20,35,.5)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: mobile ? 'flex-end' : 'center', justifyContent: 'center', padding: mobile ? 0 : 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="mt-scroll" style={{ background: 'var(--surface)', borderRadius: mobile ? '24px 24px 0 0' : 'var(--radius)', padding: mobile ? '10px 20px 24px' : 24, width: '100%', maxWidth: mobile ? '100%' : maxWidth, maxHeight: '92%', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', animation: 'mt-slide-in .26s ease both' }}>
        {mobile && <div style={{ width: 40, height: 4, borderRadius: 4, background: 'var(--border)', margin: '0 auto 14px' }} />}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{title}</h3>
            {subtitle && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} className="mt-btn" style={{ background: 'var(--surface-2)', border: 'none', color: 'var(--muted)', cursor: 'pointer', width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon n="ti-x" s={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Card({ children, style, pad = 22, className = '' }) {
  return <div className={className} style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', padding: pad, boxShadow: 'var(--shadow)', border: '1px solid var(--border-2)', ...style }}>{children}</div>
}

export function SectionTitle({ children, action, onAction }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <span style={{ fontSize: 15, fontWeight: 800 }}>{children}</span>
      {action && <button onClick={onAction} className="mt-btn" style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 3 }}>{action}</button>}
    </div>
  )
}

export function Empty({ icon = 'ti-inbox', children }) {
  return <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--muted-2)' }}><Icon n={icon} s={34} style={{ marginBottom: 8, opacity: .7 }} /><div style={{ fontSize: 13.5 }}>{children}</div></div>
}
