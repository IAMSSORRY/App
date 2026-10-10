import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import Txt from '@/components/Txt'
import type { LiveJudge } from '@/hooks/useJudgeStream'
import { api, exportCsvUrl, type Advice, type Run } from '@/lib/api'
import { downloadServerCsv, saveCsv } from '@/lib/csv'
import { fmtDateTime, fmtTime, formatTs, num, pct } from '@/lib/format'
import { countJudges, loadJudges } from '@/lib/localdb'
import { polite } from '@/lib/polite'
import { toast } from '@/lib/toast'
import { colors, text } from '@/theme'
import { Card, Cell, EmptyText, gradeColor, GrayButton, HeadRight, Table } from './ui'

function RollBadge({ value }: { value: boolean | null }) {
  if (value === null) return <Txt style={{ color: 'rgba(255,255,255,0.4)' }}>대기</Txt>
  return value ? <Txt style={{ color: colors.gradeLow }}>떨어뜨림</Txt> : <Txt style={{ color: colors.info }}>정상</Txt>
}

const historyColumns = [
  { label: '#', flex: 0.6 },
  { label: '시각', flex: 1.2 },
  { label: '등급', flex: 0.7 },
  { label: '신뢰도', flex: 1 },
  { label: '빨강 / 기준', flex: 1.4 },
  { label: '흠 / 기준', flex: 1.4 },
  { label: '떨어뜨림', flex: 1 },
]

export function HistoryCard({ recent }: { recent: LiveJudge[] }) {
  return (
    <Card title="판정 이력">
      <Table
        columns={historyColumns}
        rows={recent}
        keyOf={(r) => `${r.ts}-${r.id}`}
        renderCell={(r, c) => {
          switch (c) {
            case 0:
              return <Cell style={{ color: 'rgba(255,255,255,0.5)' }}>{r.id}</Cell>
            case 1:
              return <Cell>{fmtTime(r.ts)}</Cell>
            case 2:
              return <Cell style={{ fontWeight: '600', color: gradeColor[r.grade] }}>{r.grade}</Cell>
            case 3:
              return <Cell>{r.v_value !== null ? pct(r.confidence) : '—'}</Cell>
            case 4:
              return <Cell>{r.v_value !== null && r.threshold !== null ? `${num(r.v_value)} / ${num(r.threshold)}` : '—'}</Cell>
            case 5:
              return <Cell>{r.extra ? `${num(r.extra.dark_ratio)} / ${num(r.extra.dark_max)}` : '—'}</Cell>
            default:
              return <RollBadge value={r.roll_detected} />
          }
        }}
        empty={recent.length === 0 ? <EmptyText>아직 판정이 없습니다</EmptyText> : null}
      />
    </Card>
  )
}

async function downloadCsv() {
  const rows = await loadJudges()
  const header = ['번호', '시각', '등급', '신뢰도', '빨강 비율', '빨강 기준', '흠 비율', '흠 기준', '떨어뜨림', '카메라']
  const yesNo = (v: boolean | null) => (v === null ? '' : v ? '예' : '아니오')
  const lines = rows.map((r) =>
    [r.id, formatTs(r.ts), r.grade, r.confidence, r.v_value ?? '', r.threshold ?? '', r.extra?.dark_ratio ?? '', r.extra?.dark_max ?? '', yesNo(r.roll_detected), r.cam ?? ''].join(','),
  )
  await saveCsv([header.join(','), ...lines].join('\n'), `ssorry-device-${formatTs(Date.now() / 1000).slice(0, 10)}.csv`)
}

// 서버 CSV 를 받아 시간 등을 읽기 좋게 바꿔 공유한다. 실패하면 알린다.
const downloadRunCsv = (run?: number) =>
  downloadServerCsv(exportCsvUrl(run)).catch((e: Error) => toast('error', 'CSV 를 내려받지 못했습니다', e.message))

const runColumns = [
  { label: '회차', flex: 0.7 },
  { label: '시작', flex: 1.4 },
  { label: '종료', flex: 1.4 },
  { label: '상', flex: 0.6 },
  { label: '중', flex: 0.6 },
  { label: '하', flex: 0.6 },
  { label: '전체', flex: 0.7 },
  { label: '', flex: 0.6, align: 'right' as const },
]

