import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

function generateCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function isValidUrl(string) {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { url, customCode } = req.body
  if (!url) return res.status(400).json({ error: 'URL là bắt buộc' })
  if (!isValidUrl(url)) return res.status(400).json({ error: 'URL không hợp lệ (cần có http:// hoặc https://)' })

  let code = customCode?.trim()?.toLowerCase() || generateCode()

  if (customCode) {
    if (!/^[a-z0-9-]+$/.test(code)) {
      return res.status(400).json({ error: 'Code chỉ được dùng chữ thường, số và dấu gạch ngang' })
    }
    const existing = await redis.get(`url:${code}`)
    if (existing) return res.status(409).json({ error: 'Code này đã được dùng, hãy chọn code khác' })
  } else {
    while (await redis.get(`url:${code}`)) {
      code = generateCode()
    }
  }

  const createdAt = new Date().toISOString()
  await redis.set(`url:${code}`, url)
  await redis.lpush('history', JSON.stringify({ code, url, createdAt, clicks: 0 }))
  await redis.set(`clicks:${code}`, 0)

  const base = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`
  const shortUrl = `${base}/${code}`

  res.json({ shortUrl, code, url, createdAt })
}
