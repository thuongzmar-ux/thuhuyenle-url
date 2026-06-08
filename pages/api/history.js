import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const items = await redis.lrange('history', 0, 99)
    const history = await Promise.all(
      items.map(async (item) => {
        const data = typeof item === 'string' ? JSON.parse(item) : item
        const clicks = await redis.get(`clicks:${data.code}`) || 0
        return { ...data, clicks: parseInt(clicks) }
      })
    )
    res.json(history)
  } catch (e) {
    res.json([])
  }
}
