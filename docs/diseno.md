# Sistema visual

**Idea:** el campus de una facultad de medicina peruana dibujado como un RPG retro (estilo propio, sin recursos de Nintendo). El pixel solo aparece donde hay juego: mapa, Uku, HUD y botones. El texto clínico se lee en una fuente hecha para la legibilidad.

## Colores

| Nombre | Hex | Uso |
| --- | --- | --- |
| Tinta | `#1E2A3A` | Texto, bordes pixel |
| Papel | `#EEF3EC` | Fondo (papel de historia clínica) |
| Hoja | `#FBFDF8` | Tarjetas y caso clínico |
| Quirófano | `#2C7A6F` | Acción principal, aciertos |
| Kantuta | `#D6335C` | Vidas y errores (flor nacional) |
| Mostaza | `#F0B429` | Gemas, Pro, resaltados |

## Tipografía

- **Pixelify Sans**: títulos, botones y etiquetas del juego.
- **Atkinson Hyperlegible**: casos clínicos y explicaciones (diseñada para leer sin esfuerzo).
- **VT323**: cifras (vidas, puntajes, tiempo). El 5 de Pixelify se confunde con una S.

## Piezas propias

- **Hoja de historia clínica**: el caso se lee sobre papel rayado con margen rojo.
- **Diálogo de Uku**: caja de RPG con retrato que cambia (feliz, triste) al corregir.
- **Carnet de estudio**: el perfil es un carné con foto de Uku.
- **Borde pixel**: cuatro sombras de 3 px dejan las esquinas recortadas, sin imágenes.

## Mascota

Uku es un osito de anteojos (*Tremarctos ornatus*), el oso andino, con mandil y estetoscopio. El nombre viene del Ukuku, personaje del folclore andino (de dominio público). Sprite de 16×16 hecho a mano en `app/src/game/sprites.ts`.

## Reglas para no parecerse a Pokémon

- Ningún sprite, nombre, sonido, fuente ni menú de Nintendo.
- No usar la paleta verde del Game Boy ni la palabra "Poké" en la tienda.
- En la ficha de Play Store se describe como "RPG retro" o "pixel art".
