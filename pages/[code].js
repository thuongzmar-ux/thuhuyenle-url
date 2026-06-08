import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function getServerSideProps({ params }) {
  const { code } = params
  const url = await redis.get(`url:${code}`)

  if (!url) {
    return { notFound: true }
  }

  await redis.incr(`clicks:${code}`)

  return {
    redirect: {
      destination: url,
      permanent: false,
    },
  }
}

export default function RedirectPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <p style={{ color: '#666' }}>Đang chuyển hướng...</p>
    </div>
  )
}
