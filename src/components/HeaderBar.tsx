import { BlurView } from 'expo-blur'
import type { ReactNode } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLg } from '@/hooks/useLg'
import { colors, HEADER_HEIGHT } from '@/theme'

// 화면 위에 떠 있는 헤더 틀(fixed · bg-main-2/50 · backdrop-blur-xl · border-b).
// 상태 표시줄 영역까지 같은 배경으로 덮는다.
export default function HeaderBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()
  const lg = useLg()

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      {/* 안드로이드 블러는 비용이 커서 반투명 배경만 조금 진하게 쓴다 */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Platform.OS === 'ios' ? 'rgba(33,33,33,0.5)' : 'rgba(33,33,33,0.92)' }]} />
      <View style={[styles.row, { paddingHorizontal: lg ? 80 : 16 }]}>{children}</View>
    </View>
  )
}

// 헤더 높이(상태 표시줄 포함). 본문을 이만큼 밀어야 헤더에 가리지 않는다.
export function useHeaderOffset() {
  return useSafeAreaInsets().top + HEADER_HEIGHT
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  row: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
})
