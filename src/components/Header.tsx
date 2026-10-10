import { router } from 'expo-router'
import { useLg } from '@/hooks/useLg'
import { colors, text } from '@/theme'
import Btn from './Btn'
import HeaderBar from './HeaderBar'
import Logo from './Logo'

export default function Header() {
  const lg = useLg()
  return (
    <HeaderBar>
      <Logo />
      <Btn
        onPress={() => router.push('/dashboard')}
        style={[glow, { backgroundColor: colors.white, paddingHorizontal: lg ? 24 : 16, paddingVertical: 8 }]}
        textStyle={[lg ? text.base : text.sm, { color: colors.black, fontWeight: '600' }]}
      >
        바로가기
      </Btn>
    </HeaderBar>
  )
}

// shadow-[0_0_20px_rgba(255,255,255,0.5)]
export const glow = {
  shadowColor: '#fff',
  shadowOpacity: 0.5,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 0 },
  elevation: 6,
} as const
