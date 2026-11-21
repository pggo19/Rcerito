# Rcerito

App para preparar los exámenes de último año de medicina en Perú: **internado EsSalud**, **ENAM** y **SERUMS (ENCAPS)**. El estudio se recorre como un campus en pixel art: cada edificio es un examen y Uku, un osito de anteojos con mandil, acompaña al estudiante.

Proyecto **independiente de R0**: repositorio, base de datos, claves y usuarios propios.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `app/` | App en React + TypeScript (Vite). Se empaqueta para Android con Capacitor. |
| `app/android/` | Proyecto Android generado por Capacitor (`pe.rcerito.app`, provisional). |
| `content/` | Preguntas de prueba, importador, y `content/arte/` (generador de los sprites de Uku, avatar, accesorios y fondos). |
| `supabase/migrations/` | Esquema de la base (tablas, RLS, permisos por columna). |
| `docs/` | Decisiones de diseño y formato de preguntas. |
| `.github/workflows/` | Compila un APK de prueba en GitHub Actions en cada push. |

## Correr en tu PC

```bash
cd app
npm install
npm run dev          # abre http://localhost:5173
npm run build        # genera app/dist
```

Variables (opcional, ya tienen valor por defecto): copia `app/.env.example` a `app/.env`.

## APK de prueba

Cada push a `main` corre el workflow **APK de prueba** y publica el archivo en **Releases → apk-prueba** del repo. Desde el teléfono: abre esa versión en GitHub, descarga `app-debug.apk` e instálalo (permite apps de "orígenes desconocidos").

Para compilar en tu PC necesitas Android Studio (JDK 21 incluido):

```bash
cd app
npm run build
npx cap sync android
npx cap open android   # luego Build > Build APK(s)
```

## Preguntas

Estándar completo (4 alternativas, taxonomía por examen, prompt para la IA y carga) en [`docs/ESTANDAR_PREGUNTAS.md`](docs/ESTANDAR_PREGUNTAS.md).

Para validar y cargar un lote generado por IA:

```bash
python3 content/importar.py lote.json            # valida
python3 content/importar.py lote.json --sql      # genera SQL para el SQL Editor de Supabase
```

Para añadir preguntas de prueba incluidas en el APK edita `content/fuente_preguntas.py` y corre:

```bash
python3 content/build_questions.py
```

Eso actualiza `app/src/data/questions.json` (copia sin conexión) y `content/preguntas_prueba.json`. Para la base de datos, inserta solo preguntas con `estado` = `validada_ia` o `revisada_medico`: son las únicas que la app puede leer.

## Estado

Ver `docs/estado.md`.

## Sprites de Uku, avatar y tienda

Los dibujos se generan por capas con Python (Pillow):

```bash
python3 content/arte/exportar.py   # escribe app/src/assets/pixel/
```

Reglas de Pro, gemas, tienda y evolución de Uku: [`docs/PRO_GEMAS_AVATAR.md`](docs/PRO_GEMAS_AVATAR.md).
