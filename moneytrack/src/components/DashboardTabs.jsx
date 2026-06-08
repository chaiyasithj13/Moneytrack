// MoneyTrack — dashboard tab views (Soft theme). Pure presentational; data via props.
import { Icon, ItemIcon, Card, SectionTitle, Badge, Empty, AddButton,
  fmt, fmtShort, split, CAT_META, MONTHS } from './MoneyUI'

const sameMonth = (dateStr, m, y) => { const d = new Date(dateStr); return d.getMonth() === m && d.getFullYear() === y }

// Live stats derived from current subs + txns, using the real current month.
export function buildStats(subs, txns) {
  const now = new Date()
  const curM = now.getMonth(), curY = now.getFullYear(), today = now.getDate()
  const totalSubs = subs.reduce((s, x) => s + Number(x.amount), 0)
  const monthTxns = txns.filter(t => sameMonth(t.date, curM, curY))
  const curIncome = monthTxns.filter(t => t.type === 'income').reduce((s, x) => s + Number(x.amount), 0)
  const curExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, x) => s + Number(x.amount), 0) + totalSubs
  const balance = curIncome - curExpense

  const catMap = {}
  subs.forEach(s => { catMap[s.category] = (catMap[s.category] || 0) + Number(s.amount) })
  monthTxns.filter(t => t.type === 'expense').forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount) })
  const cats = Object.entries(catMap).map(([name, amount]) => ({
    name, amount, color: (CAT_META[name] || CAT_META['อื่นๆ']).color, icon: (CAT_META[name] || CAT_META['อื่นๆ']).icon,
    pct: curExpense ? Math.round(amount / curExpense * 100) : 0,
  })).sort((a, b) => b.amount - a.amount)

  const cashflow = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(curY, curM - i, 1), mm = d.getMonth(), yy = d.getFullYear()
    const inc = txns.filter(t => t.type === 'income' && sameMonth(t.date, mm, yy)).reduce((s, x) => s + Number(x.amount), 0)
    const exp = txns.filter(t => t.type === 'expense' && sameMonth(t.date, mm, yy)).reduce((s, x) => s + Number(x.amount), 0) + totalSubs
    cashflow.push({ label: MONTHS[mm], inc, exp, cur: i === 0 })
  }
  const prevNet = cashflow[4].inc - cashflow[4].exp
  const changePct = prevNet ? Math.round((balance - prevNet) / Math.abs(prevNet) * 100) : 0
  const upcoming = subs.filter(s => s.billing_day >= today && s.billing_day <= today + 7).sort((a, b) => a.billing_day - b.billing_day)

  return { totalSubs, curIncome, curExpense, balance, cats, cashflow, changePct, upcoming, today }
}

