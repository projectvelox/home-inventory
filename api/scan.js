import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { image, categoryName } = req.body

  if (!image) {
    return res.status(400).json({ error: 'No image provided' })
  }

  const match = image.match(/^data:(.+?);base64,(.+)$/)
  if (!match) {
    return res.status(400).json({ error: 'Invalid image format' })
  }
  const [, mediaType, base64Data] = match

  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const finalType = supportedTypes.includes(mediaType) ? mediaType : 'image/jpeg'

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: finalType, data: base64Data },
          },
          {
            type: 'text',
            text: `You are helping identify a household inventory item from a photo.
Return ONLY a valid JSON object with exactly these fields:
- "name": specific product name (e.g. "Huggies Natural Care Baby Wipes 72ct" not just "wipes")
- "unit": best unit for counting this item ("pcs", "bottles", "boxes", "bags", "rolls", "cans", "packs", "jars", "tubes")
- "notes": one short helpful reminder about this item (e.g. "Check expiry date monthly", "Keep refrigerated after opening")
${categoryName ? `The item belongs to the "${categoryName}" category.` : ''}
Respond with JSON only. No markdown, no explanation, no extra text.`,
          },
        ],
      },
    ],
  })

  try {
    const text = message.content[0].text.trim()
    const parsed = JSON.parse(text)
    res.status(200).json(parsed)
  } catch {
    res.status(200).json({ name: '', unit: 'pcs', notes: '' })
  }
}
