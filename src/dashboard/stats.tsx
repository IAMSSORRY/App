import { useEffect, useState } from 'react'
import { View } from 'react-native'
import Txt from '@/components/Txt'
import { useLg } from '@/hooks/useLg'
import { api, type Grade, type Stats } from '@/lib/api'
import { colors, text } from '@/theme'
import { Card, gradeColor, Row, tabular } from './ui'

const unit = <Txt style={{ fontSize: 15, lineHeight: 20, color: colors.info }}>단위: 개</Txt>

export function GradeCountCard({ stats }: { stats: Stats }) {
  const lg = useLg()
  const grades: Grade[] = ['상', '중', '하']

  return (
    <Card title="등급별 사과 개수" right={unit} style={{ height: 280 }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: lg ? 48 : 24, paddingTop: 20 }}>
        {grades.map((g) => (
          <View key={g} style={{ width: lg ? 120 : 80, alignItems: 'center', gap: lg ? 32 : 24 }}>
            <Txt style={[lg ? { fontSize: 32, lineHeight: 40 } : text['2xl'], { fontWeight: '600', color: colors.info }]}>{g}</Txt>
            <Txt style={[text['5xl'], tabular, { fontWeight: '700', color: gradeColor[g] }]}>{stats[g]}</Txt>
          </View>
        ))}
      </View>
    </Card>
  )
}

// 현재 회차에서 떨어뜨린 사과 수. 화면의 recent 는 최근 50개뿐이라 회차 전체 이력에서 센다.
// refreshKey 가 바뀔 때(판정, 놓기 결과, 새 회차) 다시 센다.
export function DropCountCard({ refreshKey }: { refreshKey: string }) {
  const [counts, setCounts] = useState<{ dropped: number; placed: number } | null>(null)

  useEffect(() => {
    let alive = true
    api
      .history()
      .then((rows) => {
        if (!alive) return
        // roll_detected 가 null 이면 아직 놓기 결과가 오지 않은 판정이다.
        const placed = rows.filter((r) => r.roll_detected !== null)
        setCounts({ dropped: placed.filter((r) => r.roll_detected).length, placed: placed.length })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [refreshKey])

  return (
    <Card title="떨어뜨린 사과" right={unit} style={{ height: 280 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 20 }}>
        <Txt style={[text['5xl'], tabular, { fontWeight: '700' }, counts?.dropped ? { color: colors.gradeLow } : null]}>{counts?.dropped ?? '—'}</Txt>
        <Txt style={{ color: colors.info }}>
          {counts && counts.placed > 0
            ? `놓은 사과 ${counts.placed}개 중 ${((counts.dropped / counts.placed) * 100).toFixed(1)}%`
            : '아직 놓은 사과가 없습니다'}
        </Txt>
      </View>
    </Card>
  )
}

export function SummaryCard({ total, cycleTime }: { total: number; cycleTime: number | null }) {
  return (
    <Card title="처리 현황" style={{ height: 280 }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 20, paddingHorizontal: 29 }}>
        <Row label="전체" value={`${total}개`} />
        <Row label="사이클 타임" value={cycleTime !== null ? `${cycleTime.toFixed(1)}초` : '—'} />
      </View>
    </Card>
  )
}
