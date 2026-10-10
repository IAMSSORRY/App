import { Image } from 'expo-image'
import { useEffect, useRef, useState } from 'react'
import { Animated, ScrollView, StyleSheet, View } from 'react-native'
import { GAUGE, GaugeArc } from '@/components/icons'
import Txt from '@/components/Txt'
import { useCameraStream } from '@/hooks/useCameraStream'
import type { LiveJudge, useJudgeStream } from '@/hooks/useJudgeStream'
import { useLg } from '@/hooks/useLg'
import type { ControlStatus, Grade, MissionEvent, MissionPhase, MissionState, RobotState } from '@/lib/api'
import { fmtTime, num, pct } from '@/lib/format'
import { polite } from '@/lib/polite'
import { colors, text } from '@/theme'
import Btn from '@/components/Btn'
import { BigValue, Card, gradeColor, Row, Stat, tabular, Unavailable } from './ui'

type ActiveBox = ReturnType<typeof useJudgeStream>['activeBox']

// 고정 카메라(top)만 보여준다.
export const CAM = 'top'

const textShadow = { textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }

type Bbox = [number, number, number, number]

function Box({ bbox, natural, color, thin, label, labelColor }: { bbox: Bbox; natural: { w: number; h: number }; color: string; thin?: boolean; label?: string; labelColor?: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        borderWidth: 2,
        borderColor: color,
        left: `${(bbox[0] / natural.w) * 100}%`,
        top: `${(bbox[1] / natural.h) * 100}%`,
        width: `${(bbox[2] / natural.w) * 100}%`,
        height: `${(bbox[3] / natural.h) * 100}%`,
      }}
    >
      {label ? (
        thin ? (
          <View style={{ position: 'absolute', top: -20, left: 0, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 4 }}>
            <Txt numberOfLines={1} style={text.xs}>{label}</Txt>
          </View>
        ) : (
          <Txt numberOfLines={1} style={[text.sm, { position: 'absolute', top: -24, left: 0, fontWeight: '600', color: labelColor }]}>
            {label}
          </Txt>
        )
      ) : null}
    </View>
  )
}

export function VideoCard({ box }: { box: ActiveBox }) {
  const lg = useLg()
  const camera = useCameraStream(CAM)
  const [natural, setNatural] = useState({ w: 640, h: 480 })
  const [size, setSize] = useState({ w: 0, h: 0 })
  // bbox 는 판정한 카메라의 JPEG 픽셀 좌표라서 그 카메라에만 그린다.
  // 다운 동안에는 배경 영상이 없으므로 박스도 숨긴다.
  const shownBox = box?.cam === CAM && !camera.down ? box : null
  const hasFrame = camera.frameUrl !== null

  // 카드를 꽉 채우도록(cover) 프레임 비율 그대로 키우고 넘치는 쪽은 잘라낸다.
  // 프레임과 같은 비율의 상자 안에서 그리므로 bbox 는 퍼센트로 그대로 얹힌다.
  const ratio = natural.w / natural.h
  const frameW = Math.max(size.w, size.h * ratio)
  const frameH = frameW / ratio

  return (
    <Card style={{ height: lg ? 330 : 240 }}>
      <View style={StyleSheet.absoluteFill} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} />
      {hasFrame && size.w > 0 && (
        <View style={{ position: 'absolute', width: frameW, height: frameH, left: (size.w - frameW) / 2, top: (size.h - frameH) / 2 }}>
          <Image
            source={{ uri: camera.frameUrl! }}
            accessibilityLabel="실시간 영상"
            style={{ width: '100%', height: '100%' }}
            contentFit="fill"
            cachePolicy="none"
            transition={0}
            onLoad={(e) => {
              const { width: w, height: h } = e.source
              if (w && h && (w !== natural.w || h !== natural.h)) setNatural({ w, h })
            }}
          />
          {/* 비전이 프레임마다 보내는 실시간 박스. 판정 박스보다 얇게 그린다. */}
          {!camera.down &&
            camera.detections.map((d, i) => (
              <Box
                key={i}
                bbox={d.bbox}
                natural={natural}
                thin
                color={d.grade ? gradeColor[d.grade] : 'rgba(255,255,255,0.8)'}
                label={d.grade || d.score !== undefined ? `${d.grade ?? ''}${d.score !== undefined ? ` ${Math.round(d.score * 100)}%` : ''}` : undefined}
              />
            ))}
          {shownBox && <Box bbox={shownBox.bbox} natural={natural} color={gradeColor[shownBox.grade]} label={shownBox.grade} labelColor={gradeColor[shownBox.grade]} />}
        </View>
      )}
      {camera.down ? (
        // 마지막 프레임이 있으면 그 위에 어둡게 덮는다.
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(36,36,36,0.85)' }]}>
          <Unavailable text={polite(camera.down.message)} detail={polite(camera.down.reason)} alert />
        </View>
      ) : (
        !hasFrame && <Unavailable text={camera.status === 'open' ? '카메라 연결 대기 중' : '영상을 불러올수 없습니다'} />
      )}

      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <Txt style={[text.xl, textShadow, { fontWeight: '600' }]}>실시간 영상</Txt>
      </View>
    </Card>
  )
}

