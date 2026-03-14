/**
 * Details Page — Identity Verification
 *
 * Flow:
 *  1. Show employee info fetched by ID.
 *  2. "Open Camera" → getUserMedia({ video: true }) → stream into <video>.
 *  3. "Capture Photo" → draw video frame onto a hidden <canvas> (photoCanvas).
 *  4. Signature overlay: a transparent <canvas> layered over the captured image.
 *     Mouse / touch events draw freehand paths.
 *  5. "Merge & Save" → new offscreen canvas draws:
 *       a) photo (photoCanvas)  at full size
 *       b) signature (sigCanvas) blended on top
 *     → canvas.toBlob() → Object URL → displayed in UI + offered for download.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEmployeeData } from '../hooks/useEmployeeData'

export default function Details() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { data }    = useEmployeeData()

  const employee    = data.find(e => String(e.id) === String(id))

  // ── Camera state ──────────────────────────────────────────────────────────
  const videoRef    = useRef(null)
  const photoRef    = useRef(null)   // canvas that holds the captured frame
  const sigRef      = useRef(null)   // transparent signature canvas overlay
  const streamRef   = useRef(null)   // MediaStream ref for cleanup

  const [camActive,    setCamActive]    = useState(false)
  const [captured,     setCaptured]     = useState(false)
  const [mergedUrl,    setMergedUrl]    = useState(null)
  const [isDrawing,    setIsDrawing]    = useState(false)
  const [sigColor,     setSigColor]     = useState('#f59e0b')
  const [sigWidth,     setSigWidth]     = useState(3)
  const [camError,     setCamError]     = useState('')
  const lastPos       = useRef(null)

  // ── Camera helpers ────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCamError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCamActive(true)
    } catch (err) {
      setCamError(`Camera access denied: ${err.message}`)
    }
  }

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCamActive(false)
  }, [])

  // Stop camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera])

  const capturePhoto = () => {
    const video  = videoRef.current
    const canvas = photoRef.current
    if (!video || !canvas) return

    const W = video.videoWidth  || 640
    const H = video.videoHeight || 480
    canvas.width  = W
    canvas.height = H

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, W, H)

    // Also size the signature canvas to match
    const sig = sigRef.current
    sig.width  = W
    sig.height = H

    stopCamera()
    setCaptured(true)
  }

  // ── Signature drawing ─────────────────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const src = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    }
  }

  const onSignStart = e => {
    e.preventDefault()
    const canvas = sigRef.current
    if (!canvas || !captured) return
    setIsDrawing(true)
    lastPos.current = getPos(e, canvas)
  }

  const onSignMove = e => {
    e.preventDefault()
    if (!isDrawing || !sigRef.current) return
    const canvas = sigRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e, canvas)

    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = sigColor
    ctx.lineWidth   = sigWidth
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  const onSignEnd = () => setIsDrawing(false)

  const clearSignature = () => {
    const canvas = sigRef.current
    if (!canvas) return
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  }

  // ── Blob Merge ────────────────────────────────────────────────────────────
  const mergeAndSave = () => {
    const photoCanvas = photoRef.current
    const sigCanvas   = sigRef.current
    if (!photoCanvas || !sigCanvas) return

    const W = photoCanvas.width
    const H = photoCanvas.height

    // Create offscreen merge canvas
    const merge = document.createElement('canvas')
    merge.width  = W
    merge.height = H

    const ctx = merge.getContext('2d')

    // Layer 1: captured photo
    ctx.drawImage(photoCanvas, 0, 0, W, H)

    // Layer 2: signature (source-over composite — transparent sig pixels show photo)
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(sigCanvas, 0, 0, W, H)

    // Burn in a small audit label
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, H - 26, W, 26)
    ctx.fillStyle = '#f59e0b'
    ctx.font = '11px JetBrains Mono, monospace'
    ctx.fillText(
      `JOTISH AUDIT · ${new Date().toISOString()}`,
      8, H - 8
    )

    // Export as Blob → Object URL
    merge.toBlob(blob => {
      if (mergedUrl) URL.revokeObjectURL(mergedUrl)  // revoke previous
      const url = URL.createObjectURL(blob)
      setMergedUrl(url)
    }, 'image/png')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!data.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080f' }}>
        <p style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', fontSize: '0.85rem' }}>Loading employee data…</p>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080f' }}>
        <div className="text-center">
          <p style={{ color: '#f87171', fontFamily: 'JetBrains Mono', marginBottom: 12 }}>Employee #{id} not found.</p>
          <button onClick={() => navigate('/list')} style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Back to List
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#08080f' }}>

      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e1e30', background: '#0f0f1a' }}>
        <button
          onClick={() => navigate('/list')}
          style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: '#8888aa', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Employee List
        </button>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#f59e0b', letterSpacing: '0.1em' }}>
          IDENTITY VERIFICATION · #{id}
        </span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Employee info card ── */}
        <div
          className="p-6 fade-up"
          style={{ background: '#0f0f1a', border: '1px solid #1e1e30', borderRadius: 10 }}
        >
          <h2
            className="text-2xl font-bold mb-6"
            style={{ fontFamily: 'Syne', color: '#e8e8f0', letterSpacing: '-0.02em' }}
          >
            {employee.name}
          </h2>

          <div className="space-y-3 fade-up-stagger">
            {[
              ['Employee ID',  employee.id],
              ['Email',        employee.email],
              ['City',         employee.city],
              ['Department',   employee.department],
              ['Designation',  employee.designation],
              ['Phone',        employee.phone],
              ['Salary',       `₹${employee.salary.toLocaleString('en-IN')}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-start gap-4">
                <span style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0, marginTop: 2 }}>
                  {label}
                </span>
                <span style={{ color: '#e8e8f0', fontFamily: 'DM Sans', fontSize: '0.875rem', textAlign: 'right', wordBreak: 'break-all' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Camera & Signature panel ── */}
        <div
          className="p-6 fade-up"
          style={{ background: '#0f0f1a', border: '1px solid #1e1e30', borderRadius: 10, animationDelay: '0.1s' }}
        >
          <h3 style={{ fontFamily: 'Syne', fontSize: '1rem', fontWeight: 600, color: '#e8e8f0', marginBottom: 16 }}>
            Camera + Signature Capture
          </h3>

          {/* Camera error */}
          {camError && (
            <div className="mb-4 px-4 py-3 text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, color: '#f87171', fontFamily: 'JetBrains Mono' }}>
              {camError}
            </div>
          )}

          {/* Video / canvas container */}
          <div
            className="relative mb-4 overflow-hidden"
            style={{ aspectRatio: '4/3', background: '#08080f', borderRadius: 6, border: '1px solid #1e1e30' }}
          >
            {/* Camera feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: camActive ? 'block' : 'none' }}
            />

            {/* Photo canvas (captured frame) */}
            <canvas
              ref={photoRef}
              className="absolute inset-0 w-full h-full"
              style={{ display: captured ? 'block' : 'none', objectFit: 'contain' }}
            />

            {/* Signature overlay canvas */}
            <canvas
              ref={sigRef}
              className="absolute inset-0 w-full h-full"
              style={{
                display: captured ? 'block' : 'none',
                cursor: 'crosshair',
                touchAction: 'none',
              }}
              onMouseDown={onSignStart}
              onMouseMove={onSignMove}
              onMouseUp={onSignEnd}
              onMouseLeave={onSignEnd}
              onTouchStart={onSignStart}
              onTouchMove={onSignMove}
              onTouchEnd={onSignEnd}
            />

            {/* Placeholder */}
            {!camActive && !captured && (
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                <div style={{ fontSize: '2rem', opacity: 0.2 }}>◉</div>
                <span style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}>
                  Camera inactive
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 mb-4">
            {!camActive && !captured && (
              <Btn amber onClick={startCamera}>▶ Open Camera</Btn>
            )}
            {camActive && (
              <>
                <Btn amber onClick={capturePhoto}>⊙ Capture Photo</Btn>
                <Btn ghost onClick={stopCamera}>✕ Stop</Btn>
              </>
            )}
            {captured && (
              <>
                <Btn amber onClick={mergeAndSave}>⊕ Merge & Save</Btn>
                <Btn ghost onClick={clearSignature}>⌫ Clear Sig</Btn>
                <Btn ghost onClick={() => { setCaptured(false); setMergedUrl(null) }}>↺ Retake</Btn>
              </>
            )}
          </div>

          {/* Signature pen options */}
          {captured && (
            <div className="flex items-center gap-4 mb-4">
              <span style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', fontSize: '0.72rem', textTransform: 'uppercase' }}>Pen</span>
              {['#f59e0b', '#06b6d4', '#ffffff', '#f87171'].map(c => (
                <button
                  key={c}
                  onClick={() => setSigColor(c)}
                  style={{
                    width: 20, height: 20, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                    outline: sigColor === c ? `2px solid ${c}` : '2px solid transparent',
                    outlineOffset: 2,
                  }}
                />
              ))}
              <input
                type="range" min="1" max="8" value={sigWidth}
                onChange={e => setSigWidth(Number(e.target.value))}
                style={{ width: 80, accentColor: '#f59e0b' }}
              />
              <span style={{ color: '#4a4a6a', fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }}>{sigWidth}px</span>
            </div>
          )}

          {/* Merged result */}
          {mergedUrl && (
            <div className="mt-4">
              <p style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono', fontSize: '0.72rem', letterSpacing: '0.1em', marginBottom: 8 }}>
                ✓ AUDIT IMAGE GENERATED
              </p>
              <img
                src={mergedUrl}
                alt="Merged audit"
                style={{ width: '100%', borderRadius: 6, border: '1px solid #1e1e30' }}
              />
              <a
                href={mergedUrl}
                download={`audit-${employee.id}-${Date.now()}.png`}
                className="mt-3 inline-block text-xs py-2 px-4"
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid #f59e0b',
                  borderRadius: 4,
                  color: '#f59e0b',
                  fontFamily: 'JetBrains Mono',
                  textDecoration: 'none',
                }}
              >
                ↓ Download PNG
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Small inline button component
function Btn({ children, onClick, amber, ghost }) {
  const [hov, setHov] = useState(false)
  const base = {
    padding: '6px 14px',
    fontSize: '0.78rem',
    fontFamily: 'JetBrains Mono',
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
    letterSpacing: '0.05em',
  }
  const style = amber
    ? { ...base, background: hov ? '#fbbf24' : '#f59e0b', color: '#08080f' }
    : { ...base, background: hov ? '#1e1e30' : 'transparent', color: '#8888aa', border: '1px solid #1e1e30' }

  return (
    <button
      onClick={onClick}
      style={style}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  )
}
