import { FontAwesome6 } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Linking, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLg } from '@/hooks/useLg'
import { colors, text } from '@/theme'
import Txt from './Txt'

const muted = [text.sm, { fontWeight: '300' as const, color: 'rgba(255,255,255,0.6)' }]

// "·" 로 이은 목록. 좁은 화면에서는 항목 단위로만 줄을 바꾼다.
function Dotted({ items }: { items: string[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 4 }}>
      {items.map((item, i) => (
        <Txt key={item} style={muted}>
          {item}
          {i < items.length - 1 && ' ·'}
        </Txt>
      ))}
    </View>
  )
}

export default function Footer() {
  const lg = useLg()
  const insets = useSafeAreaInsets()
  const logo = lg ? 64 : 48
  const title = [lg ? text.xl : text.lg]

  return (
    <View style={styles.footer}>
      {/* blur-[120px] 처럼 색만 번진 배경 */}
      <Image
        source={require('../../assets/images/ftBg.webp')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={80}
        pointerEvents="none"
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(30,30,30,0.35)' }]} pointerEvents="none" />
      <View
        style={{
          paddingHorizontal: lg ? 80 : 16,
          paddingTop: lg ? 64 : 40,
          paddingBottom: (lg ? 64 : 40) + insets.bottom,
          gap: lg ? 40 : 32,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <Image source={require('../../assets/images/icon.webp')} style={{ width: logo, height: logo }} contentFit="contain" />
          <Pressable onPress={() => Linking.openURL('https://github.com/IAMSSORRY')} accessibilityLabel="GitHub" hitSlop={8}>
            <FontAwesome6 name="github" size={logo} color={colors.white} />
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          <Txt style={[title, { fontWeight: '600' }]}>암쏘사과 - SSORRY</Txt>
          <Txt style={[title, { fontWeight: '500' }]}>판정 근거를 제시하는 사과 선별 시스템</Txt>
        </View>

        <View style={{ gap: 8 }}>
          <Txt style={muted}>PAC 2026 Physical AI Challenge</Txt>
          <Dotted items={['분과① 로보틱스 미션', '안동청과 기업문제 해결', '고등부']} />
          <Txt style={muted}>2026.10.09 - 10.10</Txt>
        </View>

        <View style={{ gap: 8 }}>
          <Txt style={muted}>이도건 — 랜딩페이지 · 로봇 제어</Txt>
          <Txt style={muted}>김준현 — Full Stack</Txt>
          <Txt style={muted}>대구소프트웨어마이스터고등학교</Txt>
        </View>

        <Dotted items={['Piper Studio', 'Python', 'OpenCV', 'React', 'TypeScript']} />

        <Txt style={muted}>© 2026 암쏘사과</Txt>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  footer: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