// 등급 규칙: 빨강 비율 >= 기준 이고 흠·멍 비율 <= 기준 이면 상. 로봇이 이유(reasons)를 보내면 그것을 그대로 쓴다.
function evidenceText(j: LiveJudge) {
  if (j.extra?.reasons?.length) return `${j.extra.reasons.join(', ')} → ${j.grade}`
  if (j.v_value === null || j.threshold === null) return null
  const parts = [`빨강 ${num(j.v_value)} ${j.v_value >= j.threshold ? '≥' : '<'} ${num(j.threshold)}`]
  if (j.extra) {
    parts.push(`흠 ${num(j.extra.dark_ratio)} ${j.extra.dark_ratio <= j.extra.dark_max ? '≤' : '>'} ${num(j.extra.dark_max)}`)
  }
  return `${parts.join(', ')} → ${j.grade}`
}

function Measured({ value, limit }: { value: number; limit: number }) {
  return (
    <BigValue>
      {num(value)}
      <Txt style={{ fontWeight: '500', color: colors.info }}> / {num(limit)}</Txt>
    </BigValue>
  )
}

export function AppleInfoCard({ judge }: { judge: LiveJudge | undefined }) {
  const lg = useLg()
  const evidence = judge && evidenceText(judge)

  return (
    <Card title="해당 사과 정보" style={lg ? { height: 330 } : { minHeight: 280 }}>
      {judge ? (
        <View style={{ flex: 1, justifyContent: 'center', gap: 16, paddingHorizontal: 29, paddingVertical: lg ? 0 : 20 }}>
          <Row label="등급" value={<Txt style={[text['2xl'], { fontWeight: '600', color: gradeColor[judge.grade] }]}>{judge.grade}</Txt>} />
          {/* 근거 수치가 없으면(null) 숨긴다. 값 옆의 작은 숫자는 판정 기준이다. */}
          {judge.v_value !== null && judge.threshold !== null && (
            <Row label="빨강 비율" value={<Measured value={judge.v_value} limit={judge.threshold} />} />
          )}
          {/* 멍(회전 검사)을 쟀으면 멍, 아니면 흠을 보인다 — 카드 높이가 정해져 있어 한 줄만 */}
          {judge.extra &&
            (judge.extra.bruise_ratio != null && judge.extra.bruise_max != null ? (
              <Row label="멍 비율" value={<Measured value={judge.extra.bruise_ratio} limit={judge.extra.bruise_max} />} />
            ) : (
              <Row label="흠 비율" value={<Measured value={judge.extra.dark_ratio} limit={judge.extra.dark_max} />} />
            ))}
          {/* 수동 입력 판정(v_value 가 null)은 신뢰도가 0.0 으로 오므로 숨긴다. */}
          {judge.v_value !== null && <Row label="신뢰도" value={pct(judge.confidence)} />}
          {judge.v_value === null && <Txt style={[text.sm, { color: colors.info }]}>카메라 판정 없이 입력된 등급입니다</Txt>}
          {evidence ? <Txt style={[text.sm, { color: colors.info }]}>{evidence}</Txt> : null}
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Txt style={{ color: colors.info }}>판정 대기 중</Txt>
        </View>
      )}
    </Card>
  )
}

