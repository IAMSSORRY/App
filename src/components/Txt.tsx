import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native'
import { colors, fontFamily } from '@/theme'

// Pretendard 는 굵기마다 파일이 따로라서 fontWeight 를 그 굵기의 폰트 이름으로 바꾼다.
// 안드로이드는 커스텀 폰트에 fontWeight 를 같이 주면 기본 폰트로 돌아가므로 fontWeight 는 지운다.
function weightToFamily(weight: TextStyle['fontWeight']) {
  switch (String(weight ?? '400')) {
    case '100':
    case '200':
    case '300':
      return fontFamily['300']
    case '500':
      return fontFamily['500']
    case '600':
      return fontFamily['600']
    case '700':
    case '800':
    case '900':
    case 'bold':
      return fontFamily['700']
    default:
      return fontFamily['400']
  }
}

export default function Txt({ style, ...rest }: TextProps) {
  const { fontWeight, ...flat }: TextStyle = StyleSheet.flatten([base.text, style]) ?? {}
  return <Text {...rest} style={[flat, { fontFamily: weightToFamily(fontWeight) }]} />
}

const base = StyleSheet.create({
  text: { color: colors.white, fontSize: 16, lineHeight: 24 },
})