// 서버(SQLite)에 남아 있는 회차 목록. 새 회차를 시작해도 이전 회차는 지워지지 않는다.
export function RunsCard({ refreshKey }: { refreshKey: string }) {
  const [runs, setRuns] = useState<Run[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api
      .runs()
      .then((r) => (setRuns(r), setError(false)))
      .catch(() => setError(true))
  }, [refreshKey])

  return (
    <Card
      title="회차 기록"
      right={
        <HeadRight>
          <GrayButton onPress={() => downloadRunCsv()}>전체 CSV</GrayButton>
        </HeadRight>
      }
    >
      {error && <EmptyText>회차 기록을 불러오지 못했습니다</EmptyText>}
      {runs && (
        <Table
          columns={runColumns}
          rows={runs}
          keyOf={(r) => r.id}
          renderCell={(r, c) => {
            switch (c) {
              case 0:
                return <Cell>{r.id}</Cell>
              case 1:
                return <Cell>{fmtDateTime(r.started_at)}</Cell>
              case 2:
                return r.ended_at ? <Cell>{fmtDateTime(r.ended_at)}</Cell> : <Cell style={{ color: colors.gradeHigh }}>진행 중</Cell>
              case 3:
                return <Cell style={{ color: colors.gradeHigh }}>{r.stats.상}</Cell>
              case 4:
                return <Cell style={{ color: colors.gradeMid }}>{r.stats.중}</Cell>
              case 5:
                return <Cell style={{ color: colors.gradeLow }}>{r.stats.하}</Cell>
              case 6:
                return <Cell>{r.stats.total}</Cell>
              default:
                return (
                  <Pressable onPress={() => downloadRunCsv(r.id)} hitSlop={8}>
                    {({ pressed }) => (
                      <Txt style={[text.sm, { color: colors.info, textDecorationLine: pressed ? 'underline' : 'none' }]}>CSV</Txt>
                    )}
                  </Pressable>
                )
            }
          }}
        />
      )}
    </Card>
  )
}

export function LocalArchiveCard({ version }: { version: number }) {
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    countJudges()
      .then((n) => (setCount(n), setError(false)))
      .catch(() => setError(true))
  }, [version])

  return (
    <Card title="기기 백업">
      {/* 화면 폭과 상관없이 같은 모양이 되도록 짧은 두 줄 + 아래 버튼으로 둔다. */}
      <View style={{ alignItems: 'flex-start', gap: 16, paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16 }}>
        {error ? (
          <View style={{ gap: 4 }}>
            <Txt>이 기기에서는 기록을 저장할 수 없습니다.</Txt>
            <Txt style={[text.sm, { color: colors.info }]}>기기 저장 공간을 확인하세요.</Txt>
          </View>
        ) : (
          <View style={{ gap: 4 }}>
            <Txt>이 기기에 판정 {count ?? 0}개를 보관하고 있습니다.</Txt>
            <Txt style={[text.sm, { color: colors.info }]}>서버에 접속할 수 없을 때를 대비한 보조 기록입니다.</Txt>
          </View>
        )}
        <GrayButton
          onPress={() => downloadCsv().catch((e: Error) => toast('error', 'CSV 를 내보내지 못했습니다', e.message))}
          disabled={!count}
        >
          CSV 내려받기
        </GrayButton>
      </View>
    </Card>
  )
}

// 누적 기록을 바탕으로 서버가 AI 분석을 만들어 준다.
// 서버 /advice 는 질문 하나에 답 하나라서 항목별 질문을 동시에 보내고, 오는 대로 채운다.
// 회차가 바뀌면 부모가 key 를 바꿔 결과를 비운다.
const ADVICE_TOPICS = [
  {
    title: '등급 분포 분석',
    question: '이번 회차의 상/중/하 등급 분포와 빨강 비율, 신뢰도 경향을 분석해 주세요. 눈에 띄는 점을 짧게 정리해 주세요.',
  },
  {
    title: '낙하 · 멍 상태 확인',
    question: '이번 회차에서 사과를 떨어뜨린 경우와 흠(멍) 비율이 높은 사과를 확인하고, 품질에 영향이 있었는지 짧게 정리해 주세요.',
  },
  {
    title: '작업 개선 조언',
    question: '파지 실패, 건너뜀, 떨어뜨림, 사이클 타임을 바탕으로 다음 작업에서 개선할 점을 짧게 조언해 주세요.',
  },
] as const