export function ConfidenceCard({ average }: { average: number | null }) {
  // 신뢰도는 임계값에서 떨어진 정도라 0.5~1.0 이다. 50% 를 왼쪽 끝(-90°), 100% 를 오른쪽 끝(90°)으로 둔다.
  const ratio = Math.min(Math.max(((average ?? 0.5) - 0.5) / 0.5, 0), 1)
  const angle = useRef(new Animated.Value(-90 + ratio * 180)).current
  useEffect(() => {
    Animated.timing(angle, { toValue: -90 + ratio * 180, duration: 500, useNativeDriver: true }).start()
  }, [ratio, angle])

  // 바늘(8 x 24)은 호 중심(cx, cy)을 축으로 돈다.
  const needleH = 24
  const pivotY = GAUGE.inner + needleH

  return (
    <Card title="신뢰도" style={{ height: 330 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <View style={{ width: GAUGE.w, height: GAUGE.h }}>
          <GaugeArc />
          {average !== null && (
            <Animated.View
              style={{
                position: 'absolute',
                width: 8,
                height: needleH,
                borderRadius: 999,
                backgroundColor: colors.white,
                left: GAUGE.cx - 4,
                top: GAUGE.cy - pivotY,
                transformOrigin: [4, pivotY, 0],
                transform: [{ rotate: angle.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) }],
              }}
            />
          )}
        </View>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Txt style={[text.xl, { fontWeight: '600' }]}>평균 신뢰도</Txt>
          <Txt style={{ fontSize: 40, lineHeight: 44, fontWeight: '600' }}>{average !== null ? pct(average) : '—'}</Txt>
        </View>
      </View>
    </Card>
  )
}

export const phaseLabel: Record<MissionPhase, string> = {
  pick: '집는 중',
  inspect: '검사 중',
  place: '놓는 중',
  home: '복귀 중',
  nudge: '사과 위치 조정 중',
  estop_return: '사과 되돌리는 중',
  estop_rest: '팔 내리는 중',
}

const statusLabel: Record<MissionState['status'], { text: string; bg: string; fg: string }> = {
  idle: { text: '대기 중', bg: colors.border, fg: colors.info },
  running: { text: '진행 중', bg: colors.gradeHigh, fg: colors.black },
  paused: { text: '정지됨', bg: colors.gradeMid, fg: colors.black },
  stalled: { text: '응답 없음', bg: colors.gradeMid, fg: colors.black },
  finished: { text: '완료', bg: colors.white, fg: colors.black },
  estop: { text: '비상정지', bg: colors.gradeLow, fg: colors.black },
}

// stalled 의 원인은 state 에 없고 stalled 이벤트의 reason 으로 온다.
export function stalledReason(events: MissionEvent[]) {
  const reason = events.find((e) => e.event === 'stalled')?.reason
  return typeof reason === 'string' ? polite(reason) : undefined
}

export type ControlAction = 'start' | 'stop' | 'resume' | 'park'

function Badge({ label, bg, fg, outline }: { label: string; bg?: string; fg: string; outline?: boolean }) {
  return (
    <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 2, backgroundColor: bg, borderWidth: outline ? 1 : 0, borderColor: colors.border }}>
      <Txt style={[text.sm, { color: fg, fontWeight: outline ? '400' : '600' }]}>{label}</Txt>
    </View>
  )
}

// rounded-full px-4 py-0.5 font-semibold disabled:opacity-40
function ControlButton({ label, onPress, disabled, variant }: { label: string; onPress: () => void; disabled?: boolean; variant: 'white' | 'gray' | 'danger' }) {
  return (
    <Btn
      onPress={onPress}
      disabled={disabled}
      style={{ paddingHorizontal: 16, paddingVertical: 2, backgroundColor: variant === 'white' ? colors.white : colors.border }}
      pressedStyle={variant === 'white' ? { opacity: 0.85 } : { backgroundColor: colors.divider }}
      textStyle={[text.sm, { fontWeight: '600', color: variant === 'white' ? colors.black : variant === 'danger' ? colors.gradeLow : colors.white }]}
    >
      {label}
    </Btn>
  )
}

