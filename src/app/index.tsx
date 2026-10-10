import { router } from 'expo-router'
import { useRef, useState } from 'react'
import { ScrollView, useWindowDimensions, View } from 'react-native'
import Btn from '@/components/Btn'
import Footer from '@/components/Footer'
import Header, { glow } from '@/components/Header'
import { useHeaderOffset } from '@/components/HeaderBar'
import ImageCard from '@/components/ImageCard'
import Rise from '@/components/Rise'
import Txt from '@/components/Txt'
import { useLg } from '@/hooks/useLg'
import { colors, text } from '@/theme'

type Feature = {
  title: string
  lead: string
  body: string[]
  image: number
  alt: string
}

const features: Feature[] = [
  {
    title: '조건을 고정합니다',
    lead: '트레이 위에서 바로 색을 보지 않습니다.',
    body: [
      '사과마다 카메라와의 거리, 각도, 받는 조명이 다르면 같은 사과도 다른 색으로 측정됩니다.',
      '암쏘사과는 사과를 집어 조명이 통제된 검사 위치로 옮긴 뒤 판별합니다.',
      '모든 사과가 같은 조건에서 평가됩니다.',
    ],
    image: require('../../assets/images/landing/condition.webp'),
    alt: '고정 카메라로 본 트레이와 로봇팔',
  },
  {
    title: '근거를 함께 보여줍니다',
    lead: '판정에 쓰인 색상값, 임계값, 신뢰도를 실시간으로 표시합니다.',
    body: ['결과만 보는 자동화는 현장이 믿지 못합니다.', '판정 과정이 눈에 보이면 사람이 확인할 수 있고,', '확인할 수 있어야 맡길 수 있습니다.'],
    image: require('../../assets/images/landing/evidence.webp'),
    alt: '대시보드의 사과 정보와 신뢰도 게이지',
  },
  {
    title: '손상을 스스로 검증합니다',
    lead: '적재 직후 영상으로 사과를 떨어뜨렸는지 감지합니다.',
    body: ['떨어뜨림이 감지되면 다음 동작의 접근 속도와 적재 높이를 자동으로 낮춥니다.', '현장의 상자와 사과가 예상과 달라도 시스템이 맞춰 들어갑니다.'],
    image: require('../../assets/images/landing/damage.webp'),
    alt: '대시보드의 미션 진행 현황',
  },
  {
    title: '쌓인 데이터로 흐름을 읽습니다',
    lead: '처리한 사과의 등급 분포를 누적해 기록합니다.',
    body: ['한 번의 선별로 끝나지 않습니다.', '선별 이력과 연동하면 기간별 품질 변화를 비교하고,', '수확 시기나 산지의 변화를 데이터로 확인할 수 있습니다.'],
    image: require('../../assets/images/landing/data.webp'),
    alt: '대시보드의 등급별 통계와 회차 기록',
  },
]

// 이미지 → 글 순서로 올라온다. 글은 이미지가 반쯤 올라왔을 때(0.4초) 시작해 0.12초씩 이어진다.
const textDelay = (i: number) => 0.4 + i * 0.12

export default function Landing() {
  const lg = useLg()
  const headerOffset = useHeaderOffset()
  const { height: screenH } = useWindowDimensions()
  // 기능 섹션의 위치(스크롤 기준)와 이미 보인 섹션
  const tops = useRef<Record<number, number>>({})
  const scrollY = useRef(0)
  const [seen, setSeen] = useState<Record<number, boolean>>({})

  // 섹션 윗변이 화면 75% 지점에 닿으면 재생한다(ScrollTrigger start: 'top 75%', once).
  const reveal = () => {
    const line = scrollY.current + screenH * 0.75
    const hits = Object.entries(tops.current).filter(([i, top]) => !seen[+i] && top <= line)
    if (hits.length) setSeen((prev) => ({ ...prev, ...Object.fromEntries(hits.map(([i]) => [i, true])) }))
  }

  const h1 = [lg ? text['4xl'] : text['2xl'], { fontWeight: '600' as const }]
  const info = { color: colors.info }

  return (
    <View style={{ flex: 1, backgroundColor: colors.main1 }}>
      <Header />
      <ScrollView
        contentContainerStyle={{ paddingTop: headerOffset }}
        scrollEventThrottle={32}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y
          reveal()
        }}
      >
        <View style={{ gap: 40 }}>
          {/* hero: 이미지가 먼저 올라오고 글이 뒤따른다 */}
          <View
            style={[
              { paddingHorizontal: lg ? 80 : 16, paddingVertical: lg ? 64 : 40, gap: 32 },
              lg ? { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } : { flexDirection: 'column-reverse' },
            ]}
          >
            <View style={{ gap: 32, flexShrink: 1 }}>
              <View style={{ gap: 16 }}>
                <Rise show delay={textDelay(0)}>
                  <Txt style={h1}>
                    암쏘사과는 판정 근거를 제시하는{'\n'}사과 선별 시스템입니다.
                  </Txt>
                </Rise>
                <Rise show delay={textDelay(1)}>
                  <Txt style={info}>등급만 내놓지 않고, 왜 그 등급인지를 함께 보여줍니다.</Txt>
                </Rise>
              </View>
              <Rise show delay={textDelay(2)} style={{ alignSelf: 'flex-start' }}>
                <Btn
                  onPress={() => router.push('/dashboard')}
                  style={[glow, { backgroundColor: colors.white, paddingHorizontal: lg ? 32 : 24, paddingVertical: 12 }]}
                  textStyle={[lg ? text.lg : text.base, { color: colors.black, fontWeight: '600' }]}
                >
                  바로가기 →
                </Btn>
              </Rise>
            </View>
            <Rise show>
              <ImageCard source={require('../../assets/images/landing/hero.webp')} alt="암쏘사과 대시보드 실시간 화면" />
            </Rise>
          </View>

          {features.map((f, i) => {
            const imageFirst = i % 2 === 0
            const show = !!seen[i]
            // 휴대폰에서는 섹션마다 이미지를 위에 둔다
            const card = (
              <Rise show={show}>
                <ImageCard source={f.image} alt={f.alt} />
              </Rise>
            )
            return (
              <View
                key={f.title}
                onLayout={(e) => {
                  tops.current[i] = e.nativeEvent.layout.y + headerOffset
                  reveal()
                }}
                style={[
                  { paddingHorizontal: lg ? 80 : 16, paddingVertical: 32, gap: 24 },
                  lg && { flexDirection: 'row', alignItems: 'center' },
                  imageFirst ? { backgroundColor: colors.main2, ...(lg && { gap: 96 }) } : lg && { justifyContent: 'space-between' },
                ]}
              >
                {(imageFirst || !lg) && card}
                <View style={{ gap: 16, flexShrink: 1 }}>
                  <Rise show={show} delay={textDelay(0)}>
                    <Txt style={h1}>{f.title}</Txt>
                  </Rise>
                  <Rise show={show} delay={textDelay(1)}>
                    <Txt style={info}>{f.lead}</Txt>
                  </Rise>
                  <Rise show={show} delay={textDelay(2)}>
                    <Txt style={info}>{f.body.join('\n')}</Txt>
                  </Rise>
                </View>
                {!imageFirst && lg && card}
              </View>
            )
          })}
        </View>
        <Footer />
      </ScrollView>
    </View>
  )
}