// 항목마다 같은 경고가 반복되거나 마크다운 기호가 섞여 오지 않게 모든 질문 뒤에 붙인다.
const ADVICE_RULES =
  ' 이 항목에 대한 내용만 답하고, 카메라 · 로봇 연결 상태 같은 경고나 머리말은 넣지 마세요.' +
  " 마크다운 기호(*, #, ---) 없이 3~5줄의 평문으로 답해 주세요. '굴림'은 '떨어뜨림'이라고 불러 주세요."

// 그래도 섞여 오는 마크다운 기호를 화면에 맞게 정리한다.
const plainAdvice = (s: string) =>
  s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^\s*-{3,}\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

type AdviceResult = { status: 'loading' } | { status: 'done'; advice: Advice } | { status: 'error'; message: string }

const fmtAdviceTime = (t: Advice['generated_at']) => fmtTime(typeof t === 'number' ? t : Date.parse(t) / 1000)

const allLoading = (): AdviceResult[] => ADVICE_TOPICS.map(() => ({ status: 'loading' }))

// 카드가 나타나면(화면을 열 때, 새 회차가 시작될 때) 바로 한 번 분석한다.
export function AdviceCard() {
  const [results, setResults] = useState<AdviceResult[]>(allLoading)
  const loading = results.some((r) => r.status === 'loading')
  const started = useRef(false)
  const alive = useRef(true)

  const request = () => {
    ADVICE_TOPICS.forEach((topic, i) => {
      api
        .advice(topic.question + ADVICE_RULES)
        .then((advice): AdviceResult => ({ status: 'done', advice }))
        // 503 이면 서버 detail 문구가 그대로 온다.
        .catch((err: Error): AdviceResult => ({ status: 'error', message: polite(err.message) }))
        .then((result) => alive.current && setResults((prev) => prev.map((r, j) => (j === i ? result : r))))
    })
  }

  useEffect(() => {
    alive.current = true
    if (!started.current) {
      started.current = true
      request()
    }
    return () => {
      alive.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onAnalyze = () => {
    setResults(allLoading())
    request()
  }

  const meta = results.find((r) => r.status === 'done')

  return (
    <Card
      title="AI 분석"
      right={
        <HeadRight>
          <GrayButton onPress={onAnalyze} disabled={loading}>
            {loading ? '분석 중…' : '다시 분석'}
          </GrayButton>
        </HeadRight>
      }
    >
      <View style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 8 }}>
        {ADVICE_TOPICS.map((topic, i) => {
          const r = results[i]
          return (
            <View
              key={topic.title}
              style={{ gap: 8, paddingVertical: 16, borderBottomWidth: i < ADVICE_TOPICS.length - 1 ? 1 : 0, borderBottomColor: colors.border }}
            >
              <Txt style={[text.lg, { fontWeight: '700' }]}>{topic.title}</Txt>
              {r.status === 'loading' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={colors.info} />
                  <Txt style={[text.sm, { color: colors.info }]}>분석하는 중입니다</Txt>
                </View>
              )}
              {r.status === 'error' && <Txt style={[text.sm, { color: colors.gradeLow }]}>{r.message}</Txt>}
              {r.status === 'done' && <Txt style={{ lineHeight: 26, color: colors.info }}>{plainAdvice(r.advice.advice)}</Txt>}
            </View>
          )
        })}
        {meta?.status === 'done' && (
          <Txt style={[text.xs, { paddingTop: 8, color: 'rgba(255,255,255,0.4)' }]}>
            {meta.advice.model} · {fmtAdviceTime(meta.advice.generated_at)}
          </Txt>
        )}
      </View>
    </Card>
  )
}
