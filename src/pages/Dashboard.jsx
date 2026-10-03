import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

// ── Icons ──────────────────────────────────────────────────────
function IconUsers()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IconCheck()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function IconClock()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function IconX()        { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function IconMsg()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function IconClose()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, color, icon, delay = 0 }) {
  return (
    <motion.div className={`stat-card ${color}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  )
}

// ── Late Reason Popup ─────────────────────────────────────────
function LateReasonPopup({ record, onClose }) {
  if (!record) return null
  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
        style={{ zIndex: 200 }}
      >
        <motion.div
          initial={{ scale: 0.88, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.88, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '28px 32px',
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--warning-dim)', color: 'var(--warning)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 99, padding: '3px 12px', fontSize: 12,
                fontFamily: 'var(--font-display)', fontWeight: 600,
                marginBottom: 10
              }}>
                ⚠ Late Arrival
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: 20,
                fontWeight: 700, color: 'var(--text-primary)', margin: 0
              }}>
                {record.employees?.name}
              </h3>
            </div>
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: 6,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 2
            }}>
              <IconClose />
            </button>
          </div>

          {/* Time info */}
          <div className="form-row-2" style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 18px', marginBottom: 18
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Shift Start
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-primary)', fontWeight: 600 }}>
                {record.employees?.start_time?.slice(0, 5) ?? '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Checked In
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--warning)', fontWeight: 600 }}>
                {record.check_in_time ? format(new Date(record.check_in_time), 'hh:mm a') : '—'}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <div style={{
              fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5
            }}>
              <IconMsg /> Reason Given
            </div>
            <div style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 10, padding: '14px 16px',
              fontSize: 14, color: 'var(--text-primary)',
              lineHeight: 1.65, fontStyle: 'italic'
            }}>
              "{record.late_reason || 'No reason provided.'}"
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 20, justifyContent: 'center' }}
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Late Today Panel ──────────────────────────────────────────
function LatePanel({ lateRecords }) {
  const [selected, setSelected] = useState(null)

  if (lateRecords.length === 0) return null

  return (
    <>
      {selected && <LateReasonPopup record={selected} onClose={() => setSelected(null)} />}

      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.4 }}
        style={{ borderColor: 'rgba(245,158,11,0.2)', marginBottom: 24 }}
      >
        {/* Panel header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            background: 'var(--warning-dim)', color: 'var(--warning)',
            borderRadius: 8, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <IconClock />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
              Late Arrivals Today
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {lateRecords.length} employee{lateRecords.length !== 1 ? 's' : ''} arrived late · Click a row to see reason
            </p>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {lateRecords.map((rec, i) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.42 + i * 0.06 }}
              onClick={() => setSelected(rec)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 14px', borderRadius: 8, cursor: 'pointer',
                transition: 'background 0.15s', gap: 12,
                borderBottom: i < lateRecords.length - 1 ? '1px solid var(--border)' : 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--warning), #b45309)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: '#000'
                }}>
                  {rec.employees?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rec.employees?.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                    Shift: {rec.employees?.start_time?.slice(0, 5)} · In: {format(new Date(rec.check_in_time), 'hh:mm a')}
                  </div>
                </div>
              </div>

              {/* Reason preview + click hint */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{
                  maxWidth: 180, fontSize: 12, color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  fontStyle: 'italic'
                }}>
                  {rec.late_reason ? `"${rec.late_reason}"` : 'No reason'}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'var(--warning-dim)', color: 'var(--warning)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 99, padding: '3px 10px', fontSize: 11,
                  fontFamily: 'var(--font-display)', fontWeight: 600, whiteSpace: 'nowrap'
                }}>
                  <IconMsg /> View
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats]   = useState({ total: 0, present: 0, late: 0, absent: 0 })
  const [recent, setRecent] = useState([])
  const [lateRecs, setLateRecs] = useState([])
  const [loading, setLoading]   = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    async function load() {
      const [
        { count: total },
        { data: todayAtt },
        { data: recentAtt },
        { data: lateAtt }
      ] = await Promise.all([
        supabase.from('employees').select('*', { count: 'exact', head: true }),

        supabase.from('attendance')
          .select('check_in_status')
          .eq('date', today)
          .not('check_in_time', 'is', null),

        supabase.from('attendance')
          .select('*, employees(name, start_time)')
          .eq('date', today)
          .order('check_in_time', { ascending: false })
          .limit(10),

        // Late arrivals with full employee info for reason panel
        supabase.from('attendance')
          .select('*, employees(name, start_time, end_time)')
          .eq('date', today)
          .eq('check_in_status', 'late')
          .not('check_in_time', 'is', null)
          .order('check_in_time', { ascending: true })
      ])

      const present = todayAtt?.length ?? 0
      const late    = todayAtt?.filter(r => r.check_in_status === 'late').length ?? 0
      setStats({ total: total ?? 0, present, late, absent: (total ?? 0) - present })
      setRecent(recentAtt ?? [])
      setLateRecs(lateAtt ?? [])
      setLoading(false)
    }
    load()
  }, [today])

  function fmtTime(ts) {
    if (!ts) return '—'
    return format(new Date(ts), 'hh:mm a')
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>

        <div className="page-body">
          {/* Stats */}
          <div className="grid-stats" style={{ marginBottom: 28 }}>
            <StatCard label="Total Employees" value={stats.total}   color="blue"  icon={<IconUsers />} delay={0}    />
            <StatCard label="Present Today"   value={stats.present} color="green" icon={<IconCheck />} delay={0.07} />
            <StatCard label="Late Today"      value={stats.late}    color="amber" icon={<IconClock />} delay={0.14} />
            <StatCard label="Absent Today"    value={stats.absent}  color="red"   icon={<IconX />}     delay={0.21} />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading data...</p>
            </div>
          ) : (
            <>
              {/* ── Late Arrivals Panel (only shown if someone is late) ── */}
              <LatePanel lateRecords={lateRecs} />

              {/* ── Today's Activity Feed ── */}
              <motion.div className="card"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  Today's Activity
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Live attendance feed for {format(new Date(), 'MMMM d, yyyy')}
                </p>

                {recent.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px 0' }}>
                    <p>No check-ins recorded today yet.</p>
                  </div>
                ) : (
                  recent.map(rec => {
                    const isLate  = rec.check_in_status === 'late'
                    const hasOut  = !!rec.check_out_time
                    return (
                      <div key={rec.id} className="activity-item">
                        <div className={`activity-dot ${hasOut ? 'blue' : isLate ? 'amber' : 'green'}`} />
                        <div style={{ flex: 1 }}>
                          <div className="activity-text">
                            <strong>{rec.employees?.name}</strong>{' '}
                            {hasOut
                              ? `checked out at ${fmtTime(rec.check_out_time)}`
                              : `checked in at ${fmtTime(rec.check_in_time)}`}
                            {isLate && !hasOut && (
                              <span className="badge badge-warning" style={{ marginLeft: 8, fontSize: 11 }}>LATE</span>
                            )}
                            {rec.check_out_status === 'early' && (
                              <span className="badge badge-danger" style={{ marginLeft: 8, fontSize: 11 }}>EARLY OUT</span>
                            )}
                          </div>
                          <div className="activity-time">
                            {hasOut
                              ? `In: ${fmtTime(rec.check_in_time)}  ·  Out: ${fmtTime(rec.check_out_time)}`
                              : fmtTime(rec.check_in_time)}
                          </div>
                        </div>
                        <span className={`badge ${hasOut ? 'badge-info' : isLate ? 'badge-warning' : 'badge-success'}`}
                          style={{ alignSelf: 'flex-start' }}>
                          {hasOut ? 'Completed' : isLate ? 'Late' : 'On Time'}
                        </span>
                      </div>
                    )
                  })
                )}
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    </Layout>
  )
}
