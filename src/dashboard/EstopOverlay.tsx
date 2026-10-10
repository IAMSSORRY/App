import { BlurView } from 'expo-blur'
import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import Btn from '@/components/Btn'
import Txt from '@/components/Txt'
import { useLg } from '@/hooks/useLg'
import { api } from '@/lib/api'
import { polite } from '@/lib/polite'
import { toast } from '@/lib/toast'
import { colors, text } from '@/theme'

function Code({ children }: { children: string }) {
  return <Txt style={{ backgroundColor: colors.main3, color: colors.gradeMid }}>{` ${children} `}</Txt>
}

// 비상정지 화면. 원인(카메라, 로봇팔, 로봇 비상정지)이 하나라도 있으면 화면 전체를 덮는다.
// 해제 요청이 성공하면 원인이 바뀌기 전까지 다시 띄우지 않는다.
// robotReachable: 로봇 미션 프로그램에 닿는지. 꺼져 있으면 원격으로 해제할 수 없다.
export default function EstopOverlay({ reasons, robotReachable }: { reasons: { key: string; detail: string }[]; robotReachable: boolean }) {
  const lg = useLg()
  const [clearing, setClearing] = useState(false)
  // 해제하는 순간 모터 전원이 잠깐 빠져 팔이 처질 수 있어서 한 번 더 묻는다.
  const [confirming, setConfirming] = useState(false)
  const [dismissedKey, setDismissedKey] = useState<string | null>(null)
  const key = reasons.map((r) => `${r.key}:${r.detail}`).join('|')

  // 비상정지가 풀리면 해제 기록을 지운다. 그래야 같은 이유로 다시 멈췄을 때도 화면이 뜬다.
  if (!reasons.length && dismissedKey !== null) setDismissedKey(null)
  if (!reasons.length || dismissedKey === key) return null

  const onClear = async () => {
    setClearing(true)
    try {
      await api.control.resume()
      toast('success', '비상정지를 해제했습니다', '멈춘 사과부터 이어서 진행합니다')
      setDismissedKey(key)
    } catch (e) {
      toast('error', '비상정지를 해제하지 못했습니다', polite((e as Error).message))
    } finally {
      setClearing(false)
      setConfirming(false)
    }
  }

  const redButton = { backgroundColor: colors.gradeLow, paddingHorizontal: 32, paddingVertical: 12 }
  const redText = [text.lg, { fontWeight: '600' as const }]

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 60 }]} accessibilityViewIsModal accessibilityRole="alert">
      <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 32, paddingHorizontal: lg ? 40 : 24, paddingVertical: 64 }}>
        <Txt style={[lg ? text['4xl'] : text['3xl'], { fontWeight: '600', color: colors.gradeLow }]}>비상정지</Txt>
        <View style={{ maxWidth: 672, gap: 8 }}>
          {reasons.map((r) => (
            <Txt key={r.key} style={[lg ? text.xl : text.lg, { textAlign: 'center' }]}>
              {r.detail}
            </Txt>
          ))}
          <Txt style={{ marginTop: 8, textAlign: 'center', color: colors.info }}>위 이유로 비상정지가 되었습니다. 비상정지를 해제하시겠습니까?</Txt>
        </View>
        {!robotReachable && (
          <Txt style={{ maxWidth: 672, textAlign: 'center', color: colors.gradeMid }}>
            로봇 미션 프로그램에 연결할 수 없어 원격으로 해제할 수 없습니다. 로봇 PC에서 팔을 받친 상태로 <Code>python3 mission.py --resume</Code> 을
            실행한 뒤 <Code>python3 mission.py --serve</Code> 로 다시 켜 주세요.
          </Txt>
        )}
        {confirming ? (
          <View style={{ alignItems: 'center', gap: 16 }}>
            <Txt style={[text.lg, { fontWeight: '600', textAlign: 'center' }]}>팔을 받치고 있나요? 해제하면 팔이 잠깐 처질 수 있습니다.</Txt>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Btn
                onPress={() => setConfirming(false)}
                disabled={clearing}
                style={{ backgroundColor: colors.border, paddingHorizontal: 24, paddingVertical: 12 }}
                textStyle={{ fontWeight: '600' }}
              >
                취소
              </Btn>
              <Btn onPress={onClear} disabled={clearing} style={redButton} textStyle={redText}>
                {clearing ? '해제 중' : '해제하고 이어하기'}
              </Btn>
            </View>
          </View>
        ) : (
          <Btn onPress={() => setConfirming(true)} disabled={!robotReachable} style={redButton} textStyle={redText}>
            비상정지 해제
          </Btn>
        )}
      </ScrollView>
    </View>
  )
}
