import { useState, type ReactNode } from 'react'
import { ScrollView, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import Btn from '@/components/Btn'
import { WarnIcon } from '@/components/icons'
import Txt from '@/components/Txt'
import { useLg } from '@/hooks/useLg'
import type { Grade } from '@/lib/api'
import { cardShadow, colors, text } from '@/theme'

export const gradeColor: Record<Grade, string> = {
  상: colors.gradeHigh,
  중: colors.gradeMid,
  하: colors.gradeLow,
}

// tabular-nums: 숫자 폭을 맞춘다
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] }

export function Section({
  title,
  right,
  children,
  onLayout,
}: {
  title: string
  right?: ReactNode
  children: ReactNode
  onLayout?: (y: number) => void
}) {
  const lg = useLg()
  return (
    <View style={{ gap: 16 }} onLayout={onLayout && ((e) => onLayout(e.nativeEvent.layout.y))}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Txt style={[lg ? { fontSize: 32, lineHeight: 40 } : text['2xl'], { fontWeight: '600' }]}>{title}</Txt>
        {right}
      </View>
      {children}
    </View>
  )
}

export function Card({ title, right, children, style }: { title?: string; right?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    // 그림자는 overflow:hidden 과 함께 쓰면 iOS 에서 잘리므로 바깥 틀에 둔다.
    <View style={[styles.cardShadow, style]}>
      <View style={styles.card}>
        {title && (
          <View style={styles.cardHead}>
            <Txt style={[text.xl, { fontWeight: '600' }]}>{title}</Txt>
            {right}
          </View>
        )}
        {children}
      </View>
    </View>
  )
}

// 카드 머리줄 오른쪽 끝에 붙는 요소(ml-auto)
export function HeadRight({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }, style]}>{children}</View>
}

// 회색 둥근 버튼(bg-border px-5 py-1.5 text-sm font-semibold hover:bg-divider)
export function GrayButton({ onPress, disabled, children }: { onPress: () => void; disabled?: boolean; children: string }) {
  return (
    <Btn
      onPress={onPress}
      disabled={disabled}
      style={{ backgroundColor: colors.border, paddingHorizontal: 20, paddingVertical: 6 }}
      pressedStyle={{ backgroundColor: colors.divider }}
      textStyle={[text.sm, { fontWeight: '600' }]}
    >
      {children}
    </Btn>
  )
}

// alert: 카메라 다운처럼 사용자가 알아야 하는 상태는 디자인의 흐린 색보다 밝게 보인다.
export function Unavailable({ text: message, detail, alert = false }: { text: string; detail?: string; alert?: boolean }) {
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: 32, paddingHorizontal: 40 }]}>
      <WarnIcon size={64} />
      <View style={{ gap: 8 }}>
        <Txt style={{ fontWeight: '300', textAlign: 'center', color: alert ? colors.info : colors.border }}>{message}</Txt>
        {detail ? <Txt style={[text.sm, { fontWeight: '300', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }]}>{detail}</Txt> : null}
      </View>
    </View>
  )
}

export function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Txt style={{ fontWeight: '500', color: colors.info }}>{label}</Txt>
      {typeof value === 'string' ? <Txt style={[text['2xl'], { fontWeight: '600' }]}>{value}</Txt> : value}
    </View>
  )
}

// 값 옆의 작은 숫자는 판정 기준이다.
export function BigValue({ children }: { children: ReactNode }) {
  return <Txt style={[text['2xl'], { fontWeight: '600' }]}>{children}</Txt>
}

export function Stat({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Txt style={[text.sm, { color: colors.info }]}>{label}</Txt>
      <Txt style={[text['2xl'], tabular, { fontWeight: '600' }, color ? { color } : null]}>{value}</Txt>
    </View>
  )
}

// 넓은 화면은 가로로(fr 비율대로), 휴대폰은 세로로 쌓는다.
export function Grid({ weights, children }: { weights: number[]; children: ReactNode[] }) {
  const lg = useLg()
  return (
    <View style={lg ? { flexDirection: 'row', gap: 24, alignItems: 'stretch' } : { gap: 16 }}>
      {children.map((child, i) => (
        <View key={i} style={lg ? { flex: weights[i], minWidth: 0 } : undefined}>
          {child}
        </View>
      ))}
    </View>
  )
}

export type Column = { label: string; flex: number; align?: 'left' | 'right' }

// max-h-96 overflow-auto 표. 좁은 화면에서는 min-w-[560px] 로 가로 스크롤된다.
export function Table<T>({
  columns,
  rows,
  keyOf,
  renderCell,
  empty,
}: {
  columns: Column[]
  rows: T[]
  keyOf: (row: T) => string | number
  renderCell: (row: T, col: number) => ReactNode
  empty?: ReactNode
}) {
  // 가로 스크롤 안에서는 폭이 정해지지 않아 열이 내용 크기로 잡힌다. 보이는 폭을 재서 표 폭을 고정해야 열이 맞는다.
  const [visible, setVisible] = useState(0)
  return (
    <ScrollView style={{ maxHeight: 384 }} nestedScrollEnabled contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 16 }}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => setVisible(e.nativeEvent.layout.width)}
      >
        <View style={{ width: Math.max(560, visible) }}>
          <View style={{ flexDirection: 'row' }}>
            {columns.map((c, i) => (
              <Txt key={i} style={[styles.th, { flex: c.flex, textAlign: c.align ?? 'left' }]}>
                {c.label}
              </Txt>
            ))}
          </View>
          {rows.map((row) => (
            <View key={keyOf(row)} style={styles.tr}>
              {columns.map((c, i) => (
                <View key={i} style={{ flex: c.flex, alignItems: c.align === 'right' ? 'flex-end' : 'flex-start' }}>
                  {renderCell(row, i)}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      {empty}
    </ScrollView>
  )
}

export function Cell({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Txt style={[tabular, style]}>{children}</Txt>
}

export function EmptyText({ children }: { children: string }) {
  return <Txt style={{ paddingVertical: 32, textAlign: 'center', color: colors.info }}>{children}</Txt>
}

const styles = StyleSheet.create({
  cardShadow: { borderRadius: 12, ...cardShadow },
  card: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.main3,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 24 },
  th: { paddingVertical: 8, fontWeight: '500', color: colors.info },
  tr: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 8 },
})