function Warning({ color, children }: { color: string; children: string }) {
  return <Txt style={[text.sm, { fontWeight: '600', color }]}>{children}</Txt>
}

export function MissionCard({
  mission,
  events,
  robotState,
  pending,
  onControl,
  placed,
  onClear,
}: {
  mission: MissionState | null
  events: MissionEvent[]
  // 로봇 미션 프로그램 상태. 모르면(꺼져 있음) null
  robotState: RobotState | null
  pending: ControlAction | null
  onControl: (action: ControlAction) => void
  // 이번 미션에 칸별로 놓은 개수(로봇 기록)
  placed: NonNullable<ControlStatus['placed']>
  onClear: (grade?: Grade) => void
}) {
  const lg = useLg()
  const running = robotState ? robotState === 'running' : mission?.status === 'running' || mission?.status === 'stalled'
  const halted = robotState === 'estopped' || robotState === 'error'
  // 운영자가 '정지'로 멈춘 상태(모터는 켜 둠). '이어서'로 다시 진행한다.
  const paused = robotState ? robotState === 'stopped' : mission?.status === 'paused'
  // 로봇 프로그램에 닿지 못하면 시작 명령을 보낼 곳이 없다.
  const offline = robotState === null
  // 처음 보는 status 가 와도 깨지지 않게 배지는 생략한다.
  // 로봇 프로그램에 닿지 못하면 서버의 비상정지 기록은 오래된 값일 수 있어 그대로 보여주지 않는다.
  const status = !mission
    ? null
    : robotState === null && mission.status === 'estop'
      ? { text: '연결 끊김', bg: colors.border, fg: colors.info }
      : (statusLabel[mission.status] ?? null)
  const index = mission?.apple_index ?? 0
  const count = mission?.apple_count ?? 0

  const progress = useRef(new Animated.Value(0)).current
  const progressRatio = count > 0 ? index / count : 0
  useEffect(() => {
    Animated.timing(progress, { toValue: progressRatio, duration: 500, useNativeDriver: false }).start()
  }, [progressRatio, progress])

  const phaseText = !mission
    ? ''
    : mission.status === 'finished'
      ? `미션 완료${mission.duration_s !== null ? ` (${mission.duration_s.toFixed(1)}초)` : ''}`
      : mission.status === 'estop'
        ? offline
          ? '로봇 상태 모름'
          : '비상정지'
        : paused
          ? '정지됨'
          : mission.status === 'stalled'
            ? `${mission.phase ? `${phaseLabel[mission.phase] ?? mission.phase}에서 ` : ''}멈춤`
            : mission.phase
              ? phaseLabel[mission.phase]
              : '대기 중'

  return (
    <Card
      title="미션 진행"
      style={{ minHeight: 330 }}
      right={
        <View style={{ marginLeft: 'auto', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          {mission?.sim && <Badge label="시뮬레이션" fg={colors.info} outline />}
          {status && <Badge label={status.text} bg={status.bg} fg={status.fg} />}
          {robotState === 'stopping' ? null : running || paused ? (
            <>
              {paused ? (
                <ControlButton variant="white" onPress={() => onControl('resume')} disabled={pending !== null} label={pending === 'resume' ? '요청 중' : '이어서'} />
              ) : (
                // 그 자리에서 즉시 멈춘다(비상정지 아님, 모터는 켠 채)
                <ControlButton variant="gray" onPress={() => onControl('stop')} disabled={pending !== null} label={pending === 'stop' ? '요청 중' : '정지'} />
              )}
              {/* 위급하지 않을 때: 사과를 되돌리고 팔을 내린 뒤 멈춘다 */}
              <ControlButton variant="danger" onPress={() => onControl('park')} disabled={pending !== null} label={pending === 'park' ? '요청 중' : '정리 후 정지'} />
            </>
          ) : (
            // 비상정지·오류 정지 중에는 시작할 수 없다. 해제(이어하기)로 다시 움직인다.
            <ControlButton variant="white" onPress={() => onControl('start')} disabled={pending !== null || halted || offline} label={pending === 'start' ? '시작 중' : '시작'} />
          )}
        </View>
      }
    >
      {!mission ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Txt style={{ color: colors.info }}>미션 정보를 기다리는 중</Txt>
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', gap: 24, paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16 }}>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <Txt style={[lg ? text['3xl'] : text['2xl'], tabular, { fontWeight: '600', flexShrink: 0 }]}>
                {/* 사과 개수 제한이 없는 미션은 전체 개수(apple_count)가 오지 않는다. */}
                {count ? `사과 ${index} / ${count}` : index ? `사과 ${index}번째` : '사과 —'}
              </Txt>
              <Txt style={{ color: colors.info, flexShrink: 1, textAlign: 'right' }}>{phaseText}</Txt>
            </View>
            {/* 전체 개수를 모르면 진행률을 낼 수 없으므로 막대를 숨긴다. */}
            {count > 0 && (
              <View style={{ height: 8, overflow: 'hidden', borderRadius: 999, backgroundColor: colors.border }}>
                <Animated.View
                  style={{ height: '100%', backgroundColor: colors.white, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}
                />
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 }}>
            {[
              <Stat key="ok" label="파지 성공" value={mission.picks_ok} />,
              <Stat key="fail" label="파지 실패" value={mission.picks_failed} color={mission.picks_failed ? colors.gradeLow : undefined} />,
              <Stat key="skip" label="건너뜀" value={mission.skipped} color={mission.skipped ? colors.gradeMid : undefined} />,
              // 자동 조정: 사과를 떨어뜨리면 하강 속도와 놓는 높이를 낮춘다.
              <Stat key="scale" label="하강 속도" value={mission.adaptive ? `×${mission.adaptive.scale.toFixed(2)}` : '—'} />,
              <Stat key="h" label="놓는 높이" value={mission.adaptive ? `${(mission.adaptive.release_h * 100).toFixed(1)}cm` : '—'} />,
            ].map((stat) => (
              <View key={stat.key} style={{ width: lg ? '20%' : '33.333%', paddingRight: 16 }}>
                {stat}
              </View>
            ))}
          </View>

          {/* 로봇은 이번 미션에 놓은 자리를 기억해 그 위에 겹쳐 놓지 않는다. 사람이 칸을 비우면 '비움'으로 알려야 다시 놓는다. */}
          {!offline && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <Txt style={[text.sm, { color: colors.info }]}>상자 칸</Txt>
              {(['상', '중', '하'] as const).map((g) => (
                <View key={g} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, borderWidth: 1, borderColor: colors.border, paddingVertical: 2, paddingLeft: 12, paddingRight: 4 }}>
                  <Txt style={[text.sm, { fontWeight: '600', color: gradeColor[g] }]}>{g}</Txt>
                  <Txt style={[text.sm, tabular]}>{placed[g] ?? 0}개</Txt>
                  <ClearButton label="비움" onPress={() => onClear(g)} />
                </View>
              ))}
              <ClearButton label="전체 비움" onPress={() => onClear()} />
            </View>
          )}

          {robotState === 'stopping' && (
            <Warning color={colors.gradeLow}>
              {`정리 중… (${mission.phase === 'estop_rest' ? '팔 내리는 중' : '사과 되돌리는 중'}) — 급하면 비상정지를 누르세요`}
            </Warning>
          )}
          {halted && <Warning color={colors.gradeLow}>비상정지 중 — 해제한 뒤 시작할 수 있습니다</Warning>}
          {offline && <Warning color={colors.gradeMid}>로봇 미션 프로그램에 연결할 수 없어 웹에서 제어할 수 없습니다</Warning>}
          {mission.status === 'stalled' && (
            <Warning color={colors.gradeMid}>{`로봇 응답 없음${stalledReason(events) ? ` — ${stalledReason(events)}` : ''}`}</Warning>
          )}
          {mission.adaptive?.frozen && <Warning color={colors.gradeMid}>자동 조정 중단 — 점검이 필요합니다</Warning>}
        </View>
      )}
    </Card>
  )
}

function ClearButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Btn onPress={onPress} style={{ paddingHorizontal: 8 }} pressedStyle={{ backgroundColor: colors.border }} textStyle={[text.sm, { color: colors.info }]}>
      {label}
    </Btn>
  )
}

const f = (e: MissionEvent, key: string) => e[key] as number | string | boolean | null | undefined

// 이벤트를 화면 문구로. 모르는 이벤트는 null 을 돌려 목록에서 뺀다(상태는 state 로 반영된다).
function describeEvent(e: MissionEvent): { text: string; color?: string } | null {
  switch (e.event) {
    case 'start': {
      const count = f(e, 'apple_count')
      return { text: count ? `미션 시작 (사과 ${count}개)` : '미션 시작' }
    }
    case 'apple': {
      const total = f(e, 'total')
      return { text: total ? `사과 ${f(e, 'index')} / ${total} 시작` : `사과 ${f(e, 'index')}번째 시작` }
    }
    case 'phase': {
      const label = phaseLabel[f(e, 'phase') as MissionPhase]
      return label ? { text: label } : null
    }
    case 'pick': {
      const attempt = Number(f(e, 'attempt') ?? 0) + 1
      return f(e, 'ok')
        ? { text: `파지 성공 (폭 ${f(e, 'width_mm')}mm)` }
        : { text: `파지 실패 (${attempt}번째 시도)`, color: colors.gradeLow }
    }
    case 'skip': {
      const reason = f(e, 'reason')
      return { text: `사과 ${f(e, 'index')} 건너뜀${reason ? ` (${polite(String(reason))})` : ''}`, color: colors.gradeMid }
    }
    case 'collision': {
      // 벽 등에 부딪혀 팔을 원위치하고 다시 시도한다(미션은 계속).
      const reason = f(e, 'reason')
      return { text: `충돌 감지 — 원위치 후 다시 시도${reason ? ` (${polite(String(reason))})` : ''}`, color: colors.gradeMid }
    }
    case 'pause': {
      const reason = f(e, 'reason')
      return { text: `정지${reason ? ` (${polite(String(reason))})` : ''}`, color: colors.gradeMid }
    }
    case 'adaptive': {
      const scale = Number(f(e, 'scale'))
      const releaseH = Number(f(e, 'release_h'))
      return {
        text: `자동 조정: 하강 속도 ×${scale.toFixed(2)}, 놓는 높이 ${(releaseH * 100).toFixed(1)}cm${f(e, 'frozen') ? ' (중단)' : ''}`,
        color: scale < 1 || f(e, 'frozen') ? colors.gradeMid : undefined,
      }
    }
    case 'end': {
      const d = f(e, 'duration_s')
      return { text: `미션 완료${typeof d === 'number' ? ` (${d.toFixed(1)}초)` : ''}`, color: colors.gradeHigh }
    }
    case 'stalled': {
      const reason = f(e, 'reason')
      return { text: `로봇 응답 없음${reason ? ` (${polite(String(reason))})` : ''}`, color: colors.gradeMid }
    }
    case 'resume':
      return { text: `비상정지 해제 — 사과 ${f(e, 'index') ?? ''}번째부터 이어서`, color: colors.gradeHigh }
    case 'estop':
      return { text: `비상정지${f(e, 'reason') ? `: ${polite(String(f(e, 'reason')))}` : ''}`, color: colors.gradeLow }
    default:
      return null
  }
}

export function MissionEventsCard({ events }: { events: MissionEvent[] }) {
  const items = events.map((e, i) => ({ e, i, d: describeEvent(e) })).filter((x) => x.d)
  return (
    <Card title="로봇 이벤트" style={{ height: 330 }}>
      <ScrollView style={{ flex: 1 }} nestedScrollEnabled contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 16 }}>
        {items.map(({ e, i, d }, n) => (
          <View key={`${e.ts}-${i}`} style={{ flexDirection: 'row', gap: 16, paddingVertical: 8, borderTopWidth: n === 0 ? 0 : 1, borderTopColor: colors.border }}>
            <Txt style={[tabular, { color: 'rgba(255,255,255,0.5)' }]}>{fmtTime(e.ts)}</Txt>
            <Txt style={[{ flex: 1 }, d!.color ? { color: d!.color } : null]}>{d!.text}</Txt>
          </View>
        ))}
        {events.length === 0 && <Txt style={{ paddingVertical: 32, textAlign: 'center', color: colors.info }}>아직 이벤트가 없습니다</Txt>}
      </ScrollView>
    </Card>
  )
}
