// api/generate-image.js
// Endpoint Vercel - Generación de imágenes con Gemini 2.0 Flash

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'El prompt es requerido' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en las variables de entorno' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt.trim() }]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[Gemini] Error:', JSON.stringify(data));
      const msg = data.error?.message || 'Error de la API de Gemini';
      return res.status(500).json({ error: msg });
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData?.data);

    if (!imagePart) {
      console.error('[Gemini] Sin imagen en respuesta:', JSON.stringify(data).slice(0, 300));
      return res.status(500).json({ error: 'Gemini no devolvió una imagen. Intenta con otro prompt.' });
    }

    return res.json({
      success: true,
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || 'image/png'
    });

  } catch (err) {
    console.error('[generate-image] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
