// Pixel art original de Rcerito. Uku: un osito de anteojos (oso andino) con mandil.
// Cada carácter es un píxel; '.' es transparente.

export const PAL: Record<string, string> = {
  k: '#1E2A3A', // tinta
  d: '#3E281C', // pelaje oscuro
  b: '#6B4530', // pelaje
  c: '#F2DDB0', // anteojos y hocico (crema)
  w: '#FFFFFF', // mandil
  g: '#C9D6D8', // sombra del mandil
  t: '#2C7A6F', // estetoscopio (verde quirófano)
  y: '#F0B429', // mostaza
  o: '#E8742A', // naranja llama
  m: '#D6335C', // kantuta
  a: '#49B6C6', // gema
  s: '#8FA3AD', // gris metal
  p: '#F7B7C5', // rosado
}

export type Sprite = string[]

const head = [
  '....kk....kk....',
  '...kddk..kddk...',
  '...kdbkkkkbdk...',
  '..kbbbbbbbbbbk..',
  '.kbccccbbccccbk.',
]
const body = [
  '.kwwkkkkkkkkwwk.',
  'kbwwwtwwwwtwwwbk',
  'kbkwwwtwwtwwwkbk',
  '.kkwwwwttwyywkk.',
  '..kwwwwwwwwwwk..',
]

export const UKU: Sprite = [
  ...head,
  '.kbckwcbbcwkcbk.',
  '.kbckkcbbckkcbk.',
  '.kbbccbccbccbbk.',
  '..kbbbckkcbbbk..',
  '...kbbccccbbk...',
  ...body,
  '...kddk..kddk...',
]

export const UKU_STEP: Sprite = [
  ...UKU.slice(0, 15),
  '..kddk....kddk..',
]

export const UKU_HAPPY: Sprite = [
  ...head,
  '.kbccccbbccccbk.',
  '.kbckkcbbckkcbk.',
  '.kbbccbccbccbbk.',
  '..kbbbckkcbbbk..',
  '...kbbcmmcbbk...',
  ...body,
  '...kddk..kddk...',
]

export const UKU_SAD: Sprite = [
  ...head.slice(0, 4),
  '.kbkcccbbccckbk.',
  '.kbccccbbccccbk.',
  '.kbckkcbbckkcbk.',
  '.kbbccbccbccbbk.',
  '..kbbbckkcbbbk..',
  '...kbbckkcbbk...',
  ...body,
  '...kddk..kddk...',
]

export const HEART: Sprite = ['.kk.kk.', 'kmmkpmk', 'kmmmmmk', 'kmmmmmk', '.kmmmk.', '..kmk..', '...k...']
export const GEM: Sprite = ['..kkk..', '.kaaak.', 'kaawaak', 'kaaaaak', '.kaaak.', '..kak..', '...k...']
export const FLAME: Sprite = ['...k...', '..kok..', '.kook..', '.koyok.', 'koyyyok', 'koyyyok', '.kooyk.', '..kkk..']
export const BOLT: Sprite = ['...kkk.', '..kyyk.', '.kyyk..', 'kyyyyk.', '.kkyyk.', '..kyk..', '.kyk...', '.kk....']
export const LOCK: Sprite = ['.kkkkk.', '.ks..sk', '.ks..sk', 'kkkkkkk', 'kyyyyyk', 'kyykyyk', 'kyykyyk', 'kkkkkkk']
export const MEDAL: Sprite = ['kmk.kmk', 'kmk.kmk', '.kmkmk.', '..kkk..', '.kyyyk.', 'kyywyyk', 'kyyyyyk', '.kyyyk.', '..kkk..']

export function spriteToDataURL(sprite: Sprite, scale = 4, flip = false): string {
  const h = sprite.length
  const w = sprite[0].length
  const c = document.createElement('canvas')
  c.width = w * scale
  c.height = h * scale
  const ctx = c.getContext('2d')!
  drawSprite(ctx, sprite, 0, 0, scale, flip)
  return c.toDataURL()
}

export function drawSprite(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number, scale = 1, flip = false) {
  const w = sprite[0].length
  for (let row = 0; row < sprite.length; row++) {
    const line = sprite[row]
    for (let col = 0; col < line.length; col++) {
      const color = PAL[line[col]]
      if (!color) continue
      ctx.fillStyle = color
      const cx = flip ? w - 1 - col : col
      ctx.fillRect(x + cx * scale, y + row * scale, scale, scale)
    }
  }
}
