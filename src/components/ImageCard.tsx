import { Image, type ImageSource } from 'expo-image'
import { useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useLg } from '@/hooks/useLg'
import { colors, text } from '@/theme'
import { WarnIcon } from './icons'
import Txt from './Txt'

type Props = {
  source?: ImageSource | number
  alt?: string
  fallback?: ReactNode
}

const defaultFallback = (
  <View style={{ alignItems: 'center', justifyContent: 'center', gap: 24 }}>
    <WarnIcon />
    <Txt style={[text.xl, { color: colors.border, fontWeight: '500' }]}>이미지를 불러올 수 없습니다</Txt>
  </View>
)

// 휴대폰에서는 가로를 꽉 채운 2:1, 넓은 화면에서는 640 x 320
export default function ImageCard({ source, alt = '', fallback = defaultFallback }: Props) {
  const [failed, setFailed] = useState(false)
  const lg = useLg()

  return (
    <View style={[styles.card, lg ? { width: 640, height: 320 } : { width: '100%', aspectRatio: 2 }]}>
      {source && !failed ? (
        <Image source={source} accessibilityLabel={alt} style={styles.fill} contentFit="cover" onError={() => setFailed(true)} />
      ) : (
        fallback
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.main3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: { width: '100%', height: '100%' },
})
