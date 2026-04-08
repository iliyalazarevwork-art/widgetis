import { useEffect, useRef } from 'react'

const CELL        = 52
const R           = 50
const G           = 255
const B           = 182
const RADIUS      = 220
const AMPLITUDE   = 22
const WAVE_FREQ   = 0.038

export function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef  = useRef({ x: -9999, y: -9999 })
  const animRef   = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0

    function resize() {
      const parent = canvas!.parentElement
      w = parent ? parent.clientWidth  : window.innerWidth
      h = parent ? parent.clientHeight : window.innerHeight
      canvas!.width  = w * devicePixelRatio
      canvas!.height = h * devicePixelRatio
      canvas!.style.width  = `${w}px`
      canvas!.style.height = `${h}px`
      ctx!.setTransform(1, 0, 0, 1, 0, 0)
      ctx!.scale(devicePixelRatio, devicePixelRatio)
    }

    function pt(col: number, row: number) {
      const bx = col * CELL
      const by = row * CELL
      const dx = bx - mouseRef.current.x
      const dy = by - mouseRef.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > RADIUS || dist < 0.01) return { x: bx, y: by }
      const falloff = 1 - dist / RADIUS
      const wave = Math.sin(dist * WAVE_FREQ) * AMPLITUDE * falloff * falloff
      return { x: bx + (dx / dist) * wave, y: by + (dy / dist) * wave }
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h)

      const cols = Math.ceil(w / CELL) + 2
      const rows = Math.ceil(h / CELL) + 2
      const mx   = mouseRef.current.x
      const my   = mouseRef.current.y

      ctx!.lineWidth = 0.6

      // horizontal lines
      for (let row = 0; row < rows; row++) {
        const by  = row * CELL
        const d   = Math.abs(by - my)
        const alpha = d < RADIUS ? 0.09 + 0.14 * (1 - d / RADIUS) : 0.07
        ctx!.strokeStyle = `rgba(${R},${G},${B},${alpha})`
        ctx!.beginPath()
        for (let col = 0; col < cols; col++) {
          const { x, y } = pt(col, row)
          col === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y)
        }
        ctx!.stroke()
      }

      // vertical lines
      for (let col = 0; col < cols; col++) {
        const bx  = col * CELL
        const d   = Math.abs(bx - mx)
        const alpha = d < RADIUS ? 0.09 + 0.14 * (1 - d / RADIUS) : 0.07
        ctx!.strokeStyle = `rgba(${R},${G},${B},${alpha})`
        ctx!.beginPath()
        for (let row = 0; row < rows; row++) {
          const { x, y } = pt(col, row)
          row === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y)
        }
        ctx!.stroke()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    resize()
    draw()

    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    // Only attach mouse interaction on devices with a real pointer (desktop).
    // On touch devices, taps fire synthetic mousemove events that make the
    // mesh warp at the tap location — we don't want that.
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (hasFinePointer) {
      window.addEventListener('mousemove', onMouseMove)
    }

    return () => {
      cancelAnimationFrame(animRef.current)
      if (hasFinePointer) window.removeEventListener('mousemove', onMouseMove)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.85, zIndex: 2 }}
    />
  )
}
