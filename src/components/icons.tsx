import { memo } from 'react'
import Svg, { ClipPath, Defs, G, Path } from 'react-native-svg'
import { colors } from '@/theme'

// public/warn.svg
export function WarnIcon({ size = 80 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <Path
        fill={colors.border}
        d="M42.063 50.063h-4.188l-.312-32.313h4.812zM40 63.313q-1.406 0-2.406-.97A3.2 3.2 0 0 1 36.625 60q0-1.406.969-2.375a3.28 3.28 0 0 1 2.406-1q1.375 0 2.344 1 .969.97.968 2.375 0 1.344-.968 2.344a3.2 3.2 0 0 1-2.344.968"
      />
      <Path
        fill={colors.border}
        d="M80 40c0 22.091-17.909 40-40 40S0 62.091 0 40 17.909 0 40 0s40 17.909 40 40M4 40c0 19.882 16.118 36 36 36s36-16.118 36-36S59.882 4 40 4 4 20.118 4 40"
      />
    </Svg>
  )
}

// public/gauge.svg 의 호 모양과 크기
export const GAUGE = { w: 167.274, h: 92, cx: 83.637, cy: 88, inner: 60 }
const ARC =
  'M155.637 88c4.418 0 8.041-3.59 7.6-7.987a80 80 0 0 0-23.032-48.582A79.99 79.99 0 0 0 53.022 14.09 80 80 0 0 0 4.036 80.013C3.596 84.41 7.22 88 11.636 88c4.42 0 7.95-3.595 8.5-7.98a64 64 0 0 1 127.001 0c.551 4.385 4.082 7.98 8.5 7.98'

// 원본은 conic-gradient(from 90deg, #33e 0, #e33 180deg, #ee3 225deg, #3e3 270deg, #3ee 315deg, #33e 360deg).
// SVG 에는 원뿔 그라데이션이 없어서 호 모양으로 자른 얇은 부채꼴을 여러 장 이어 그린다.
const STOPS: [number, [number, number, number]][] = [
  [180, [0xee, 0x33, 0x33]],
  [225, [0xee, 0xee, 0x33]],
  [270, [0x33, 0xee, 0x33]],
  [315, [0x33, 0xee, 0xee]],
  [360, [0x33, 0x33, 0xee]],
]

function colorAt(deg: number) {
  for (let i = 1; i < STOPS.length; i++) {
    const [d1, c1] = STOPS[i]
    const [d0, c0] = STOPS[i - 1]
    if (deg <= d1) {
      const t = (deg - d0) / (d1 - d0)
      const c = c0.map((v, k) => Math.round(v + (c1[k] - v) * t))
      return `rgb(${c[0]},${c[1]},${c[2]})`
    }
  }
  return 'rgb(51,51,238)'
}

// 원뿔 각도 → 화면 좌표의 점. CSS 원뿔은 위가 0°이고 시계 방향인데 from 90deg 로 시작점을 오른쪽으로 돌렸으므로
// 결과적으로 오른쪽이 0°, 아래가 90°, 왼쪽이 180°, 위가 270° 다.
function point(deg: number, r: number) {
  const rad = (deg * Math.PI) / 180
  return { x: GAUGE.cx + r * Math.cos(rad), y: GAUGE.cy + r * Math.sin(rad) }
}

const STEP = 2
const wedges: { d: string; fill: string }[] = []
for (let a = 176; a < 364; a += STEP) {
  const p0 = point(a, 120)
  const p1 = point(a + STEP + 0.5, 120)
  wedges.push({ d: `M${GAUGE.cx} ${GAUGE.cy}L${p0.x} ${p0.y}L${p1.x} ${p1.y}Z`, fill: colorAt(Math.min(Math.max(a + STEP / 2, 180), 360)) })
}

export const GaugeArc = memo(function GaugeArc() {
  return (
    <Svg width={GAUGE.w} height={GAUGE.h} viewBox={`0 0 ${GAUGE.w} ${GAUGE.h}`} fill="none">
      <Defs>
        <ClipPath id="arc">
          <Path d={ARC} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#arc)">
        {wedges.map((w, i) => (
          <Path key={i} d={w.d} fill={w.fill} />
        ))}
      </G>
    </Svg>
  )
})
