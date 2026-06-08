import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

export default function Home() {
  const [url, setUrl] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [copiedCode, setCopiedCode] = useState(null)
  const [showCustom, setShowCustom] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    loadHistory()
    inputRef.current?.focus()
  }, [])

  async function loadHistory() {
    try {
      const res = await fetch('/api/history')
      const data = await res.json()
      setHistory(data)
    } catch {}
  }

  async function handleShorten(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, customCode: showCustom ? customCode : '' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Có lỗi xảy ra')
      } else {
        setResult(data)
        setUrl('')
        setCustomCode('')
        loadHistory()
      }
    } catch {
      setError('Không kết nối được server')
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

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function truncate(str, n = 45) {
    return str.length > n ? str.slice(0, n) + '…' : str
  }

  return (
    <>
      <Head>
        <title>ThuHuyenLe URL — Rút gọn link nhanh</title>
        <meta name="description" content="Công cụ rút gọn link cá nhân của Thu Huyền Lê" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #f0f4ff; min-height: 100vh; color: #1e293b; }

        .bg-decoration {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          z-index: 0; overflow: hidden;
        }
        .bg-decoration::before {
          content: ''; position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
          top: -200px; right: -100px; border-radius: 50%;
        }
        .bg-decoration::after {
          content: ''; position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
          bottom: -100px; left: -50px; border-radius: 50%;
        }

        .page { position: relative; z-index: 1; min-height: 100vh; padding: 40px 16px 60px; }

        .container { max-width: 700px; margin: 0 auto; }

        /* HEADER */
        .header { text-align: center; margin-bottom: 40px; }
        .logo-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.2); backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.3); border-radius: 999px;
          padding: 6px 16px; margin-bottom: 20px;
        }
        .logo-dot { width: 8px; height: 8px; background: #fff; border-radius: 50%; }
        .logo-text { font-size: 12px; font-weight: 700; color: #fff; letter-spacing: 1px; text-transform: uppercase; }
        .header h1 { font-size: 36px; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 8px; }
        .header p { font-size: 15px; color: rgba(255,255,255,0.8); }

        /* MAIN CARD */
        .card {
          background: #fff; border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          padding: 32px; margin-bottom: 20px;
        }

        /* FORM */
        .form-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; display: block; }
        .input-wrap { position: relative; margin-bottom: 16px; }
        .input-wrap input {
          width: 100%; background: #f8fafc; border: 2px solid #e2e8f0;
          border-radius: 12px; padding: 14px 16px; font-size: 14px;
          font-family: 'Inter', sans-serif; color: #1e293b;
          transition: border-color .15s, box-shadow .15s;
        }
        .input-wrap input:focus {
          outline: none; border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102,126,234,.12);
          background: #fff;
        }
        .input-wrap input::placeholder { color: #94a3b8; }

        .custom-toggle {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 16px; cursor: pointer;
          font-size: 13px; color: #667eea; font-weight: 500;
          width: fit-content;
        }
        .custom-toggle:hover { color: #5a67d8; }
        .toggle-icon { font-size: 16px; transition: transform .2s; }
        .toggle-icon.open { transform: rotate(45deg); }

        .custom-row {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 16px;
        }
        .base-prefix {
          background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 10px;
          padding: 12px 14px; font-size: 13px; color: #94a3b8;
          white-space: nowrap; font-family: monospace;
        }
        .custom-row input {
          flex: 1; background: #f8fafc; border: 2px solid #e2e8f0;
          border-radius: 10px; padding: 12px 14px; font-size: 14px;
          font-family: monospace; color: #1e293b;
          transition: border-color .15s, box-shadow .15s;
        }
        .custom-row input:focus {
          outline: none; border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102,126,234,.12); background: #fff;
        }

        .btn-shorten {
          width: 100%; background: linear-gradient(135deg, #667eea, #764ba2);
          border: none; border-radius: 12px; padding: 15px;
          font-size: 15px; font-weight: 700; color: #fff;
          cursor: pointer; transition: opacity .2s, transform .1s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-shorten:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-shorten:active { transform: translateY(0); }
        .btn-shorten:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* ERROR */
        .error-box {
          background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
          padding: 12px 16px; margin-top: 14px; font-size: 13px; color: #dc2626;
          display: flex; align-items: center; gap: 8px;
        }

        /* RESULT */
        .result-box {
          background: linear-gradient(135deg, #f0f4ff, #f5f0ff);
          border: 1px solid #c7d2fe; border-radius: 14px;
          padding: 20px; margin-top: 20px;
        }
        .result-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #667eea; margin-bottom: 10px; }
        .result-url-row { display: flex; align-items: center; gap: 10px; }
        .result-url {
          flex: 1; font-size: 20px; font-weight: 700; color: #4c1d95;
          word-break: break-all; font-family: monospace;
        }
        .btn-copy {
          background: #667eea; border: none; border-radius: 8px;
          padding: 8px 16px; font-size: 12px; font-weight: 600;
          color: #fff; cursor: pointer; white-space: nowrap;
          transition: background .15s;
        }
        .btn-copy:hover { background: #5a67d8; }
        .btn-copy.copied { background: #10b981; }
        .result-original { font-size: 12px; color: #6b7280; margin-top: 8px; word-break: break-all; }

        /* HISTORY */
        .history-card {
          background: #fff; border-radius: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 28px;
        }
        .history-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .history-title { font-size: 16px; font-weight: 700; color: #1e293b; }
        .history-count {
          background: #f1f5f9; border-radius: 999px;
          padding: 4px 12px; font-size: 12px; font-weight: 600; color: #64748b;
        }

        .history-empty { text-align: center; padding: 40px 0; color: #94a3b8; font-size: 14px; }

        .history-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 0; border-bottom: 1px solid #f1f5f9;
        }
        .history-item:last-child { border-bottom: none; }
        .history-code {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 8px; padding: 6px 12px;
          font-size: 13px; font-weight: 700; color: #fff;
          font-family: monospace; white-space: nowrap;
        }
        .history-info { flex: 1; min-width: 0; }
        .history-short {
          font-size: 13px; font-weight: 600; color: #4c1d95;
          font-family: monospace; margin-bottom: 2px;
        }
        .history-original { font-size: 11px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .history-meta { text-align: right; white-space: nowrap; }
        .history-clicks {
          font-size: 13px; font-weight: 700; color: #1e293b; display: block;
        }
        .history-date { font-size: 11px; color: #94a3b8; }
        .btn-copy-small {
          background: #f1f5f9; border: none; border-radius: 6px;
          padding: 6px 10px; font-size: 11px; font-weight: 600;
          color: #64748b; cursor: pointer; transition: all .15s;
          white-space: nowrap;
        }
        .btn-copy-small:hover { background: #667eea; color: #fff; }
        .btn-copy-small.copied { background: #10b981; color: #fff; }

        /* SPINNER */
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff; border-radius: 50%;
          animation: spin .6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media(max-width: 600px) {
          .header h1 { font-size: 26px; }
          .result-url { font-size: 16px; }
          .history-item { flex-wrap: wrap; }
          .history-meta { width: 100%; text-align: left; display: flex; gap: 12px; align-items: center; }
        }
      `}</style>

      <div className="bg-decoration" />
      <div className="page">
        <div className="container">
          {/* HEADER */}
          <div className="header">
            <div className="logo-badge">
              <div className="logo-dot" />
              <span className="logo-text">ThuHuyenLe URL</span>
            </div>
            <h1>🔗 Rút gọn link<br />nhanh & gọn</h1>
            <p>Dán link dài vào đây — nhận link ngắn gọn, đẹp, có thể share ngay</p>
          </div>

          {/* MAIN CARD */}
          <div className="card">
            <form onSubmit={handleShorten}>
              <label className="form-label">🌐 Dán link cần rút gọn</label>
              <div className="input-wrap">
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  required
                />
              </div>

              <div
                className="custom-toggle"
                onClick={() => setShowCustom(!showCustom)}
              >
                <span className={`toggle-icon ${showCustom ? 'open' : ''}`}>+</span>
                Tùy chỉnh code ngắn (tuỳ chọn)
              </div>

              {showCustom && (
                <div className="custom-row">
                  <span className="base-prefix">thuhuyenle-url.vercel.app/</span>
                  <input
                    type="text"
                    value={customCode}
                    onChange={e => setCustomCode(e.target.value.toLowerCase())}
                    placeholder="koc-brief"
                  />
                </div>
              )}

              <button type="submit" className="btn-shorten" disabled={loading}>
                {loading ? <><div className="spinner" /> Đang tạo...</> : '⚡ Rút gọn ngay'}
              </button>
            </form>

            {error && (
              <div className="error-box">❌ {error}</div>
            )}

            {result && (
              <div className="result-box">
                <div className="result-label">✅ Link đã rút gọn</div>
                <div className="result-url-row">
                  <div className="result-url">{result.shortUrl}</div>
                  <button
                    className={`btn-copy ${copiedCode === 'result' ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(result.shortUrl, 'result')}
                  >
                    {copiedCode === 'result' ? '✓ Đã copy' : '📋 Copy'}
                  </button>
                </div>
                <div className="result-original">↳ {truncate(result.url, 60)}</div>
              </div>
            )}
          </div>

          {/* HISTORY */}
          <div className="history-card">
            <div className="history-header">
              <div className="history-title">📋 Lịch sử rút gọn</div>
              {history.length > 0 && (
                <div className="history-count">{history.length} link</div>
              )}
            </div>

            {history.length === 0 ? (
              <div className="history-empty">Chưa có link nào được rút gọn</div>
            ) : (
              history.map((item, i) => (
                <div key={i} className="history-item">
                  <div className="history-code">/{item.code}</div>
                  <div className="history-info">
                    <div className="history-short">
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/${item.code}`}
                    </div>
                    <div className="history-original" title={item.url}>{item.url}</div>
                  </div>
                  <div className="history-meta">
                    <span className="history-clicks">👆 {item.clicks} click</span>
                    <span className="history-date">{formatDate(item.createdAt)}</span>
                  </div>
                  <button
                    className={`btn-copy-small ${copiedCode === item.code ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/${item.code}`, item.code)}
                  >
                    {copiedCode === item.code ? '✓' : 'Copy'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
