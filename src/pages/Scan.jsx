import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'

const LOGO = 'https://res.cloudinary.com/dpwla02b5/image/upload/v1778410266/MZRM-Logo-White_oxrhrq.webp'

// ── Time helpers ──────────────────────────────────────────────
function toMins(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function nowMins() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function nowTimestamp() { return new Date().toISOString() }

function todayDate() { return format(new Date(), 'yyyy-MM-dd') }

function fmtTime(ts) {
  if (!ts) return '—'
  return format(new Date(ts), 'hh:mm a')
}

// ── Geolocation Logic ──────────────────────────────────────────
const OFFICE_LAT = parseFloat(import.meta.env.VITE_OFFICE_LAT || '28.6139') // Default: New Delhi
const OFFICE_LNG = parseFloat(import.meta.env.VITE_OFFICE_LNG || '77.2090')
const ALLOWED_RADIUS = parseInt(import.meta.env.VITE_OFFICE_RADIUS || '100') // meters

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // in metres
}

// ── Scan logic ─────────────────────────────────────────────────
//
//  LATE_GRACE_MINS       → from employee.late_grace_mins (flexible per employee)
//  CHECKOUT_LOCK_MINS    = 120 → must wait 2h before checkout allowed
//  FREE_CHECKOUT_MINS    = 30  → within 30 mins of end_time → no reason needed
//
const CHECKOUT_LOCK_MINS = 120
const FREE_CHECKOUT_MINS = 30

// ── Icons ──────────────────────────────────────────────────────
function IconCheck({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IconClock({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

function IconDoor({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

function IconInfo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

function IconX({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

// ── Live Clock ─────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div>
      <div className="scan-time">{format(time, 'hh:mm:ss')}</div>
      <div className="scan-date">{format(time, 'EEEE, MMMM d, yyyy')}</div>
    </div>
  )
}

// ── Sub-screens ─────────────────────────────────────────────────
function NotFound() {
  return (
    <div className="scan-card">
      <div className="scan-logo" style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>ScanShift</div>
      <div className="scan-success-icon warning"><IconX size={32} /></div>
      <h2 className="scan-employee-name" style={{ color: 'var(--danger)' }}>Invalid QR Code</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
        This QR code is not recognized or has been deactivated.
        <br />Please contact your manager.
      </p>
    </div>
  )
}

function AlreadyDone({ employee, record }) {
  return (
    <div className="scan-card">
      <div className="scan-logo" style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>ScanShift</div>
      <div className="scan-success-icon check"><IconCheck size={32} /></div>
      <h2 className="scan-employee-name">{employee.name}</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '8px 0 20px' }}>
        Attendance completed for today.
      </p>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Check In</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--success)' }}>{fmtTime(record.check_in_time)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Check Out</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--blue-bright)' }}>{fmtTime(record.check_out_time)}</span>
        </div>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>See you tomorrow! 👋</p>
    </div>
  )
}

function TooSoon({ employee, record }) {
  const checkedInAt = fmtTime(record.check_in_time)
  const minsLeft = CHECKOUT_LOCK_MINS - Math.floor((Date.now() - new Date(record.check_in_time)) / 60000)
  return (
    <div className="scan-card">
      <div className="scan-logo" style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>ScanShift</div>
      <div className="scan-success-icon check"><IconInfo size={32} /></div>
      <h2 className="scan-employee-name">{employee.name}</h2>
      <div className="scan-status-badge info" style={{ margin: '12px auto 16px' }}>
        Already Checked In
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
        Checked in at <strong style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{checkedInAt}</strong>
      </p>
      <div style={{ background: 'var(--blue-dim)', border: '1px solid var(--border-active)', borderRadius: 10, padding: '14px 18px', fontSize: 13, color: 'var(--blue-bright)' }}>
        ⏱ Checkout available in approx. <strong>{minsLeft}</strong> min{minsLeft !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

function SuccessCheckIn({ employee, record, isLate }) {
  return (
    <div className="scan-card">
      <div className="scan-logo" style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>ScanShift</div>
      <motion.div
        className={`scan-success-icon ${isLate ? 'warning' : 'check'}`}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {isLate ? <IconClock size={32} /> : <IconCheck size={32} />}
      </motion.div>
      <motion.h2 className="scan-employee-name" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        {employee.name}
      </motion.h2>
      <motion.div
        className={`scan-status-badge ${isLate ? 'late' : 'on-time'}`}
        style={{ margin: '12px auto 20px' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
      >
        {isLate ? '⚠ Checked In — LATE' : '✓ Checked In — On Time'}
      </motion.div>
      <motion.div
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      >
        <div style={{ fontSize: 26, fontFamily: 'var(--font-mono)', fontWeight: 700, color: isLate ? 'var(--warning)' : 'var(--success)' }}>
          {fmtTime(record.check_in_time)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>
      </motion.div>
      {isLate && record.late_reason && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
          Reason: {record.late_reason}
        </p>
      )}
    </div>
  )
}

function SuccessCheckOut({ employee, record }) {
  const isEarly = record.check_out_status === 'early'
  return (
    <div className="scan-card">
      <div className="scan-logo" style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>ScanShift</div>
      <motion.div
        className={`scan-success-icon ${isEarly ? 'warning' : 'out'}`}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <IconDoor size={32} />
      </motion.div>
      <motion.h2 className="scan-employee-name" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        {employee.name}
      </motion.h2>
      <motion.div
        className={`scan-status-badge ${isEarly ? 'danger' : 'info'}`}
        style={{ margin: '12px auto 20px' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
      >
        {isEarly ? '⚡ Checked Out — Early' : '✓ Checked Out'}
      </motion.div>
      <motion.div
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 12 }}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>In</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--success)' }}>{fmtTime(record.check_in_time)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Out</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--blue-bright)' }}>{fmtTime(record.check_out_time)}</span>
        </div>
      </motion.div>
      {isEarly && record.early_checkout_reason && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Reason: {record.early_checkout_reason}</p>
      )}
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 16 }}>Have a great day! 🌟</p>
    </div>
  )
}

