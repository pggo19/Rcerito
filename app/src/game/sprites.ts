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
  v: '#7A4E9E', // morado (amenazas)
  l: '#8DBF4E', // lima (toxinas)
  r: '#B5532F', // ladrillo
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

// Amenazas de las batallas y fondos de misión (16×16)
export const AMENAZA_VIRUS: Sprite = [
  '......kkkk......',
  '..kk.kvvvvk.kk..',
  '.kvvkvvvvvvkvvk.',
  '.kvvvvvvvvvvvvk.',
  '..kvvvvvvvvvvk..',
  '.kvvwwkvvkwwvvk.',
  'kvvvwkkvvkkwvvvk',
  'kvvvvvvvvvvvvvvk',
  'kvvvvvkkkkvvvvvk',
  '.kvvvkmmmmkvvvk.',
  '.kvvvvkkkkvvvvk.',
  '..kvvvvvvvvvvk..',
  '.kvvkvvvvvvkvvk.',
  '.kvvk.kvvk.kvvk.',
  '..kk..kvvk..kk..',
  '......kkkk......',
]

export const AMENAZA_TOXINA: Sprite = [
  '.....kkkkkk.....',
  '.....kssssk.....',
  '......kssk......',
  '......kllk......',
  '.....kllllk.....',
  '....kllllllk....',
  '...kllkkkkllk...',
  '..kllkwwwwkllk..',
  '..klkwkwwkwkllk.',
  '.kllkwwwwwwkllk.',
  '.kllkkwkkwkkllk.',
  '.klllkwwwwklllk.',
  '.kllllkkkkllllk.',
  '.kllllllllllllk.',
  '..kllllllllllk..',
  '...kkkkkkkkkk...',
]

export const AMENAZA_BACTERIA: Sprite = [
  '................',
  '...kkkkkkkkkk...',
  '..koooooooooook.',
  '.kooywooooywook.',
  '.koowkooooowkook',
  'kooooooooooooook',
  'koooookkkkooooko',
  'kooookmmmmkooook',
  '.koooookkkooook.',
  '.kooooooooooook.',
  '..kkkkkkkkkkkkk.',
  '..k..k..k..k..k.',
  '.k..k..k..k..k..',
  '................',
  '................',
  '................',
]

export const ESCOMBROS: Sprite = [
  '................',
  '..kkkkkkkkkkkk..',
  '..krrkrrrkrrrk..',
  '..kkkkkkkkkkkk..',
  '..krrrkrrrkrrk..',
  '..kkkkkkk.kkkk..',
  '..krrkrk...rrk..',
  '..kkkkk.....kk..',
  '......k.........',
  '.....k..kk......',
  '...kkk.krrk.....',
  '...krk.kkkk..kk.',
  '...kkk......krk.',
  '.kkkkkkkkkkkkkk.',
  '.kssssssssssssk.',
  '.kkkkkkkkkkkkkk.',
]

export const PACIENTE: Sprite = [
  '................',
  '......kkkk......',
  '.....kddddk.....',
  '....kdccccdk....',
  '....kckcckck....',
  '....kcccccck....',
  '.....kcmmck.....',
  '......kkkk......',
  '....kaaaaaak....',
  '...kaawaawaak...',
  '...kaaaaaaaak...',
  '...kckaaaakck...',
  '....kaaaaaak....',
  '....kaak.kaak...',
  '....kcck.kcck...',
  '....kkkk.kkkk...',
]

export const CRONO: Sprite = [
  '.....kkkkkk.....',
  '...kkyyyyyykk...',
  '..kyywwwwwwyyk..',
  '.kywwwwkwwwwwyk.',
  '.kywwwwkwwwwwyk.',
  'kywwwwwkwwwwwwyk',
  'kywwwwwkwwwwwwyk',
  'kywwwwwkkkkwwwyk',
  'kywwwwwwwwwwwwyk',
  'kywwwwwwwwwwwwyk',
  '.kywwwwwwwwwwyk.',
  '.kywwwwwwwwwwyk.',
  '..kyywwwwwwyyk..',
  '...kkyyyyyykk...',
  '.....kkkkkk.....',
  '................',
]

