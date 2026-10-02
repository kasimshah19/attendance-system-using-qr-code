import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

function IconDownload() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
}

function IconFilter() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
}

function dur(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '—'
  const mins = Math.round((new Date(checkOut) - new Date(checkIn)) / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

function fmt(ts) {
  if (!ts) return '—'
  return format(new Date(ts), 'hh:mm a')
}

export default function Attendance() {
  const [mode, setMode] = useState('day') // 'day' | 'month'
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [empFilter, setEmpFilter] = useState('all')

  useEffect(() => {
    supabase.from('employees').select('id,name').order('name').then(({ data }) => setEmployees(data ?? []))
  }, [])

  useEffect(() => { fetchRecords() }, [mode, selectedDate, selectedMonth, empFilter])

  async function fetchRecords() {
    setLoading(true)
    let query = supabase.from('attendance').select('*, employees(id,name,start_time,end_time)')

    if (mode === 'day') {
      query = query.eq('date', selectedDate)
    } else {
      const month = parseISO(selectedMonth + '-01')
      query = query
        .gte('date', format(startOfMonth(month), 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth(month), 'yyyy-MM-dd'))
    }

    if (empFilter !== 'all') query = query.eq('employee_id', empFilter)

    const { data } = await query.order('date', { ascending: false }).order('check_in_time', { ascending: false })
    setRecords(data ?? [])
    setLoading(false)
  }

  function exportCSV() {
    const headers = ['Date', 'Employee', 'Check In', 'Check Out', 'Status', 'Duration', 'Late Reason', 'Early Checkout Reason']
    const rows = records.map(r => [
      r.date,
      r.employees?.name ?? '',
      fmt(r.check_in_time),
      fmt(r.check_out_time),
      r.check_in_status ?? '—',
      dur(r.check_in_time, r.check_out_time),
      r.late_reason ?? '',
      r.early_checkout_reason ?? ''
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `MZR-Attendance-${mode === 'day' ? selectedDate : selectedMonth}.csv`
    link.click()
  }

  const present = records.filter(r => r.check_in_time).length
  const late = records.filter(r => r.check_in_status === 'late').length
  const earlyOut = records.filter(r => r.check_out_status === 'early').length

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Attendance Records</h1>
            <p className="page-subtitle">View and export attendance data</p>
          </div>
          <button className="btn btn-secondary" onClick={exportCSV} disabled={records.length === 0}>
            <IconDownload /> Export CSV
          </button>
        </div>

        <div className="page-body">
          {/* Filters */}
          <div className="card card-sm" style={{ marginBottom: 24 }}>
            <div className="filter-bar">
              <IconFilter />

              {/* Mode Toggle */}
              <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
                {['day', 'month'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      padding: '7px 16px', fontSize: 13, fontWeight: 500,
                      background: mode === m ? 'var(--blue)' : 'transparent',
                      color: mode === m ? '#fff' : 'var(--text-secondary)',
                      transition: 'all 0.18s', border: 'none', cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {m === 'day' ? 'Daily' : 'Monthly'}
                  </button>
                ))}
              </div>

              {mode === 'day' ? (
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto' }}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  min="2026-05-01"
                />
              ) : (
                <input
                  type="month"
                  className="form-input"
                  style={{ width: 'auto' }}
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  min="2026-05"
                />
              )}

              <select
                className="form-input"
                style={{ width: 'auto' }}
                value={empFilter}
                onChange={e => setEmpFilter(e.target.value)}
              >
                <option value="all">All Employees</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          {/* Summary row */}
          {!loading && records.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Records', val: records.length, cls: 'badge-info' },
                { label: 'Check-ins', val: present, cls: 'badge-success' },
                { label: 'Late', val: late, cls: 'badge-warning' },
                { label: 'Early Checkout', val: earlyOut, cls: 'badge-danger' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span className={`badge ${s.cls}`}>{s.val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Fetching records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
              </div>
              <h3>No records found</h3>
              <p>No attendance data for the selected period.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {mode === 'month' && <th>Date</th>}
                    <th>Employee</th>
                    <th>Check In</th>
                    <th>Status</th>
                    <th>Check Out</th>
                    <th>Out Status</th>
                    <th>Duration</th>
                    <th>Late Reason</th>
                    <th>Early Out Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, i) => (
                    <motion.tr
                      key={rec.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    >
                      {mode === 'month' && (
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                          {format(parseISO(rec.date), 'MMM d, EEE')}
                        </td>
                      )}
                      <td style={{ fontWeight: 500 }}>{rec.employees?.name ?? '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{fmt(rec.check_in_time)}</td>
                      <td>
                        {rec.check_in_time ? (
                          <span className={`badge ${rec.check_in_status === 'late' ? 'badge-warning' : 'badge-success'}`}>
                            {rec.check_in_status === 'late' ? 'Late' : 'On Time'}
                          </span>
                        ) : <span className="badge badge-muted">Absent</span>}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{fmt(rec.check_out_time)}</td>
                      <td>
                        {rec.check_out_time ? (
                          <span className={`badge ${rec.check_out_status === 'early' ? 'badge-danger' : 'badge-info'}`}>
                            {rec.check_out_status === 'early' ? 'Early' : 'Full Day'}
                          </span>
                        ) : rec.check_in_time ? <span className="badge badge-muted">In Office</span> : null}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {dur(rec.check_in_time, rec.check_out_time)}
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 160 }}>
                        {rec.late_reason ? (
                          <span title={rec.late_reason} style={{ color: 'var(--warning)' }}>
                            {rec.late_reason.length > 40 ? rec.late_reason.slice(0, 40) + '…' : rec.late_reason}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 160 }}>
                        {rec.early_checkout_reason ? (
                          <span title={rec.early_checkout_reason} style={{ color: 'var(--danger)' }}>
                            {rec.early_checkout_reason.length > 40 ? rec.early_checkout_reason.slice(0, 40) + '…' : rec.early_checkout_reason}
                          </span>
                        ) : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  )
}
