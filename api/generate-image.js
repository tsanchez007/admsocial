// api/generate-image.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'El prompt es requerido' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });

  const models = [
    'gemini-2.5-flash-image',
    'gemini-3.1-flash-image-preview',
    'gemini-2.0-flash-preview-image-generation'
  ];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt.trim() }] }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
          })
        }
      );

      const data = await response.json();
      if (!response.ok) {
        console.error(`[${model}] Error:`, data.error?.message);
        continue;
      }

      const parts = data.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find(p => p.inlineData?.data);
      if (!imagePart) continue;

      return res.json({
        success: true,
        imageBase64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || 'image/png'
      });

    } catch (err) {
      console.error(`[${model}] Exception:`, err.message);
      continue;
    }
  }

  return res.status(500).json({ error: 'No se pudo generar la imagen. Intenta con otro prompt.' });
}
