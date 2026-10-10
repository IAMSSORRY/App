import { useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import Btn from '@/components/Btn'
import DashboardHeader, { type Connection, type SectionId } from '@/components/DashboardHeader'
import Footer from '@/components/Footer'
import { useHeaderOffset } from '@/components/HeaderBar'
import Toaster from '@/components/Toaster'
import Txt from '@/components/Txt'
import { AdviceCard, HistoryCard, LocalArchiveCard, RunsCard } from '@/dashboard/analysis'
import EstopOverlay from '@/dashboard/EstopOverlay'
import {
  useArm,
  useAutoEstop,
  useCameras,
  useControlStatus,
  useIssueToasts,
  useMissionFinishedToast,
  useRollToast,
  type Issue,
} from '@/dashboard/hooks'
import { AppleInfoCard, CAM, ConfidenceCard, MissionCard, MissionEventsCard, stalledReason, VideoCard, type ControlAction } from '@/dashboard/realtime'
import { DropCountCard, GradeCountCard, SummaryCard } from '@/dashboard/stats'
import { Card, Grid, Section } from '@/dashboard/ui'
import { useJudgeStream } from '@/hooks/useJudgeStream'
import { useLg } from '@/hooks/useLg'
import { api, type Grade } from '@/lib/api'
import { saveJudges } from '@/lib/localdb'
import { polite } from '@/lib/polite'
import { toast } from '@/lib/toast'
import { colors, text } from '@/theme'

export default function Dashboard() {
  const lg = useLg()
  const headerOffset = useHeaderOffset()
  const judge = useJudgeStream()
  const cameras = useCameras()
  const arm = useArm()
  const { status: control, error: controlError } = useControlStatus()
  const robotState = control?.state ?? null
  const [resetting, setResetting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [runsKey, setRunsKey] = useState(0)

  // 헤더 메뉴(실시간 · 통계 · 분석)로 옮겨 갈 위치
  const scroll = useRef<ScrollView>(null)
  const sectionY = useRef<Partial<Record<SectionId, number>>>({})
  const onNavigate = (id: SectionId) => {
    const y = sectionY.current[id]
    if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })
  }

  const latest = judge.recent[0]
  // 수동 입력 판정(v_value 가 null, 신뢰도 0.0)은 평균에서 뺀다.
  const measured = judge.recent.filter((r) => r.v_value !== null)
  const average = measured.length ? measured.reduce((sum, r) => sum + r.confidence, 0) / measured.length : null

  // 헤더 연결상태. 화면에 쓰는 고정 카메라만 보고, 문제가 여러 개면 모두 함께 보여준다.
  const topCam = cameras?.cameras.find((c) => c.name === CAM)
  // 로봇팔 정보가 아예 없으면 확인할 수 없으므로 끊긴 것으로 본다.
  const armDead = arm ? arm.arms.length === 0 || arm.arms.some((a) => !a.connected || a.responding === false) : false
  const issues: Issue[] | null =
    cameras === undefined
      ? null
      : cameras === null
        ? // 서버가 죽으면 나머지 상태는 알 수 없으므로 이것만 보여준다.
          [{ key: 'server', label: '서버 연결 끊김', level: 'down', detail: '백엔드 서버가 응답하지 않습니다' }]
        : [
            // 로봇팔이 실제로 끊겼거나 응답하지 않을 때만 비상정지로 본다(화면 덮기, 자동 비상정지 대상).
            // 연결돼 있고 응답도 하는데 ok:false 인 경우(예: CAN 인터페이스 상태값만 DOWN)는 움직이는 로봇을
            // 멈추면 안 되므로 경고로만 보여준다.
            ...(arm?.ok === false && armDead
              ? [{ key: 'arm', label: '비상정지', level: 'down' as const, estop: true, detail: `로봇팔: ${polite(arm.message) ?? '로봇팔 상태를 확인하세요'}` }]
              : []),
            ...(arm?.ok === false && !armDead
              ? [{ key: 'arm-check', label: '로봇팔 확인 필요', level: 'warn' as const, detail: `로봇팔은 응답하지만 서버가 이상으로 봅니다: ${polite(arm.message) ?? '상태를 확인하세요'}` }]
              : []),
            // 화면을 덮는 비상정지는 로봇 프로그램이 직접 알려줄 때만 띄운다.
            // 로봇 프로그램에 닿지 못하면 서버의 미션 상태는 오래된 값일 수 있다(로봇 PC 에서 직접 해제한 경우 등).
            ...(robotState === 'estopped'
              ? [{ key: 'estop', label: '비상정지', level: 'down' as const, estop: true, detail: polite(control?.error ?? judge.mission?.estop_reason) ?? '로봇이 비상정지했습니다' }]
              : []),
            ...(control === null
              ? [
                  {
                    key: 'robot-offline',
                    label: '로봇 연결 끊김',
                    level: 'warn' as const,
                    // 꺼져 있는 것만이 아니라 토큰 불일치 같은 다른 이유도 있으므로 서버가 준 이유를 그대로 보여준다.
                    detail: `${polite(controlError) ?? '로봇 미션 프로그램에 연결할 수 없습니다'} (로봇 PC 에서 mission.py --serve 가 켜져 있는지, 토큰이 같은지 확인하세요).${
                      judge.mission?.status === 'estop' ? ` 마지막 기록: 비상정지 — ${polite(judge.mission.estop_reason) ?? '원인 미상'}` : ''
                    }`,
                  },
                ]
              : []),
            ...(robotState === 'stopping'
              ? [{ key: 'stopping', label: '정리 중', level: 'warn' as const, detail: '사과를 되돌리고 팔을 내린 뒤 비상정지합니다' }]
              : []),
            ...(robotState === 'error'
              ? [{ key: 'robot-error', label: '오류 정지', level: 'down' as const, estop: true, detail: polite(control?.error) ?? '로봇이 오류로 멈췄습니다' }]
              : []),
            ...(judge.mission?.status === 'stalled'
              ? [{ key: 'stalled', label: '로봇 응답 없음', level: 'warn' as const, detail: stalledReason(judge.missionEvents) ?? '로봇에서 소식이 끊겼습니다' }]
              : []),
            ...(judge.mission?.adaptive?.frozen
              ? [{ key: 'frozen', label: '자동 조정 중단', level: 'warn' as const, detail: '떨어뜨림 자동 조정이 멈췄습니다. 점검이 필요합니다' }]
              : []),
            ...(!topCam?.live
              ? [{ key: 'camera', label: '비상정지', level: 'down' as const, estop: true, detail: `카메라: ${polite(topCam?.error) ?? '고정 카메라에서 영상이 들어오지 않습니다'}` }]
              : []),
            ...(!judge.connected ? [{ key: 'judge', label: '판정 연결 끊김', level: 'warn' as const, detail: '판정 서버에 다시 연결하는 중입니다' }] : []),
          ]

  // 로봇팔이 죽으면 카메라가 살아 있어도 선별이 멈추므로 빨강이다.
  const connection: Connection = issues === null ? 'warn' : issues.some((i) => i.level === 'down') ? 'down' : issues.length ? 'warn' : 'ok'
  const state =
    issues === null ? '연결 확인 중' : issues.length ? [...new Set(issues.map((i) => i.label))].join(' · ') : judge.activeBox ? '판별 중' : '대기 중'
  const detail = issues?.length ? issues.map((i) => `${i.label}: ${i.detail}`).join('\n') : undefined

  useIssueToasts(issues)

  // 응답을 기다리지 않고 언제든 다시 보낼 수 있게 상태로 막지 않는다.
  const sendEstop = async (autoReason?: string) => {
    try {
      await api.control.estop()
      if (autoReason) toast('error', '10초 넘게 이상이 이어져 비상정지했습니다', autoReason)
      else toast('error', '비상정지했습니다')
    } catch (e) {
      toast('error', '비상정지가 로봇에 전달되지 않았습니다', `${polite((e as Error).message)} — 로봇 PC 에서 직접 멈추세요`)
    }
  }

  // 카메라, 로봇팔, 로봇 응답 없음, 자동 조정 중단이 로봇이 움직이는 동안 10초 넘게 이어지면 비상정지
  const robotMoving = robotState ? robotState === 'running' : judge.mission?.status === 'running' || judge.mission?.status === 'stalled'
  const abnormal = issues?.filter((i) => ['camera', 'arm', 'stalled', 'frozen'].includes(i.key)) ?? []
  useAutoEstop(abnormal, robotMoving, (reason) => sendEstop(reason))

  // 칸 비움. 사람이 상자 칸을 비웠다고 로봇에 알려 그 칸에 다시 놓게 한다.
  const onClear = async (grade?: Grade) => {
    try {
      await api.control.clear(grade)
      toast('success', grade ? `'${grade}' 칸을 비웠습니다` : '모든 칸을 비웠습니다', '로봇이 다음 사과부터 그 칸에 다시 놓습니다')
    } catch (e) {
      toast('error', '칸 비움을 로봇에 전달하지 못했습니다', polite((e as Error).message))
    }
  }

  const [pending, setPending] = useState<ControlAction | null>(null)
  const onControl = async (action: ControlAction) => {
    setPending(action)
    try {
      if (action === 'start') {
        await api.control.start()
        toast('success', '미션을 시작했습니다')
      } else if (action === 'stop') {
        await api.control.stop()
        toast('info', '정지했습니다', '이어서를 누르면 멈춘 사과부터 다시 진행합니다')
      } else if (action === 'resume') {
        await api.control.resume()
        toast('success', '이어서 진행합니다')
      } else {
        // park 는 정리가 끝난 뒤에(수 초) 응답하므로 누르는 즉시 먼저 알린다.
        toast('info', '정리 후 정지를 시작합니다', '사과를 되돌리고 팔을 내린 뒤 멈춥니다. 급하면 비상정지를 누르세요')
        await api.control.park()
        toast('success', '정리 후 정지했습니다', '해제하면 이어서 진행합니다')
      }
    } catch (e) {
      const failed = {
        start: '미션을 시작하지 못했습니다',
        stop: '정지하지 못했습니다',
        resume: '이어서 진행하지 못했습니다',
        park: '정리 후 정지를 하지 못했습니다',
      }[action]
      toast('error', failed, polite((e as Error).message))
    } finally {
      setPending(null)
    }
  }
  useRollToast(judge.motion)
  useMissionFinishedToast(judge.mission)

  const onReset = async () => {
    setResetting(true)
    setResetError(null)
    try {
      // 서버가 이전 회차를 SQLite 에 남기므로 기기 백업은 보조용이다. 실패해도 진행한다.
      await api
        .history()
        .then(saveJudges)
        .catch((e) => console.error('[localdb] 백업 실패', e))
      await api.resetStats()
      // 성공하면 서버가 모든 /ws/judge 에 새 snapshot 을 보내므로 화면은 그걸로 바뀐다.
      setRunsKey((k) => k + 1)
      toast('success', '새 회차를 시작했습니다', '이전 회차 기록은 분석 > 회차 기록에서 볼 수 있습니다')
    } catch (e) {
      setResetError(`새 회차를 시작하지 못했습니다: ${(e as Error).message}`)
      toast('error', '새 회차를 시작하지 못했습니다', (e as Error).message)
    } finally {
      setResetting(false)
      setConfirming(false)
    }
  }

  const gap = lg ? 24 : 16
  const pad = lg ? 80 : 16

  return (
    <View style={{ flex: 1, backgroundColor: colors.main1 }}>
      <DashboardHeader
        connection={connection}
        state={state}
        detail={detail}
        onEstop={() => sendEstop()}
        emphasizeEstop={robotState === 'stopping'}
        robotOffline={control === null}
        onNavigate={onNavigate}
      />
      <ScrollView ref={scroll} contentContainerStyle={{ paddingTop: headerOffset }}>
        <View style={{ gap: lg ? 40 : 32, padding: pad }}>
          <Section title="실시간" onLayout={(y) => (sectionY.current.realtime = y)}>
            <View style={{ gap }}>
              <Grid weights={[628, 302, 302]}>
                <VideoCard box={judge.activeBox} />
                <AppleInfoCard judge={latest} />
                <ConfidenceCard average={average} />
              </Grid>
              <Grid weights={[1, 1]}>
                <MissionCard
                  mission={judge.mission}
                  events={judge.missionEvents}
                  robotState={robotState}
                  pending={pending}
                  onControl={onControl}
                  placed={control?.placed ?? {}}
                  onClear={onClear}
                />
                <MissionEventsCard events={judge.missionEvents} />
              </Grid>
            </View>
          </Section>

          <Section
            title="통계"
            onLayout={(y) => (sectionY.current.stats = y)}
            right={
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                {resetError && <Txt style={[text.sm, { color: colors.gradeLow }]}>{resetError}</Txt>}
                {confirming ? (
                  <>
                    {lg && <Txt style={[text.sm, { color: colors.info }]}>현재 회차를 마감합니다. 기록은 서버에 남습니다</Txt>}
                    <Btn
                      onPress={() => setConfirming(false)}
                      disabled={resetting}
                      style={{ paddingHorizontal: 16, paddingVertical: 6 }}
                      pressedStyle={{ backgroundColor: colors.border }}
                      textStyle={[text.sm, { color: colors.info }]}
                    >
                      취소
                    </Btn>
                    <Btn
                      onPress={onReset}
                      disabled={resetting}
                      style={{ backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 6 }}
                      textStyle={[text.sm, { fontWeight: '600', color: colors.black }]}
                    >
                      {resetting ? '처리 중' : '시작'}
                    </Btn>
                  </>
                ) : (
                  <Btn
                    onPress={() => setConfirming(true)}
                    style={{ backgroundColor: colors.border, paddingHorizontal: 20, paddingVertical: 6 }}
                    pressedStyle={{ backgroundColor: colors.divider }}
                    textStyle={[text.sm, { fontWeight: '600' }]}
                  >
                    새 회차 시작
                  </Btn>
                )}
              </View>
            }
          >
            <Grid weights={[519, 302, 435]}>
              <GradeCountCard stats={judge.stats} />
              <SummaryCard total={judge.stats.total} cycleTime={judge.cycleTime} />
              <DropCountCard refreshKey={`${judge.stats.total}-${judge.motion?.ts ?? ''}-${judge.savedVersion}`} />
            </Grid>
          </Section>

          <Section title="분석" onLayout={(y) => (sectionY.current.analysis = y)}>
            <View style={{ gap }}>
              <HistoryCard recent={judge.recent} />
              {/* 판정 수가 바뀔 때마다 회차별 집계를 다시 받는다. */}
              <RunsCard refreshKey={`${runsKey}-${judge.stats.total}`} />
              <Grid weights={[1, 1]}>
                <LocalArchiveCard version={judge.savedVersion} />
                {/* 현재 회차를 확인한 뒤에 만들고, 회차가 바뀌면(새 회차 시작) 새로 만들어 다시 분석한다. */}
                {judge.runId !== null ? (
                  <AdviceCard key={judge.runId} />
                ) : (
                  <Card title="AI 분석">
                    <Txt style={[text.sm, { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16, color: colors.info }]}>기록을 불러오는 중입니다</Txt>
                  </Card>
                )}
              </Grid>
            </View>
          </Section>
        </View>
        <Footer />
      </ScrollView>
      <Toaster />
      <EstopOverlay reasons={issues?.filter((i) => i.estop) ?? []} robotReachable={control !== null} />
    </View>
  )
}
