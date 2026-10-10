// 날짜 · 숫자 표시. 기기마다 Intl 지원이 달라서 직접 만든다. 화면 시간은 기기 시간대, CSV 는 한국 시간.
const pad = (n: number) => String(n).padStart(2, '0')

// unix 초 → "20:04:50"
export const fmtTime = (ts: number) => {
  const d = new Date(ts * 1000)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// unix 초 → "10. 09. 20:04" (웹의 ko-KR month/day/hour/minute 형식)
export const fmtDateTime = (ts: number) => {
  const d = new Date(ts * 1000)
  return `${pad(d.getMonth() + 1)}. ${pad(d.getDate())}. ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// unix 초 → "2026-10-09 20:04:50" (한국 시간)
export const formatTs = (ts: number) => {
  const d = new Date(ts * 1000 + 9 * 3600 * 1000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

export const pct = (n: number) => `${(n * 100).toFixed(1)}%`
// 비율(0~1)은 소수 둘째 자리, 그보다 큰 값(예: 0~255)은 정수로
export const num = (n: number) => (Math.abs(n) <= 1 ? n.toFixed(2) : String(Math.round(n)))
