# 📋 INSTRUCCIONES DE IMPLEMENTACIÓN — Creador de Imágenes IA

## Archivos que recibes:
- `api_generate-image.js`  → va en `/api/generate-image.js`
- `index_additions.html`   → partes a insertar en `index.html`
- `script_additions.js`    → pegar al final de `script.js`

---

## PASO 1 — API Key

Abre `.env.local` y agrega al final:
```
GEMINI_API_KEY="AIzaSyD6OmZyN98qaHVsYxG5HwEubbQfnNTflHU"
```

---

## PASO 2 — Crear `/api/generate-image.js`

Copia el contenido de `api_generate-image.js` y crea el archivo en:
```
C:\Users\taulio\Documents\GitHub\admsocial\api\generate-image.js
```

---

## PASO 3 — Editar `vercel.json`

Agrega esta línea ANTES del último rewrite `"/(.*)"`:
```json
{
  "source": "/api/generate-image",
  "destination": "/api/generate-image"
},
```

---

## PASO 4 — Editar `index.html`

### 4a) Botón en el sidebar
Busca esta línea:
```html
<button class="nav-item" onclick="shareConnectLink()"
```

Pega ANTES de esa línea:
```html
<button class="nav-item" data-section="imageCreator">
  <span class="nav-icon">✨</span>
  <span>Crear Imagen</span>
</button>
```

### 4b) Sección completa
Busca `<!-- Toast container -->` y pega TODO el bloque
`<section class="section" id="imageCreator">...</section>`
ANTES de esa línea.

---

## PASO 5 — Editar `script.js`

Abre `script.js` y pega TODO el contenido de
`script_additions.js` AL FINAL del archivo.

---

## PASO 6 — Vercel Environment Variable

En https://vercel.com → tu proyecto → Settings → Environment Variables:
- Name:  `GEMINI_API_KEY`
- Value: `AIzaSyD6OmZyN98qaHVsYxG5HwEubbQfnNTflHU`
- Envs:  Production + Preview + Development

Luego haz Redeploy.

---

## ✅ Resultado final

- Nueva sección "✨ Crear Imagen" en el sidebar
- Escribes un prompt → Gemini genera la imagen
- Chips de sugerencias rápidas
- Selector de estilo y proporción
- Botón "📤 Usar en Dashboard" → imagen va directo al upload
- Botón "⬇️ Descargar"
- Historial de últimas 6 imágenes generadas