function StatTile({ label, value, color, icon }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '15px 17px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.3px', marginBottom: 8 }}>{icon && <Icon n={icon} s={14} style={{ color }} />}{label}</div>
      <div style={{ fontSize: 21, fontWeight: 800, color: color || 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}

// ───────────────────── Dashboard ─────────────────────
export function DashboardView({ subs, txns, currency, mobile, goTab }) {
  const st = buildStats(subs, txns)
  const bal = split(st.balance, currency)
  const maxV = Math.max(...st.cashflow.map(m => m.inc), ...st.cashflow.map(m => m.exp), 1)
  const recent = [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, mobile ? 4 : 5)
  const donutCats = st.cats.slice(0, 6)
  const dTotal = donutCats.reduce((s, c) => s + c.amount, 0) || 1
  const R = 54, C = 2 * Math.PI * R
  let acc = 0
  const segs = donutCats.map(c => { const f = c.amount / dTotal; const seg = { color: c.color, dash: f * C, off: -acc * C }; acc += f; return seg })
  const grid = (cols) => ({ display: 'grid', gridTemplateColumns: mobile ? '1fr' : cols, gap: 16 })

  return (
    <div className="mt-anim" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={grid('1.5fr 1fr')}>
        {/* Hero */}
        <div style={{ background: 'var(--grad-hero)', borderRadius: 'var(--radius)', padding: mobile ? '20px 20px 22px' : '24px 26px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px -22px rgba(26,60,143,.8)' }}>
          <div style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.09)' }} />
          <div style={{ position: 'absolute', right: 40, bottom: -70, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, opacity: .85, fontWeight: 600 }}><Icon n="ti-wallet" s={15} /> ยอดคงเหลือเดือนนี้</div>
            <div style={{ fontSize: mobile ? 36 : 44, fontWeight: 800, letterSpacing: '-1.2px', margin: '8px 0 16px', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              <span style={{ fontSize: '.55em', fontWeight: 700, opacity: .8 }}>{bal.sym}</span>{bal.int}<span style={{ fontSize: '.5em', opacity: .6 }}>.{bal.dec}</span>
              <span style={{ fontSize: 12, fontWeight: 700, background: 'rgba(127,255,218,.2)', color: '#9dffe0', padding: '4px 10px', borderRadius: 20, marginLeft: 12, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                <Icon n={st.changePct >= 0 ? 'ti-trending-up' : 'ti-trending-down'} s={13} /> {st.changePct >= 0 ? '+' : ''}{st.changePct}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.13)', borderRadius: 16, padding: '12px 14px' }}>
                <div style={{ fontSize: 11.5, opacity: .85, marginBottom: 4 }}><Icon n="ti-arrow-down-left" s={13} style={{ color: '#9dffe0' }} /> รายรับ</div>
                <div style={{ fontSize: mobile ? 17 : 19, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtShort(st.curIncome, currency)}</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,.13)', borderRadius: 16, padding: '12px 14px' }}>
                <div style={{ fontSize: 11.5, opacity: .85, marginBottom: 4 }}><Icon n="ti-arrow-up-right" s={13} style={{ color: '#ffc4c4' }} /> รายจ่าย</div>
                <div style={{ fontSize: mobile ? 17 : 19, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtShort(st.curExpense, currency)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Donut */}
        <Card>
          <SectionTitle>สัดส่วนค่าใช้จ่าย</SectionTitle>
          {donutCats.length === 0 ? <Empty icon="ti-chart-donut">ยังไม่มีรายจ่ายเดือนนี้ครับ</Empty> : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <svg width="132" height="132" viewBox="0 0 132 132" style={{ flexShrink: 0 }}>
                <g transform="rotate(-90 66 66)">
                  {segs.map((s, i) => <circle key={i} cx="66" cy="66" r={R} fill="none" stroke={s.color} strokeWidth="19" strokeDasharray={`${s.dash} ${C - s.dash}`} strokeDashoffset={s.off} />)}
                </g>
                <text x="66" y="60" textAnchor="middle" fontSize="11" fill="var(--muted)" fontWeight="600">รวมจ่าย</text>
                <text x="66" y="79" textAnchor="middle" fontSize="15" fill="var(--text)" fontWeight="800">{fmtShort(st.curExpense, currency)}</text>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                {donutCats.slice(0, 5).map(c => (
                  <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, minWidth: 0 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    </span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', flexShrink: 0, marginLeft: 8 }}>{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div style={grid('1.5fr 1fr')}>
        {/* Cashflow */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>กระแสเงินสด 6 เดือน</span>
            <Badge tone={st.balance >= 0 ? 'teal' : 'red'}>{st.balance >= 0 ? 'เก็บได้ ' : 'ขาด '}{fmtShort(Math.abs(st.balance), currency)}</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: mobile ? 10 : 16, height: 130 }}>
            {st.cashflow.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 4, alignItems: 'flex-end', height: 100 }}>
                  <div title={'รับ ' + fmtShort(m.inc, currency)} style={{ width: mobile ? 9 : 12, height: Math.max(4, Math.round(m.inc / maxV * 100)), background: m.cur ? 'var(--grad)' : 'var(--teal)', opacity: m.cur ? 1 : .55, borderRadius: '5px 5px 0 0' }} />
                  <div title={'จ่าย ' + fmtShort(m.exp, currency)} style={{ width: mobile ? 9 : 12, height: Math.max(4, Math.round(m.exp / maxV * 100)), background: 'var(--red)', opacity: m.cur ? .9 : .4, borderRadius: '5px 5px 0 0' }} />
                </div>
                <div style={{ fontSize: 11.5, color: m.cur ? 'var(--primary)' : 'var(--muted-2)', fontWeight: m.cur ? 700 : 500 }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14, justifyContent: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--teal)' }} />รายรับ</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--red)' }} />รายจ่าย</span>
          </div>
        </Card>

        {/* Upcoming */}
        <Card>
          <SectionTitle action="ดูทั้งหมด" onAction={() => goTab('subscriptions')}>จะถึงเร็วๆ นี้</SectionTitle>
          {st.upcoming.length === 0 ? <Empty icon="ti-calendar-check">ไม่มีใน 7 วันข้างหน้าครับ</Empty> :
            st.upcoming.map(s => {
              const diff = s.billing_day - st.today
              return (
                <div key={s.id} className="mt-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 8px', margin: '0 -8px' }}>
                  <ItemIcon item={s} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 1 }}>หักวันที่ {s.billing_day}</div>
                  </div>
                  <Badge tone={diff <= 1 ? 'red' : 'amber'}>{diff === 0 ? 'วันนี้' : diff === 1 ? 'พรุ่งนี้' : 'ใน ' + diff + ' วัน'}</Badge>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red-ink)', marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>{fmtShort(s.amount, currency)}</div>
                </div>
              )
            })}
        </Card>
      </div>

      {/* Recent */}
      <Card>
        <SectionTitle action="ดูทั้งหมด" onAction={() => goTab('transactions')}>รายการล่าสุด</SectionTitle>
        {recent.length === 0 ? <Empty>ยังไม่มีรายการครับ</Empty> :
          recent.map(t => (
            <div key={t.id} className="mt-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 8px', margin: '0 -8px' }}>
              <ItemIcon item={{ ...t, color: t.type === 'income' ? '#00b894' : (CAT_META[t.category] || {}).color, icon: t.icon }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 1 }}>{t.category} · {new Date(t.date).getDate()} {MONTHS[new Date(t.date).getMonth()]}</div>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: t.type === 'income' ? 'var(--teal-ink)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{t.type === 'income' ? '+' : '−'}{fmtShort(t.amount, currency)}</div>
            </div>
          ))}
      </Card>
    </div>
  )
}

