import { useEffect, useRef } from 'react'
import { drawSprite, LOCK, PAL, UKU, UKU_STEP } from './sprites'
import type { ExamCode } from '../lib/types'

export const MAP_W = 192
export const MAP_H = 288

export type Place = ExamCode | 'PLAZA'

type Pt = [number, number]
const HUB: Pt = [120, 182]

export const PLACES: Record<Place, { box: [number, number, number, number]; route: Pt[]; label: string }> = {
  ESSALUD: { box: [10, 26, 80, 72], route: [HUB, [120, 122], [50, 122], [50, 102]], label: 'Hospital Docente' },
  ENAM: { box: [106, 30, 76, 70], route: [HUB, [120, 122], [144, 122], [144, 104]], label: 'Aula Magna' },
  SERUMS: { box: [18, 184, 70, 62], route: [HUB, [120, 262], [52, 262], [52, 250]], label: 'Posta Rural' },
  PLAZA: { box: [80, 144, 64, 50], route: [HUB], label: 'Plaza central' },
}

const C = {
  grass: '#7DB35E',
  grass2: '#6FA553',
  grassHi: '#93C46E',
  path: '#D9C28F',
  pathEdge: '#BFA06B',
  stone: '#D3DCD8',
  stone2: '#BCC7C3',
  water: '#6EC1D6',
  water2: '#9ADBE8',
  leaf: '#3F7A3A',
  leaf2: '#5C9A48',
  trunk: '#6B4530',
  ink: PAL.k,
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string) {
  rect(ctx, x, y, w, h, C.ink)
  rect(ctx, x + 1, y + 1, w - 2, h - 2, fill)
}

function tree(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x + 5, y + 10, 3, 5, C.trunk)
  rect(ctx, x + 2, y, 9, 11, C.ink)
  rect(ctx, x, y + 2, 13, 7, C.ink)
  rect(ctx, x + 3, y + 1, 7, 9, C.leaf)
  rect(ctx, x + 1, y + 3, 11, 5, C.leaf)
  rect(ctx, x + 3, y + 2, 4, 3, C.leaf2)
}

function kantutas(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x, y, 2, 2, PAL.m)
  rect(ctx, x + 4, y + 2, 2, 2, PAL.m)
  rect(ctx, x + 2, y + 4, 2, 2, PAL.y)
}

function path(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  const x = Math.min(a[0], b[0]) - 6
  const y = Math.min(a[1], b[1]) - 6
  const w = Math.abs(a[0] - b[0]) + 12
  const h = Math.abs(a[1] - b[1]) + 12
  rect(ctx, x - 1, y - 1, w + 2, h + 2, C.pathEdge)
  rect(ctx, x, y, w, h, C.path)
}

function hospital(ctx: CanvasRenderingContext2D) {
  const [x, y, w, h] = PLACES.ESSALUD.box
  box(ctx, x, y + 12, w, h - 12, '#F4F7F8')
  rect(ctx, x + 1, y + h - 6, w - 2, 5, '#DCE5E8')
  box(ctx, x - 2, y + 4, w + 4, 12, '#3C6E9E')
  rect(ctx, x - 1, y + 13, w + 2, 2, '#2E5579')
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 4; c++) {
      const wx = x + 8 + c * 18
      if (r === 1 && (c === 1 || c === 2)) continue
      box(ctx, wx, y + 22 + r * 18, 10, 10, '#9FD3D9')
      rect(ctx, wx + 1, y + 23 + r * 18, 3, 3, '#D6F0F2')
    }
  // letrero: cruz verde
  box(ctx, x + w / 2 - 7, y + 30, 14, 14, '#FFFFFF')
  rect(ctx, x + w / 2 - 2, y + 32, 4, 10, PAL.t)
  rect(ctx, x + w / 2 - 5, y + 35, 10, 4, PAL.t)
  box(ctx, x + w / 2 - 7, y + h - 18, 14, 18, '#6B4530')
  rect(ctx, x + w / 2, y + h - 16, 1, 16, C.ink)
}