// Insignias (9×9)
export const ESCUDO: Sprite = [
  'kkkkkkkkk',
  'ktttytttk',
  'ktttytttk',
  'kyyyyyyyk',
  'ktttytttk',
  '.kttyttk.',
  '.kttyttk.',
  '..kkykk..',
  '...kkk...',
]

export const ESTRELLA: Sprite = [
  '....k....',
  '...kyk...',
  'kkkyyykkk',
  'kyyyyyyyk',
  '.kyyyyyk.',
  '..kyyyk..',
  '.kyykyyk.',
  '.kyk.kyk.',
  '.kk...kk.',
]

export const OJO: Sprite = [
  '.........',
  '..kkkkk..',
  '.kwwkwwk.',
  'kwwkakwwk',
  'kwkaaakwk',
  'kwwkakwwk',
  '.kwwkwwk.',
  '..kkkkk..',
  '.........',
]

export const MARTILLO: Sprite = [
  'kkkkkkk..',
  'ksssssk..',
  'ksssssk..',
  'kkkbkkk..',
  '...kbk...',
  '...kbk...',
  '...kbk...',
  '...kbk...',
  '...kkk...',
]

export const GRIETA: Sprite = [
  'kkkkkkkkk',
  'krrrkrrrk',
  'krrk.krrk',
  'kkk..kkkk',
  '...k.....',
  '..k..k...',
  '...k..k..',
  '..k...k..',
  '.........',
]

export const BANDERA: Sprite = [
  'kk.......',
  'kwkkkkk..',
  'kwwwwwwk.',
  'kwwwwwwk.',
  'kwkkkkk..',
  'kk.......',
  'kk.......',
  'kk.......',
  'kk.......',
]

export const NUBE: Sprite = [
  '...kkk...',
  '.kkwwwkk.',
  'kwwwwwwwk',
  'kwwwwwwwk',
  '.kkkkkkk.',
  '..a..a...',
  '.a..a..a.',
  '..a..a...',
  '.........',
]

// Incidentes (9×9)
export const HOJA: Sprite = ['kkkkkkk..', 'kwwwwwkk.', 'kwkkkwwkk', 'kwwwwwwwk', 'kwkkkkkwk', 'kwwwwwwwk', 'kwkkkkkwk', 'kwwwwwwwk', 'kkkkkkkkk']
export const HOJA_X: Sprite = ['kkkkkkk..', 'kwwwwwkk.', 'kwmwwwmkk', 'kwwmwmwwk', 'kwwwmwwwk', 'kwwmwmwwk', 'kwmwwwmwk', 'kwwwwwwwk', 'kkkkkkkkk']
export const CARA_ENOJADA: Sprite = ['..kkkkk..', '.kmmmmmk.', 'kmkmmmkmk', 'kmmkmkmmk', 'kmwkmkwmk', 'kmmmmmmmk', 'kmmkkkmmk', '.kkmmmkk.', '..kkkkk..']
export const ENFERMERA: Sprite = ['..kkkkk..', '.kwwmwwk.', 'kwwmmmwwk', 'kkkkkkkkk', 'kckcccckk', 'kcckcckck', 'kccccccck', 'kcckkkcck', '.kkkkkkk.']
export const PUERTA: Sprite = ['kkkkkkkkk', 'kbbbbbbbk', 'kbkkkkkbk', 'kbkdddkbk', 'kbkddykbk', 'kbkdddkbk', 'kbkdddkbk', 'kbkdddkbk', 'kkkkkkkkk']
export const GOTA: Sprite = ['....k....', '...kak...', '..kaaak..', '.kaawaak.', '.kawaaak.', 'kaaaaaaak', 'kaaaaaaak', '.kaaaaak.', '..kkkkk..']
export const BOTIQUIN: Sprite = ['...kkk...', '..k...k..', 'kkkkkkkkk', 'kwwwmwwwk', 'kwwmmmwwk', 'kwwwmwwwk', 'kwwwwwwwk', 'kgggggggk', 'kkkkkkkkk']

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