// ───────────────────── Subscriptions ─────────────────────
export function SubscriptionsView({ subs, currency, mobile, openAddSub, openEditSub, delSub }) {
  const today = new Date().getDate()
  const total = subs.reduce((s, x) => s + Number(x.amount), 0)
  const soon = subs.filter(s => s.billing_day >= today && s.billing_day <= today + 7).length
  return (
    <div className="mt-anim" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: mobile ? 10 : 14 }}>
        <StatTile label="รวมต่อเดือน" value={fmtShort(total, currency)} color="var(--primary)" icon="ti-cash" />
        <StatTile label="ทั้งหมด" value={subs.length + ' รายการ'} icon="ti-stack-2" />
        <StatTile label="ใกล้ถึง" value={soon + ' รายการ'} color="var(--amber-ink)" icon="ti-clock-hour-4" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>Subscription ทั้งหมด</span>
        <AddButton onClick={openAddSub} icon="ti-plus">เพิ่ม</AddButton>
      </div>
      <Card pad={mobile ? 14 : 20}>
        {subs.length === 0 ? <Empty icon="ti-repeat">ยังไม่มี subscription ครับ กด “เพิ่ม” เพื่อเริ่มเลย</Empty> :
          subs.map((sub, i) => {
            const diff = sub.billing_day - today
            const isSoon = diff >= 0 && diff <= 7
            return (
              <div key={sub.id} className="mt-row" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 10px', margin: '0 -10px', borderBottom: i === subs.length - 1 ? 'none' : '1px solid var(--border-2)' }}>
                <ItemIcon item={sub} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 11, background: 'var(--surface-3)', color: 'var(--muted)', borderRadius: 20, padding: '2px 9px', fontWeight: 600 }}>{sub.category}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>หักวันที่ {sub.billing_day}</span>
                  </div>
                </div>
                {!mobile && <div style={{ textAlign: 'right', marginRight: 6 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--red-ink)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(sub.amount, currency)}<span style={{ fontSize: 11, color: 'var(--muted-2)', fontWeight: 500 }}>/ด.</span></div>
                  <Badge tone={isSoon ? 'amber' : 'teal'} style={{ marginTop: 3, display: 'inline-block' }}>{isSoon ? 'เร็วๆนี้' : 'ปกติ'}</Badge>
                </div>}
                {mobile && <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red-ink)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(sub.amount, currency)}</div>}
                <div style={{ display: 'flex', gap: 2 }}>
                  <button onClick={() => openEditSub(sub)} className="mt-btn" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="ti-pencil" s={17} /></button>
                  <button onClick={() => delSub(sub.id)} className="mt-btn" style={{ background: 'none', border: 'none', color: 'var(--muted-2)', cursor: 'pointer', width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="ti-trash" s={17} /></button>
                </div>
              </div>
            )
          })}
      </Card>
    </div>
  )
}