// ── Main Scan Component ─────────────────────────────────────────
export default function Scan() {
  const { token } = useParams()
  const [state, setState] = useState('loading') // see states above
  const [employee, setEmployee] = useState(null)
  const [record, setRecord] = useState(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token) initScan()
  }, [token])

  async function initScan() {
    setState('loading')

    // 1. Fetch employee by QR token
    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('*')
      .eq('qr_token', token)
      .single()

    if (empErr || !emp) { setState('not_found'); return }
    setEmployee(emp)

    // 2. Fetch today's attendance record
    const today = todayDate()
    const { data: att } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', emp.id)
      .eq('date', today)
      .maybeSingle()

    determineState(emp, att)
  }

  function determineState(emp, att) {
    const currentMins  = nowMins()
    const startMins    = toMins(emp.start_time)
    const endMins      = toMins(emp.end_time)
    const LATE_GRACE_MINS = emp.late_grace_mins ?? 30

    // Already fully completed
    if (att?.check_in_time && att?.check_out_time) {
      setRecord(att)
      setState('done')
      return
    }

    // Already checked in
    if (att?.check_in_time && !att?.check_out_time) {
      const checkedInAt = new Date(att.check_in_time)
      const minsSinceCheckIn = Math.floor((Date.now() - checkedInAt) / 60000)

      // Too soon to checkout (within 2 hours)
      if (minsSinceCheckIn < CHECKOUT_LOCK_MINS) {
        setRecord(att)
        setState('too_soon')
        return
      }

      // Checkout phase
      // Within 30 mins of end time OR past end time → free checkout
      if (currentMins >= endMins - FREE_CHECKOUT_MINS) {
        setRecord(att)
        setState('checkout_free')
      } else {
        // Early checkout → needs reason
        setRecord(att)
        setState('checkout_early')
      }
      return
    }

    // No check-in yet → check-in phase
    if (!att || !att.check_in_time) {
      if (currentMins <= startMins + LATE_GRACE_MINS) {
        setState('checkin_on_time')
      } else {
        setState('checkin_late')
      }
      setRecord(att ?? null)
      return
    }
  }

  function verifyLocationAndExecute(actionCallback) {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.")
      return
    }

    setSubmitting(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistance(OFFICE_LAT, OFFICE_LNG, latitude, longitude);
        
        if (distance <= ALLOWED_RADIUS) {
          actionCallback();
        } else {
          setSubmitting(false)
          setError(`You are ${Math.round(distance)} meters away. You must be inside the office to mark attendance.`);
        }
      },
      (geoError) => {
        setSubmitting(false)
        console.error("Geo error:", geoError);
        if (geoError.code === 1) {
          setError("Please allow location access (GPS) to verify you are at the office.");
        } else {
          setError("Could not get your location. Please ensure GPS is enabled.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function handleCheckIn() {
    if (state === 'checkin_late' && !reason.trim()) {
      setError('Please provide a reason for being late.')
      return
    }

    const isLate = state === 'checkin_late'
    const today = todayDate()
    const now = nowTimestamp()

    let newRecord
    let fetchError

    if (record?.id) {
      // update existing partial record
      const { data, error: err } = await supabase
        .from('attendance')
        .update({
          check_in_time: now,
          check_in_status: isLate ? 'late' : 'on_time',
          late_reason: isLate ? reason.trim() : null
        })
        .eq('id', record.id)
        .select()
        .single()
      newRecord = data
      fetchError = err
    } else {
      const { data, error: err } = await supabase
        .from('attendance')
        .insert({
          employee_id: employee.id,
          date: today,
          check_in_time: now,
          check_in_status: isLate ? 'late' : 'on_time',
          late_reason: isLate ? reason.trim() : null
        })
        .select()
        .single()
      newRecord = data
      fetchError = err
    }

    if (fetchError) {
      console.error('Check-in error:', fetchError)
      alert(`Check-in failed: ${fetchError.message}\n(Make sure attendance table has all columns including check_in_status and late_reason)`)
      setSubmitting(false)
      return
    }

    setRecord(newRecord)
    setState('success_in')
    setSubmitting(false)
  }

  async function handleCheckOut() {
    if (state === 'checkout_early' && !reason.trim()) {
      setError('Please provide a reason for early checkout.')
      return
    }

    const isEarly = state === 'checkout_early'
    const now = nowTimestamp()

    const { data: updatedRecord } = await supabase
      .from('attendance')
      .update({
        check_out_time: now,
        check_out_status: isEarly ? 'early' : 'on_time',
        early_checkout_reason: isEarly ? reason.trim() : null
      })
      .eq('id', record.id)
      .select()
      .single()

    setRecord(updatedRecord)
    setState('success_out')
    setSubmitting(false)
  }

  // ── Render States ──────────────────────────────────────────────
  function renderCard() {
    switch (state) {
      case 'loading':
        return (
          <div className="scan-card" style={{ padding: '60px 40px' }}>
            <div className="scan-logo" style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>ScanShift</div>
            <div className="spinner" style={{ margin: '24px auto 12px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Verifying QR code...</p>
          </div>
        )

      case 'not_found':
        return <NotFound />

      case 'done':
        return <AlreadyDone employee={employee} record={record} />

      case 'too_soon':
        return <TooSoon employee={employee} record={record} />

      case 'success_in':
        return <SuccessCheckIn employee={employee} record={record} isLate={record?.check_in_status === 'late'} />

      case 'success_out':
        return <SuccessCheckOut employee={employee} record={record} />

      // ── Check In : On Time ──────────────────────────────────────
      case 'checkin_on_time':
        return (
          <div className="scan-card">
            <div className="scan-logo" style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>ScanShift</div>
            <LiveClock />
            <h2 className="scan-employee-name">{employee.name}</h2>
            <div className="scan-status-badge on-time" style={{ margin: '12px auto 24px' }}>
              ✓ On Time — Tap to Check In
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Shift: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {employee.start_time?.slice(0, 5)} – {employee.end_time?.slice(0, 5)}
              </span>
              <span style={{ marginLeft: 10, color: 'var(--warning)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                ⏱ {employee.late_grace_mins ?? 30}m grace
              </span>
            </p>
            {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
            <button
              className="btn btn-primary btn-lg pulse"
              style={{ width: '100%', justifyContent: 'center', borderRadius: 10 }}
              onClick={() => verifyLocationAndExecute(handleCheckIn)}
              disabled={submitting}
            >
              {submitting ? 'Verifying Location...' : '✓ Check In'}
            </button>
          </div>
        )

      // ── Check In : Late ─────────────────────────────────────────
      case 'checkin_late':
        return (
          <div className="scan-card">
            <div className="scan-logo" style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>ScanShift</div>
            <LiveClock />
            <h2 className="scan-employee-name">{employee.name}</h2>
            <div className="scan-status-badge late" style={{ margin: '12px auto 20px' }}>
              ⚠ You are LATE
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Shift started at{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
                {employee.start_time?.slice(0, 5)}
              </span>
              . Please provide a reason to continue.
            </p>
            <div className="form-group" style={{ marginBottom: 16, textAlign: 'left' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
                Reason for being late <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                className="scan-textarea"
                placeholder="e.g. Traffic jam on main road..."
                value={reason}
                onChange={e => { setReason(e.target.value); setError('') }}
              />
            </div>
            {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', borderRadius: 10, background: 'var(--warning)', color: '#000' }}
              onClick={() => verifyLocationAndExecute(handleCheckIn)}
              disabled={submitting || !reason.trim()}
            >
              {submitting ? 'Verifying Location...' : '⚠ Submit & Check In Late'}
            </button>
          </div>
        )

      // ── Check Out : Free (within 30 mins of end or past end) ────
      case 'checkout_free':
        return (
          <div className="scan-card">
            <div className="scan-logo" style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>ScanShift</div>
            <LiveClock />
            <h2 className="scan-employee-name">{employee.name}</h2>
            <div className="scan-status-badge info" style={{ margin: '12px auto 20px' }}>
              Ready to Check Out
            </div>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Checked In</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--success)' }}>{fmtTime(record?.check_in_time)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Shift Ends</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>{employee.end_time?.slice(0, 5)}</span>
              </div>
            </div>
            {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', borderRadius: 10 }}
              onClick={() => verifyLocationAndExecute(handleCheckOut)}
              disabled={submitting}
            >
              {submitting ? 'Verifying Location...' : '→ Check Out'}
            </button>
          </div>
        )

      // ── Check Out : Early (needs reason) ───────────────────────
      case 'checkout_early':
        return (
          <div className="scan-card">
            <div className="scan-logo" style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>ScanShift</div>
            <LiveClock />
            <h2 className="scan-employee-name">{employee.name}</h2>
            <div className="scan-status-badge danger" style={{ margin: '12px auto 16px' }}>
              ⚡ Early Checkout
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Your shift ends at{' '}
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
                {employee.end_time?.slice(0, 5)}
              </span>
              . Please provide a reason for leaving early.
            </p>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Checked In At</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--success)' }}>{fmtTime(record?.check_in_time)}</span>
            </div>
            <div className="form-group" style={{ marginBottom: 16, textAlign: 'left' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
                Reason for early checkout <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                className="scan-textarea"
                placeholder="e.g. Doctor's appointment at 4 PM..."
                value={reason}
                onChange={e => { setReason(e.target.value); setError('') }}
              />
            </div>
            {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}
            <button
              className="btn btn-danger btn-lg"
              style={{ width: '100%', justifyContent: 'center', borderRadius: 10 }}
              onClick={() => verifyLocationAndExecute(handleCheckOut)}
              disabled={submitting || !reason.trim()}
            >
              {submitting ? 'Verifying Location...' : '⚡ Submit Early Checkout'}
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="scan-page">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 460, zIndex: 1 }}
        >
          {renderCard()}
        </motion.div>
      </AnimatePresence>

      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 24, zIndex: 1, position: 'relative' }}>
        ScanShift · Attendance Portal
      </p>
    </div>
  )
}
