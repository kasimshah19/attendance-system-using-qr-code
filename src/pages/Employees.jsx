import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import Layout from '../components/Layout'
import QRModal from '../components/QRModal'
import { supabase } from '../lib/supabase'

function IconPlus() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}
function IconQR() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><rect x="3" y="16" width="5" height="5"/><rect x="10" y="10" width="2" height="2"/><rect x="14" y="10" width="2" height="2"/><rect x="10" y="14" width="2" height="2"/><rect x="14" y="14" width="2" height="2"/><rect x="18" y="14" width="2" height="2"/><rect x="18" y="18" width="2" height="2"/><rect x="14" y="18" width="2" height="2"/></svg>
}
function IconEdit() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}
function IconTrash() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
}

function EmployeeModal({ employee, onClose, onSaved }) {
  const isEdit = !!employee?.id
  const [name, setName]           = useState(employee?.name ?? '')
  const [startTime, setStartTime] = useState(employee?.start_time?.slice(0, 5) ?? '09:00')
  const [endTime, setEndTime]     = useState(employee?.end_time?.slice(0, 5) ?? '18:00')
  const [graceMins, setGraceMins] = useState(employee?.late_grace_mins ?? 30)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Name is required.')
    if (startTime >= endTime) return setError('End time must be after start time.')
    const grace = parseInt(graceMins, 10)
    if (isNaN(grace) || grace < 0 || grace > 120) return setError('Late grace must be between 0 and 120 minutes.')
    setSaving(true)
    try {
      const payload = { name: name.trim(), start_time: startTime, end_time: endTime, late_grace_mins: grace }
      if (isEdit) {
        const { error: err } = await supabase.from('employees').update(payload).eq('id', employee.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('employees').insert({ ...payload, qr_token: crypto.randomUUID() })
        if (err) throw err
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Failed to save employee.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="modal"
        initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>

        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="e.g. Ahmed Khan" value={name}
              onChange={e => setName(e.target.value)} required autoFocus />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Shift Start</label>
              <input type="time" className="form-input" value={startTime}
                onChange={e => setStartTime(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Shift End</label>
              <input type="time" className="form-input" value={endTime}
                onChange={e => setEndTime(e.target.value)} required />
            </div>
          </div>

          {/* ── Flexible Late Grace ── */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Late Grace Period</span>
              <span style={{ color: 'var(--blue-bright)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {graceMins} min
              </span>
            </label>
            <input
              type="range" min={0} max={120} step={5}
              value={graceMins}
              onChange={e => setGraceMins(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--blue)', marginBottom: 4 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>0 min (strict)</span>
              <span>60 min</span>
              <span>120 min (lenient)</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              Employee can arrive up to <strong style={{ color: 'var(--text-secondary)' }}>{graceMins} minutes</strong> after shift start before being marked late.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function DeleteConfirm({ employee, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  async function handleDelete() {
    setDeleting(true)
    await supabase.from('employees').delete().eq('id', employee.id)
    onDeleted()
  }
  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div className="modal" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }} style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ color: 'var(--danger)' }}>Delete Employee</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{employee.name}</strong>?
        </p>
        <p style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 24 }}>
          This will also delete all their attendance records and invalidate their QR code permanently.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Employees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showAdd, setShowAdd]     = useState(false)
  const [editEmp, setEditEmp]     = useState(null)
  const [deleteEmp, setDeleteEmp] = useState(null)
  const [qrEmp, setQrEmp]         = useState(null)

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    setLoading(true)
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false })
    setEmployees(data ?? [])
    setLoading(false)
  }

  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))

  function fmt12(timeStr) {
    if (!timeStr) return '—'
    const [h, m] = timeStr.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
  }

  return (
    <Layout>
      <AnimatePresence>
        {showAdd   && <EmployeeModal employee={null}    onClose={() => setShowAdd(false)}  onSaved={() => { setShowAdd(false);  fetchEmployees() }} />}
        {editEmp   && <EmployeeModal employee={editEmp} onClose={() => setEditEmp(null)}    onSaved={() => { setEditEmp(null);   fetchEmployees() }} />}
        {deleteEmp && <DeleteConfirm employee={deleteEmp} onClose={() => setDeleteEmp(null)} onDeleted={() => { setDeleteEmp(null); fetchEmployees() }} />}
        {qrEmp     && <QRModal employee={qrEmp} onClose={() => setQrEmp(null)} />}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Employees</h1>
            <p className="page-subtitle">{employees.length} total · Manage staff, timings & QR codes</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <IconPlus /> Add Employee
          </button>
        </div>

        <div className="page-body">
          <div className="filter-bar" style={{ marginBottom: 20 }}>
            <input className="form-input" style={{ maxWidth: 280 }} placeholder="Search employees..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading employees...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <h3>{search ? 'No results found' : 'No employees yet'}</h3>
              <p>{search ? `No employee matches "${search}"` : 'Click "Add Employee" to get started.'}</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Shift Start</th>
                    <th>Shift End</th>
                    <th>Late Grace</th>
                    <th>Added On</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.map((emp, i) => (
                      <motion.tr key={emp.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                        <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {String(i + 1).padStart(2, '0')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--blue), #1e40af)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                              color: '#fff', flexShrink: 0
                            }}>
                              {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500 }}>{emp.name}</span>
                          </div>
                        </td>
                        <td><span className="mono" style={{ color: 'var(--success)' }}>{fmt12(emp.start_time)}</span></td>
                        <td><span className="mono" style={{ color: 'var(--danger)' }}>{fmt12(emp.end_time)}</span></td>
                        <td>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: 'var(--warning-dim)', color: 'var(--warning)',
                            border: '1px solid rgba(245,158,11,0.2)',
                            borderRadius: 99, padding: '2px 10px',
                            fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600
                          }}>
                            ⏱ {emp.late_grace_mins ?? 30}m
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          {format(new Date(emp.created_at), 'MMM d, yyyy')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setQrEmp(emp)} title="View QR Code">
                              <IconQR /> QR
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditEmp(emp)} title="Edit">
                              <IconEdit />
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteEmp(emp)} title="Delete">
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  )
}