// ───────────────────── Transactions ─────────────────────
export function TransactionsView({ txns, currency, mobile, filterMonth, setFilterMonth, openAddTxn, delTxn, totalSubs }) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { month: d.getMonth(), year: d.getFullYear(), label: MONTHS[d.getMonth()] + ' ' + (d.getFullYear() + 543).toString().slice(-2) }
  })
  const filtered = filterMonth
    ? txns.filter(t => { const d = new Date(t.date); return d.getMonth() === filterMonth.month && d.getFullYear() === filterMonth.year })
    : txns
  const inc = filtered.filter(t => t.type === 'income').reduce((s, x) => s + Number(x.amount), 0)
  const exp = filtered.filter(t => t.type === 'expense').reduce((s, x) => s + Number(x.amount), 0) + (filterMonth ? 0 : totalSubs)
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date))
  const chip = (active) => ({ flexShrink: 0, padding: '8px 15px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 600, color: active ? 'var(--on-primary)' : 'var(--muted)', background: active ? 'var(--grad)' : 'var(--surface)', boxShadow: active ? '0 8px 16px -8px rgba(26,60,143,.7)' : 'var(--shadow)', border: active ? 'none' : '1px solid var(--border-2)' })

  return (
    <div className="mt-anim" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="mt-scroll" style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilterMonth(null)} className="mt-btn" style={chip(!filterMonth)}>ทั้งหมด</button>
        {months.map((m, i) => (
          <button key={i} onClick={() => setFilterMonth(m)} className="mt-btn" style={chip(filterMonth && filterMonth.month === m.month && filterMonth.year === m.year)}>{m.label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: mobile ? 10 : 14 }}>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '15px 18px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-2)', borderLeft: '4px solid var(--teal)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 7 }}><Icon n="ti-arrow-down-left" s={14} style={{ color: 'var(--teal-ink)' }} /> รายรับ{filterMonth ? '' : 'เดือนนี้'}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--teal-ink)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(inc, currency)}</div>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '15px 18px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-2)', borderLeft: '4px solid var(--red)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 7 }}><Icon n="ti-arrow-up-right" s={14} style={{ color: 'var(--red-ink)' }} /> รายจ่าย{filterMonth ? '' : 'เดือนนี้'}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red-ink)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(exp, currency)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>{filterMonth ? 'รายการ ' + filterMonth.label : 'รายการทั้งหมด'} <span style={{ color: 'var(--muted-2)', fontWeight: 600, fontSize: 13 }}>({filtered.length})</span></span>
        <AddButton onClick={openAddTxn} icon="ti-plus">เพิ่ม</AddButton>
      </div>
      <Card pad={mobile ? 14 : 20}>
        {sorted.length === 0 ? <Empty>ไม่มีรายการในช่วงนี้ครับ</Empty> :
          sorted.map((t, i) => (
            <div key={t.id} className="mt-row" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 10px', margin: '0 -10px', borderBottom: i === sorted.length - 1 ? 'none' : '1px solid var(--border-2)' }}>
              <ItemIcon item={{ ...t, color: t.type === 'income' ? '#00b894' : (CAT_META[t.category] || {}).color, icon: t.icon || (t.type === 'income' ? 'ti-arrow-down-left' : 'ti-arrow-up-right') }} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 11, background: 'var(--surface-3)', color: 'var(--muted)', borderRadius: 20, padding: '2px 9px', fontWeight: 600 }}>{t.category}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{new Date(t.date).getDate()} {MONTHS[new Date(t.date).getMonth()]}</span>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: t.type === 'income' ? 'var(--teal-ink)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{t.type === 'income' ? '+' : '−'}{fmtShort(t.amount, currency)}</div>
              <button onClick={() => delTxn(t.id)} className="mt-btn" style={{ background: 'none', border: 'none', color: 'var(--muted-2)', cursor: 'pointer', width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon n="ti-trash" s={17} /></button>
            </div>
          ))}
      </Card>
    </div>
  )
}

