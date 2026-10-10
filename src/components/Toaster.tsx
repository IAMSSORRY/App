import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLg } from '@/hooks/useLg'
import { dismissToast, useToasts, type Toast, type ToastTone } from '@/lib/toast'
import { cardShadow, colors, text } from '@/theme'
import Txt from './Txt'

const bar: Record<ToastTone, string> = {
  success: colors.gradeHigh,
  warning: colors.gradeMid,
  error: colors.gradeLow,
  info: colors.info,
}

// toast-in: 아래에서 8px 올라오며 나타난다(200ms)
function ToastItem({ t }: { t: Toast }) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start()
  }, [anim])

  return (
    <Animated.View
      accessibilityRole={t.tone === 'error' ? 'alert' : 'text'}
      style={[
        styles.toast,
        { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
      ]}
    >
      <View style={{ width: 4, backgroundColor: bar[t.tone] }} />
      <View style={{ flex: 1, gap: 4, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Txt style={{ fontWeight: '600' }}>{t.title}</Txt>
        {t.message ? <Txt style={[text.sm, { color: colors.info }]}>{t.message}</Txt> : null}
      </View>
      <Pressable onPress={() => dismissToast(t.id)} accessibilityLabel="닫기" style={{ padding: 12, alignSelf: 'flex-start' }} hitSlop={6}>
        {({ pressed }) => <Txt style={{ color: pressed ? colors.white : colors.info }}>✕</Txt>}
      </Pressable>
    </Animated.View>
  )
}

export default function Toaster() {
  const toasts = useToasts()
  const insets = useSafeAreaInsets()
  const lg = useLg()

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        lg ? { right: 24, width: 384, bottom: 24 + insets.bottom } : { left: 16, right: 16, bottom: 16 + insets.bottom },
      ]}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', zIndex: 50, gap: 12 },
  toast: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.main3,
    ...cardShadow,
  },
})
