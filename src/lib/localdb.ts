// 기기에 판정 기록을 쌓아 둔다(웹의 IndexedDB 백업과 같은 역할).
// 서버에 접속할 수 없을 때를 대비한 보조 기록이며 다른 기기와 공유되지 않는다.
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { JudgeRecord } from './api'

const KEY = 'ssorry:judges'

// 서버 id 는 초기화하면 다시 1부터라서 ts 와 묶어 키로 쓴다.
export type StoredJudge = JudgeRecord & { key: string; cam?: string }

const keyOf = (r: JudgeRecord) => `${Math.round(r.ts * 1000)}-${r.id}`

let cache: Map<string, StoredJudge> | null = null
// 저장이 겹치면 나중 것이 앞의 것을 덮으므로 한 줄로 세운다.
let queue: Promise<unknown> = Promise.resolve()

async function load() {
  if (cache) return cache
  const raw = await AsyncStorage.getItem(KEY)
  const list: StoredJudge[] = raw ? JSON.parse(raw) : []
  cache = new Map(list.map((r) => [r.key, r]))
  return cache
}

// 같은 판정이 다시 오면(재연결 snapshot, 떨어뜨림 결과 반영) 덮어쓴다.
export function saveJudges(records: (JudgeRecord & { cam?: string })[]) {
  if (!records.length) return Promise.resolve()
  const run = queue.then(async () => {
    const map = await load()
    for (const r of records) {
      const { id, grade, confidence, v_value, threshold, ts, roll_detected, cam, extra } = r
      map.set(keyOf(r), { key: keyOf(r), id, grade, confidence, v_value, threshold, ts, roll_detected, cam, extra })
    }
    await AsyncStorage.setItem(KEY, JSON.stringify([...map.values()]))
  })
  queue = run.catch(() => {})
  return run
}

// 오래된 것부터
export async function loadJudges(): Promise<StoredJudge[]> {
  const map = await load()
  return [...map.values()].sort((a, b) => a.ts - b.ts)
}

export async function countJudges(): Promise<number> {
  return (await load()).size
}