// ───────────────────── Alerts ─────────────────────
export function AlertsView({ subs, txns, currency, mobile }) {
  const st = buildStats(subs, txns)
  return (
    <div className="mt-anim" style={{ display: mobile ? 'block' : 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: mobile ? 16 : 0 }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>การแจ้งเตือน</span>
        {st.upcoming.length === 0 && <Card pad={16}><div style={{ display: 'flex', alignItems: 'center', gap: 11, color: 'var(--muted)', fontSize: 13.5 }}><Icon n="ti-circle-check" s={20} style={{ color: 'var(--teal-ink)' }} /> ไม่มี subscription ใกล้ตัดบัญชีใน 7 วันนี้ครับ</div></Card>}
        {st.upcoming.map(s => {
          const diff = s.billing_day - st.today
          return (
            <div key={s.id} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '13px 16px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: diff <= 1 ? 'var(--red-soft)' : 'var(--amber-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon n="ti-bell-ringing" s={19} style={{ color: diff <= 1 ? 'var(--red-ink)' : 'var(--amber-ink)' }} /></div>
              <div style={{ flex: 1, fontSize: 13.5 }}><b>{s.name}</b> จะหักเงิน {fmtShort(s.amount, currency)} {diff === 0 ? 'วันนี้' : diff === 1 ? 'พรุ่งนี้' : 'ใน ' + diff + ' วัน'}</div>
              <Badge tone={diff <= 1 ? 'red' : 'amber'}>{diff === 0 ? 'วันนี้' : 'ใน ' + diff + 'ว.'}</Badge>
            </div>
          )
        })}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '13px 16px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: st.balance >= 0 ? 'var(--teal-soft)' : 'var(--red-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon n={st.balance >= 0 ? 'ti-mood-happy' : 'ti-mood-sad'} s={20} style={{ color: st.balance >= 0 ? 'var(--teal-ink)' : 'var(--red-ink)' }} /></div>
          <div style={{ flex: 1, fontSize: 13.5 }}>{st.balance >= 0 ? <>ยอดคงเหลือเดือนนี้ <b>{fmtShort(st.balance, currency)}</b> — อยู่ในเกณฑ์ดี 👍</> : <>เดือนนี้รายจ่ายเกินรายรับ <b>{fmtShort(Math.abs(st.balance), currency)}</b></>}</div>
        </div>
      </div>
      <Card>
        <SectionTitle>สรุป Subscription รายเดือน</SectionTitle>
        {subs.map((sub, i) => (
          <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i === subs.length - 1 ? 'none' : '1px solid var(--border-2)' }}>
            <ItemIcon item={sub} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{sub.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 1 }}>หักวันที่ {sub.billing_day} ทุกเดือน</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red-ink)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(sub.amount, currency)}</div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1.5px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>รวมต่อเดือน</span>
          <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>{fmtShort(st.totalSubs, currency)}</span>
        </div>
      </Card>
    </div>
  )
}
