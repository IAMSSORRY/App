// CSV 를 엑셀에서 바로 읽기 좋게 바꿔서 공유 시트로 내보낸다.
// 시간은 "2026-10-09 20:04:50"(한국 시간), 열 이름은 한글, 참/거짓은 예/아니오로 바꾼다.
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { formatTs } from './format'

const HEADERS: Record<string, string> = {
  run_id: '회차',
  id: '번호',
  time: '시각',
  grade: '등급',
  confidence: '신뢰도',
  v_value: '빨강 비율',
  threshold: '빨강 기준',
  dark_ratio: '흠 비율',
  dark_max: '흠 기준',
  roll_detected: '떨어뜨림',
  cam: '카메라',
}

// 서버의 ISO 시간("2026-10-09T20:04:50.573+09:00")도 같은 형식으로
const formatIso = (iso: string) => {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? iso : formatTs(t / 1000)
}

const formatCell = (column: string, value: string) => {
  if (column === 'time') return formatIso(value)
  if (value === 'true') return '예'
  if (value === 'false') return '아니오'
  return value
}

// 서버 CSV 의 값에는 쉼표가 들어가지 않는다(숫자, 등급, 카메라 이름뿐).
export function makeReadable(csv: string) {
  const [head, ...rows] = csv.replace(/^﻿/, '').trim().split(/\r?\n/)
  const columns = head.split(',')
  return [
    columns.map((c) => HEADERS[c] ?? c).join(','),
    ...rows.map((row) =>
      row
        .split(',')
        .map((v, i) => formatCell(columns[i], v))
        .join(','),
    ),
  ].join('\n')
}

// 캐시 폴더에 파일을 만들고 공유 시트(파일 앱에 저장, 메일 등)를 연다.
export async function saveCsv(csv: string, filename: string) {
  const file = new File(Paths.cache, filename)
  if (file.exists) file.delete()
  file.create()
  // 엑셀에서 한글이 깨지지 않게 BOM 을 붙인다.
  file.write('﻿' + csv)
  if (!(await Sharing.isAvailableAsync())) throw new Error('이 기기에서는 파일을 내보낼 수 없습니다')
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle: filename })
}

// 서버 CSV 를 받아 읽기 좋게 바꿔 저장한다. 파일 이름은 서버가 준 것을 쓴다.
export async function downloadServerCsv(url: string) {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const name = res.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1] ?? 'ssorry.csv'
  await saveCsv(makeReadable(await res.text()), name)
}
