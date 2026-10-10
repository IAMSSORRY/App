// 웹(index.css 의 @theme)과 같은 값
export const colors = {
  main1: '#1E1E1E',
  main2: '#212121',
  main3: '#242424',
  border: '#343434',
  info: '#CCCCCC',
  divider: '#3D3D3D',
  gradeHigh: '#33EE33',
  gradeMid: '#EEEE33',
  gradeLow: '#EE3333',
  white: '#FFFFFF',
  black: '#000000',
} as const

// --spacing-header: 4rem
export const HEADER_HEIGHT = 64

// 웹 lg 브레이크포인트(1024px)
export const LG = 1024

// Tailwind 글자 크기(font-size / line-height)
export const text = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 30, lineHeight: 36 },
  '4xl': { fontSize: 36, lineHeight: 40 },
  '5xl': { fontSize: 48, lineHeight: 48 },
} as const

// shadow-card: 0 0 40px 5px rgba(0, 0, 0, 0.2)
export const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 0 },
  elevation: 6,
} as const

export const fontFamily = {
  '300': 'Pretendard-Light',
  '400': 'Pretendard-Regular',
  '500': 'Pretendard-Medium',
  '600': 'Pretendard-SemiBold',
  '700': 'Pretendard-Bold',
} as const