function aulaMagna(ctx: CanvasRenderingContext2D) {
  const [x, y, w, h] = PLACES.ENAM.box
  // frontón escalonado
  for (let i = 0; i < 8; i++) {
    const inset = 30 - i * 4
    rect(ctx, x + inset - 1, y + i * 2, w - inset * 2 + 2, 3, C.ink)
  }
  for (let i = 1; i < 8; i++) {
    const inset = 30 - i * 4
    rect(ctx, x + inset, y + i * 2 + 1, w - inset * 2, 2, '#B5473A')
  }
  box(ctx, x - 2, y + 16, w + 4, 6, '#F3E3B5')
  box(ctx, x + 2, y + 21, w - 4, h - 31, '#F3E3B5')
  for (let c = 0; c < 5; c++) {
    const cx = x + 7 + c * 14
    rect(ctx, cx, y + 23, 6, h - 36, '#FFFFFF')
    rect(ctx, cx + 4, y + 23, 2, h - 36, '#D9DEE0')
    rect(ctx, cx - 1, y + 22, 8, 2, C.ink)
  }
  box(ctx, x + w / 2 - 6, y + h - 26, 12, 16, '#3A2A22')
  box(ctx, x - 4, y + h - 11, w + 8, 6, '#C9D0D2')
  box(ctx, x - 7, y + h - 6, w + 14, 6, '#B5BEC1')
}

function postaRural(ctx: CanvasRenderingContext2D) {
  const [x, y, w, h] = PLACES.SERUMS.box
  box(ctx, x, y + 16, w, h - 16, '#C98E5A')
  for (let i = 0; i < 14; i++) rect(ctx, x + 4 + ((i * 17) % (w - 10)), y + 20 + ((i * 11) % (h - 24)), 3, 2, '#B07444')
  // techo de tejas
  box(ctx, x - 4, y + 4, w + 8, 16, '#9C3B2E')
  for (let i = 0; i < w + 4; i += 6) rect(ctx, x - 2 + i, y + 6, 2, 12, '#7E2C22')
  rect(ctx, x - 3, y + 17, w + 6, 2, '#7E2C22')
  box(ctx, x + 8, y + 26, 12, 10, '#9FD3D9')
  rect(ctx, x + 13, y + 27, 1, 8, C.ink)
  box(ctx, x + w - 22, y + 24, 14, 14, '#FFFFFF')
  rect(ctx, x + w - 17, y + 26, 4, 10, PAL.t)
  rect(ctx, x + w - 20, y + 29, 10, 4, PAL.t)
  box(ctx, x + w / 2 - 6, y + h - 18, 12, 18, '#5A3A28')
  // banca
  rect(ctx, x + w + 2, y + h - 8, 14, 3, '#8A5A3C')
  rect(ctx, x + w + 3, y + h - 5, 2, 4, C.ink)
  rect(ctx, x + w + 13, y + h - 5, 2, 4, C.ink)
}

function plaza(ctx: CanvasRenderingContext2D) {
  const [x, y, w, h] = PLACES.PLAZA.box
  box(ctx, x, y, w, h, C.stone)
  for (let i = 0; i < w; i += 8) for (let j = 0; j < h; j += 8) if ((i + j) % 16 === 0) rect(ctx, x + i + 1, y + j + 1, 7, 7, C.stone2)
  const cx = x + 18
  const cy = y + 22
  box(ctx, cx - 11, cy - 7, 22, 14, '#AEB9B6')
  rect(ctx, cx - 9, cy - 5, 18, 10, C.water)
  rect(ctx, cx - 6, cy - 3, 5, 2, C.water2)
  box(ctx, cx - 2, cy - 13, 4, 9, '#AEB9B6')
  // banca de la plaza
  rect(ctx, x + w - 22, y + 10, 16, 3, '#8A5A3C')
  rect(ctx, x + w - 21, y + 13, 2, 4, C.ink)
  rect(ctx, x + w - 9, y + 13, 2, 4, C.ink)
}

/** Dibuja el mapa estático una sola vez. */
function drawMap(ctx: CanvasRenderingContext2D, locked: Place[]) {
  rect(ctx, 0, 0, MAP_W, MAP_H, C.grass)
  for (let i = 0; i < 220; i++) {
    const px = (i * 53) % MAP_W
    const py = (i * 97) % MAP_H
    rect(ctx, px, py, 2, 1, i % 3 ? C.grass2 : C.grassHi)
  }
  for (const place of Object.values(PLACES)) {
    const r = place.route
    for (let i = 0; i < r.length - 1; i++) path(ctx, r[i], r[i + 1])
  }
  plaza(ctx)
  hospital(ctx)
  aulaMagna(ctx)
  postaRural(ctx)
  for (const [tx, ty] of [[2, 112], [96, 6], [176, 112], [162, 150], [176, 196], [150, 214], [96, 216], [4, 154], [168, 250], [126, 268], [2, 262]] as Pt[]) tree(ctx, tx, ty)
  for (const [fx, fy] of [[30, 140], [70, 150], [150, 132], [170, 236], [100, 238], [12, 178]] as Pt[]) kantutas(ctx, fx, fy)
  for (const p of locked) {
    const [x, y, w, h] = PLACES[p].box
    ctx.fillStyle = 'rgba(30,42,58,0.55)'
    ctx.fillRect(x - 2, y, w + 4, h)
    drawSprite(ctx, LOCK, x + w / 2 - 7, y + h / 2 - 8, 2)
  }
}

