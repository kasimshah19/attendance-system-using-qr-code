import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LOGO = 'https://res.cloudinary.com/dpwla02b5/image/upload/v1778410266/MZRM-Logo-White_oxrhrq.webp'

// Uses api.qrserver.com — free, no npm package needed
function QRImage({ value, size = 200 }) {
  const encoded = encodeURIComponent(value)
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&color=000000&bgcolor=ffffff&margin=10&format=svg`
  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      style={{ borderRadius: 8, display: 'block' }}
    />
  )
}

export default function QRModal({ employee, onClose }) {
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin
  const qrUrl  = `${appUrl}/scan/${employee.qr_token}`
  const encoded = encodeURIComponent(qrUrl)
  const qrApiBase = `https://api.qrserver.com/v1/create-qr-code/?color=000000&bgcolor=ffffff&margin=10&format=png`

  if (!employee) return null

  function handlePrint() {
    const win = window.open('', '_blank', 'width=420,height=620')
    win.document.write(`
      <html>
        <head>
          <title>QR – ${employee.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'DM Sans', sans-serif; }
            .card { text-align: center; border: 2px solid #000; border-radius: 16px; padding: 32px 28px; max-width: 320px; width: 100%; }
            .logo { margin-bottom: 20px; }
            .logo img { height: 26px; filter: invert(1); }
            .qr-wrap { display: flex; justify-content: center; margin: 0 auto 16px; }
            .qr-wrap img { border-radius: 8px; border: 1px solid #eee; }
            .name { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: #000; margin-bottom: 4px; }
            .timing { font-size: 13px; color: #555; margin-bottom: 8px; }
            .instruction { font-size: 11px; color: #888; font-style: italic; margin-bottom: 10px; }
            .url { font-size: 10px; color: #bbb; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo"><img src="${LOGO}" alt="MZR Media" /></div>
            <div class="qr-wrap">
              <img src="${qrApiBase}&size=220x220&data=${encoded}" width="220" height="220" />
            </div>
            <div class="name">${employee.name}</div>
            <div class="timing">${employee.start_time?.slice(0,5)} – ${employee.end_time?.slice(0,5)}</div>
            <div class="instruction">Scan to mark attendance</div>
            <div class="url">${qrUrl}</div>
          </div>
        </body>
      </html>
    `)
    win.document.close()
    // Wait for QR image to load before printing
    setTimeout(() => { win.focus(); win.print(); win.close() }, 1200)
  }

  function handleDownload() {
    const link = document.createElement('a')
    link.href = `${qrApiBase}&size=400x400&data=${encoded}`
    link.download = `QR-${employee.name.replace(/\s+/g, '-')}.png`
    link.target = '_blank'
    link.click()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ maxWidth: 380, textAlign: 'center' }}
        >
          <div className="modal-header">
            <span className="modal-title">QR Code</span>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          {/* QR Code — loaded from API */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 16px', background: '#fff', borderRadius: 12, margin: '0 0 16px' }}>
            <QRImage value={qrUrl} size={200} />
          </div>

          <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', margin: '0 0 4px' }}>
            {employee.name}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {employee.start_time?.slice(0,5)} – {employee.end_time?.slice(0,5)}
            <span style={{ marginLeft: 8, color: 'var(--warning)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              ⏱ {employee.late_grace_mins ?? 30}m grace
            </span>
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: 20, fontFamily: 'var(--font-mono)' }}>
            {qrUrl}
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleDownload}>
              ↓ Download PNG
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
              🖨 Print QR
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
