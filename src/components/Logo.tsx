import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Pressable } from 'react-native'
import { useLg } from '@/hooks/useLg'

// logo.webp 는 229 x 64. 높이는 h-6 / lg:h-8
export default function Logo() {
  const h = useLg() ? 32 : 24
  return (
    <Pressable onPress={() => (router.canDismiss() ? router.dismissAll() : router.replace('/'))} hitSlop={8} accessibilityLabel="처음으로">
      <Image source={require('../../assets/images/logo.webp')} style={{ height: h, width: (h * 229) / 64 }} contentFit="contain" />
    </Pressable>
  )
}
