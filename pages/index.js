import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

const STORAGE_KEY = 'thuhuyenle_url_history'

export default function Home() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [copiedCode, setCopiedCode] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setHistory(JSON.parse(saved))
    inputRef.current?.focus()
  }, [])

  function saveHistory(newEntry, currentHistory) {
    const updated = [newEntry, ...currentHistory].slice(0, 100)
    setHistory(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  async function handleShorten(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    try {
      const encoded = encodeURIComponent(url)
      const res = await fetch(`https://is.gd/create.php?format=json&url=${encoded}`)
      const data = await res.json()

      if (data.errorcode) {
        setError(data.errormessage || 'Không thể rút gọn link này')
        return
      }

      const entry = {
        shortUrl: data.shorturl,
        originalUrl: url,
        createdAt: new Date().toISOString(),
        clicks: 0
      }
      setResult(entry)
      saveHistory(entry, history)
      setUrl('')
    } catch {
      setError('Không kết nối được. Hãy thử lại!')
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard(text, id) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(id)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {}
  }

  function deleteEntry(index) {
    const updated = history.filter((_, i) => i !== index)
    setHistory(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function truncate(str, n = 50) {
    return str.length > n ? str.slice(0, n) + '…' : str
  }

  return (
    <>
      <Head>
        <title>ThuHuyenLe URL — Rút gọn link</title>
        <meta name="description" content="Công cụ rút gọn link của Thu Huyền Lê" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #0f0a1e; min-height: 100vh; color: #e2e8f0; }

        .bg {
          position: fixed; inset: 0; z-index: 0;
          background: radial-gradient(ellipse at 20% 20%, #3b1a6e 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 80%, #1a3a6e 0%, transparent 50%),
                      #0f0a1e;
        }
        .page { position: relative; z-index: 1; min-height: 100vh; padding: 48px 16px 80px; }
        .container { max-width: 680px; margin: 0 auto; }

        /* HEADER */
        .header { text-align: center; margin-bottom: 40px; }
        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(139,92,246,.2); border: 1px solid rgba(139,92,246,.4);
          border-radius: 999px; padding: 6px 16px; margin-bottom: 20px;
        }
        .badge-dot { width: 7px; height: 7px; background: #a78bfa; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .badge-text { font-size: 11px; font-weight: 700; color: #a78bfa; letter-spacing: 1px; text-transform: uppercase; }
        .header h1 { font-size: 38px; font-weight: 800; line-height: 1.2; margin-bottom: 10px;
          background: linear-gradient(135deg, #fff 30%, #a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .header p { color: #94a3b8; font-size: 15px; }

        /* CARD */
        .card {
          background: rgba(255,255,255,.05); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,.1); border-radius: 20px;
          padding: 32px; margin-bottom: 20px;
        }

        /* FORM */
        label.lbl { display: block; font-size: 12px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 10px; }
        .input-row { display: flex; gap: 10px; }
        .url-input {
          flex: 1; background: rgba(255,255,255,.08); border: 1.5px solid rgba(255,255,255,.12);
          border-radius: 12px; padding: 14px 16px; font-size: 14px;
          font-family: 'Inter', sans-serif; color: #e2e8f0;
          transition: border-color .15s, box-shadow .15s;
        }
        .url-input:focus {
          outline: none; border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139,92,246,.15); background: rgba(255,255,255,.1);
        }
        .url-input::placeholder { color: #475569; }
        .btn-main {
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border: none; border-radius: 12px; padding: 14px 24px;
          font-size: 14px; font-weight: 700; color: #fff;
          cursor: pointer; white-space: nowrap;
          transition: opacity .2s, transform .1s;
          display: flex; align-items: center; gap: 6px;
        }
        .btn-main:hover { opacity: .9; transform: translateY(-1px); }
        .btn-main:active { transform: translateY(0); }
        .btn-main:disabled { opacity: .5; cursor: not-allowed; transform: none; }

        /* ERROR */
        .error {
          margin-top: 14px; padding: 12px 16px;
          background: rgba(239,68,68,.15); border: 1px solid rgba(239,68,68,.3);
          border-radius: 10px; font-size: 13px; color: #fca5a5;
        }

        /* RESULT */
        .result {
          margin-top: 20px; padding: 20px;
          background: linear-gradient(135deg, rgba(139,92,246,.15), rgba(99,102,241,.1));
          border: 1px solid rgba(139,92,246,.3); border-radius: 14px;
        }
        .result-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1.5px; color: #a78bfa; margin-bottom: 10px; }
        .result-row { display: flex; align-items: center; gap: 10px; }
        .result-url { flex: 1; font-size: 22px; font-weight: 800; color: #c4b5fd; font-family: monospace; }
        .btn-copy {
          background: #8b5cf6; border: none; border-radius: 8px;
          padding: 9px 18px; font-size: 12px; font-weight: 700;
          color: #fff; cursor: pointer; transition: background .15s; white-space: nowrap;
        }
        .btn-copy:hover { background: #7c3aed; }
        .btn-copy.ok { background: #10b981; }
        .result-orig { font-size: 12px; color: #64748b; margin-top: 8px; }

        /* HISTORY */
        .history-card {
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
          border-radius: 20px; padding: 28px;
        }
        .hist-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .hist-title { font-size: 15px; font-weight: 700; color: #e2e8f0; }
        .hist-count { background: rgba(139,92,246,.2); border-radius: 999px;
          padding: 4px 12px; font-size: 12px; font-weight: 600; color: #a78bfa; }
        .hist-empty { text-align: center; padding: 40px 0; color: #475569; font-size: 14px; }

        .hist-item {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .hist-item:last-child { border-bottom: none; }
        .hist-short {
          font-size: 14px; font-weight: 700; color: #c4b5fd; font-family: monospace;
          white-space: nowrap;
        }
        .hist-info { flex: 1; min-width: 0; }
        .hist-orig { font-size: 11px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hist-date { font-size: 11px; color: #475569; margin-top: 2px; }
        .hist-actions { display: flex; gap: 6px; }
        .btn-sm {
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
          border-radius: 6px; padding: 5px 10px; font-size: 11px; font-weight: 600;
          color: #94a3b8; cursor: pointer; transition: all .15s; white-space: nowrap;
        }
        .btn-sm:hover { background: #8b5cf6; color: #fff; border-color: #8b5cf6; }
        .btn-sm.ok { background: #10b981; color: #fff; border-color: #10b981; }
        .btn-del:hover { background: rgba(239,68,68,.2); color: #fca5a5; border-color: rgba(239,68,68,.3); }

        /* SPINNER */
        .spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media(max-width: 600px) {
          .header h1 { font-size: 28px; }
          .input-row { flex-direction: column; }
          .result-url { font-size: 16px; }
        }
      `}</style>

      <div className="bg" />
      <div className="page">
        <div className="container">

          <div className="header">
            <div className="badge">
              <div className="badge-dot" />
              <span className="badge-text">ThuHuyenLe URL</span>
            </div>
            <h1>🔗 Rút gọn link<br />nhanh & miễn phí</h1>
            <p>Dán link dài — nhận link ngắn để chia sẻ ngay</p>
          </div>

          <div className="card">
            <form onSubmit={handleShorten}>
              <label className="lbl">🌐 Link cần rút gọn</label>
              <div className="input-row">
                <input
                  ref={inputRef}
                  className="url-input"
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  required
                />
                <button type="submit" className="btn-main" disabled={loading}>
                  {loading ? <><div className="spin" /> Đang...</> : '⚡ Rút gọn'}
                </button>
              </div>
            </form>

            {error && <div className="error">❌ {error}</div>}

            {result && (
              <div className="result">
                <div className="result-lbl">✅ Link đã rút gọn</div>
                <div className="result-row">
                  <div className="result-url">{result.shortUrl}</div>
                  <button
                    className={`btn-copy ${copiedCode === 'main' ? 'ok' : ''}`}
                    onClick={() => copyToClipboard(result.shortUrl, 'main')}
                  >
                    {copiedCode === 'main' ? '✓ Đã copy' : '📋 Copy'}
                  </button>
                </div>
                <div className="result-orig">↳ {truncate(result.originalUrl)}</div>
              </div>
            )}
          </div>

          <div className="history-card">
            <div className="hist-header">
              <div className="hist-title">📋 Lịch sử</div>
              {history.length > 0 && <div className="hist-count">{history.length} link</div>}
            </div>

            {history.length === 0 ? (
              <div className="hist-empty">Chưa có link nào — hãy rút gọn link đầu tiên! 👆</div>
            ) : history.map((item, i) => (
              <div key={i} className="hist-item">
                <div className="hist-short">{item.shortUrl.replace('https://', '')}</div>
                <div className="hist-info">
                  <div className="hist-orig" title={item.originalUrl}>{item.originalUrl}</div>
                  <div className="hist-date">{formatDate(item.createdAt)}</div>
                </div>
                <div className="hist-actions">
                  <button
                    className={`btn-sm ${copiedCode === `h${i}` ? 'ok' : ''}`}
                    onClick={() => copyToClipboard(item.shortUrl, `h${i}`)}
                  >
                    {copiedCode === `h${i}` ? '✓' : 'Copy'}
                  </button>
                  <button
                    className="btn-sm btn-del"
                    onClick={() => deleteEntry(i)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}
