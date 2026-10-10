import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AccessibilityInfo, Animated, Easing, type StyleProp, type ViewStyle } from 'react-native'

// 웹 랜딩의 GSAP 등장 효과: 40px 아래에서 0.8초 동안 power2.out 으로 올라오며 나타난다.
// show 가 true 가 되는 순간 delay(초) 뒤에 한 번만 재생한다.
export default function Rise({ show, delay = 0, style, children }: { show: boolean; delay?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current
  const played = useRef(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) {
      anim.setValue(1)
      return
    }
    if (!show || played.current) return
    played.current = true
    Animated.timing(anim, {
      toValue: 1,
      duration: 800,
      delay: delay * 1000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [show, delay, reduced, anim])

  return (
    <Animated.View
      style={[style, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  )
}

// 움직임 줄이기 설정이면 애니메이션 없이 그대로 보여준다
function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {})
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => sub.remove()
  }, [])
  return reduced
}
