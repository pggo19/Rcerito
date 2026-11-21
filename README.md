# Rcerito

App para preparar los exámenes de último año de medicina en Perú: **internado EsSalud**, **ENAM** y **SERUMS (ENCAPS)**. El estudio se recorre como un campus en pixel art: cada edificio es un examen y Uku, un osito de anteojos con mandil, acompaña al estudiante.

Proyecto **independiente de R0**: repositorio, base de datos, claves y usuarios propios.

## Estructura

| Carpeta | Qué hay |
| --- | --- |
| `app/` | App en React + TypeScript (Vite). Se empaqueta para Android con Capacitor. |
| `app/android/` | Proyecto Android generado por Capacitor (`pe.rcerito.app`, provisional). |
| `content/` | Preguntas de prueba y el script que reparte la letra correcta y valida el formato. |
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

Formato en `docs/formato_preguntas.md`. Para añadir preguntas de prueba edita `content/fuente_preguntas.py` y corre:

```bash
python3 content/build_questions.py
```

Eso actualiza `app/src/data/questions.json` (copia sin conexión) y `content/preguntas_prueba.json`. Para la base de datos, inserta solo preguntas con `estado` = `validada_ia` o `revisada_medico`: son las únicas que la app puede leer.

## Estado

Ver `docs/estado.md`.
