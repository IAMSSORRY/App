import { useWindowDimensions } from 'react-native'
import { LG } from '@/theme'

// 웹의 lg: 접두사. 태블릿 가로 화면처럼 넓으면 데스크톱 배치를 쓴다.
export function useLg() {
  return useWindowDimensions().width >= LG
}
