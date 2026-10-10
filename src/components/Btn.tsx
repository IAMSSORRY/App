import type { ReactNode } from 'react'
import { Pressable, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import Txt from './Txt'

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>
  // 웹의 hover 대신 누르는 동안의 모양
  pressedStyle?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  children: ReactNode
}

// 둥근 버튼. 글자만 넘기면 Txt 로 감싼다. disabled 면 웹의 disabled:opacity-40 처럼 흐려진다.
export default function Btn({ style, pressedStyle, textStyle, children, disabled, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
        style,
        pressed && (pressedStyle ?? { opacity: 0.8 }),
        disabled && { opacity: 0.4 },
      ]}
    >
      {typeof children === 'string' || Array.isArray(children) ? <Txt style={textStyle}>{children}</Txt> : children}
    </Pressable>
  )
}