interface Props {
  locked: Place[]
  onArrive: (place: Place) => void
  start?: Place
  request?: { place: Place; n: number } | null
}

export function CampusCanvas({ locked, onArrive, start = 'PLAZA', request }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pos = useRef<Pt>([...(start === 'PLAZA' ? HUB : PLACES[start].route.at(-1)!)] as Pt)
  const queue = useRef<Pt[]>([])
  const target = useRef<Place | null>(null)
  const facingLeft = useRef(false)
  const lockedKey = locked.join(',')

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const bg = document.createElement('canvas')
    bg.width = MAP_W
    bg.height = MAP_H
    drawMap(bg.getContext('2d')!, lockedKey ? (lockedKey.split(',') as Place[]) : [])
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = performance.now()
    let walkT = 0

    const frame = (now: number) => {
      const dt = Math.min(50, now - last)
      last = now
      const next = queue.current[0]
      let moving = false
      if (next) {
        const [px, py] = pos.current
        const dx = next[0] - px
        const dy = next[1] - py
        const dist = Math.hypot(dx, dy)
        const step = reduce ? dist : 0.09 * dt
        if (dist <= step) {
          pos.current = [...next] as Pt
          queue.current.shift()
          if (!queue.current.length && target.current) {
            const t = target.current
            target.current = null
            setTimeout(() => onArrive(t), reduce ? 0 : 120)
          }
        } else {
          pos.current = [px + (dx / dist) * step, py + (dy / dist) * step]
          if (Math.abs(dx) > 0.5) facingLeft.current = dx < 0
          moving = true
        }
      }
      walkT += moving ? dt : 0
      ctx.drawImage(bg, 0, 0)
      const [ux, uy] = pos.current
      const stepFrame = moving && Math.floor(walkT / 140) % 2 === 1
      const bob = !moving && !reduce && Math.floor(now / 600) % 2 === 1 ? 1 : 0
      ctx.fillStyle = 'rgba(30,42,58,0.25)'
      ctx.fillRect(Math.round(ux) - 6, Math.round(uy) - 1, 12, 2)
      drawSprite(ctx, stepFrame ? UKU_STEP : UKU, Math.round(ux) - 8, Math.round(uy) - 16 + bob, 1, facingLeft.current)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [lockedKey, onArrive])

  const handleTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * MAP_W
    const y = ((e.clientY - r.top) / r.height) * MAP_H
    const hit = (Object.keys(PLACES) as Place[]).find((p) => {
      const [bx, by, bw, bh] = PLACES[p].box
      return x >= bx && x <= bx + bw && y >= by && y <= by + bh
    })
    if (hit) go(hit)
  }

  const go = (place: Place) => {
    // vuelve al centro de la plaza y luego sigue la ruta del edificio
    const back = [...queue.current]
    const route = PLACES[place].route
    queue.current = back.length ? [HUB, ...route.slice(1)] : [...pathBackToHub(pos.current), ...route.slice(1)]
    target.current = place
  }

  useEffect(() => {
    if (request) go(request.place)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request])

  return (
    <canvas
      ref={canvasRef}
      width={MAP_W}
      height={MAP_H}
      className="campus-canvas"
      onPointerUp={handleTap}
      role="img"
      aria-label="Mapa del campus con el Hospital Docente, el Aula Magna, la Posta Rural y la plaza central"
    />
  )
}

function pathBackToHub(p: Pt): Pt[] {
  for (const place of Object.values(PLACES)) {
    const r = place.route
    const end = r.at(-1)!
    if (Math.hypot(end[0] - p[0], end[1] - p[1]) < 2 && r.length > 1) return [...r].reverse().slice(1)
  }
  return [HUB]
}
