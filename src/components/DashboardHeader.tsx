import { useEffect, useRef } from 'react'
import { Alert, Animated, Pressable, View } from 'react-native'
import { useLg } from '@/hooks/useLg'
import { colors, text } from '@/theme'
import HeaderBar from './HeaderBar'
import Logo from './Logo'
import Txt from './Txt'

export type SectionId = 'realtime' | 'stats' | 'analysis'

const nav: { id: SectionId; label: string }[] = [
  { id: 'realtime', label: '실시간' },
  { id: 'stats', label: '통계' },
  { id: 'analysis', label: '분석' },
]

// ok: 전부 정상, warn: 서버는 살아 있지만 카메라나 판정 스트림이 끊김, down: 서버 응답 없음
export type Connection = 'ok' | 'warn' | 'down'

const dotColor: Record<Connection, string> = {
  ok: colors.gradeHigh,
  warn: colors.gradeMid,
  down: colors.gradeLow,
}

type Props = {
  connection: Connection
  state: string
  // 웹에서는 마우스를 올리면 보이는 원인 설명. 앱에서는 상태를 누르면 보인다.
  detail?: string
  onEstop: () => void
  // 정리 후 정지 중이면 비상정지 버튼을 더 눈에 띄게 한다(정리를 버리고 즉시 멈출 수 있다).
  emphasizeEstop: boolean
  // 로봇 미션 프로그램에 닿지 못하면 웹 비상정지가 로봇까지 가지 않는다. 버튼은 막지 않고(다시 연결되면 바로 써야 하므로) 알리기만 한다.
  robotOffline: boolean
  onNavigate: (id: SectionId) => void
}

const ROBOT_OFFLINE_HINT = '로봇 미션 프로그램에 연결되지 않아 비상정지가 로봇에 전달되지 않습니다. 로봇 PC 에서 직접 멈추세요.'

export default function DashboardHeader({ connection, state, detail, onEstop, emphasizeEstop, robotOffline, onNavigate }: Props) {
  const lg = useLg()

  // animate-pulse: 1 → 0.5 → 1 (2초)
  const pulse = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (!emphasizeEstop) {
      pulse.setValue(1)
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [emphasizeEstop, pulse])

  return (
    <HeaderBar>
      <Logo />

      {lg && (
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 40 }}>
          {nav.map(({ id, label }) => (
            <Pressable key={id} onPress={() => onNavigate(id)} hitSlop={8}>
              {({ pressed }) => <Txt style={{ letterSpacing: 0.64, color: pressed ? colors.info : colors.white }}>{label}</Txt>}
            </Pressable>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: lg ? 12 : 8, flexShrink: 1, minWidth: 0 }}>
        <Pressable
          onPress={() => detail && Alert.alert('연결상태', detail)}
          disabled={!detail}
          style={{
            height: 32,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderRadius: 999,
            backgroundColor: colors.border,
            paddingHorizontal: lg ? 20 : 12,
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          {/* 휴대폰에서는 라벨을 빼고 점과 상태만 보여준다 */}
          {lg && <Txt style={{ fontWeight: '600' }}>연결상태</Txt>}
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dotColor[connection] }} />
          {lg && <View style={{ width: 1, height: 20, backgroundColor: colors.info }} />}
          {lg && <Txt style={{ fontWeight: '600' }}>상태</Txt>}
          <Txt numberOfLines={1} style={[lg ? text.base : text.sm, { flexShrink: 1, color: connection === 'ok' ? colors.info : colors.white }]}>
            {state}
          </Txt>
        </Pressable>

        {/* 비상 상황용이라 확인 없이 바로 보낸다. 응답을 기다리는 동안에도 다시 누를 수 있다. */}
        <Animated.View
          style={[
            { opacity: pulse, borderRadius: 999 },
            emphasizeEstop && { borderWidth: 4, borderColor: 'rgba(238,51,51,0.5)', margin: -4 },
          ]}
        >
          <Pressable
            onPress={onEstop}
            onLongPress={robotOffline ? () => Alert.alert('비상정지', ROBOT_OFFLINE_HINT) : undefined}
            style={({ pressed }) => ({
              height: 32,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 999,
              backgroundColor: colors.gradeLow,
              paddingHorizontal: lg ? 20 : 16,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Txt style={[lg ? text.base : text.sm, { fontWeight: '600' }]}>비상정지</Txt>
            {robotOffline && <Txt style={[text.xs, { marginLeft: 4, opacity: 0.8 }]}>(연결 끊김)</Txt>}
          </Pressable>
        </Animated.View>
      </View>
    </HeaderBar>
  )
}
