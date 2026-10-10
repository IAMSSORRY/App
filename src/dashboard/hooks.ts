import { useEffect, useRef, useState } from 'react'
import type { useJudgeStream } from '@/hooks/useJudgeStream'
import { api, type ArmStatus, type Cameras, type ControlStatus, type MissionState } from '@/lib/api'
import { toast } from '@/lib/toast'

const POLL_MS = 2000
const ARM_POLL_MS = 3000

// 주기적으로 불러온다. 실패하면 onError 로 알린다.
function usePoll<T>(load: () => Promise<T>, ms: number, onData: (d: T) => void, onError: (e: Error) => void) {
  const latest = useRef({ load, onData, onError })
  useEffect(() => {
    latest.current = { load, onData, onError }
  })
  useEffect(() => {
    let alive = true
    const tick = () =>
      latest.current
        .load()
        .then((d) => alive && latest.current.onData(d))
        .catch((e: Error) => alive && latest.current.onError(e))
    tick()
    const id = setInterval(tick, ms)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [ms])
}

// /cameras 응답으로 카메라 목록과 카메라별 프레임 수신 여부를 본다.
// undefined: 아직 첫 응답 전, null: 서버 응답 없음
export function useCameras() {
  const [cameras, setCameras] = useState<Cameras | null | undefined>(undefined)
  usePoll(api.cameras, POLL_MS, setCameras, () => setCameras(null))
  return cameras
}

// 로봇팔 상태. 요청이 실패하면 서버 쪽 문제라서 여기서는 null 로 두고 서버 끊김으로 처리한다.
export function useArm() {
  const [arm, setArm] = useState<ArmStatus | null>(null)
  usePoll(api.arm, ARM_POLL_MS, setArm, () => setArm(null))
  return arm
}

// 로봇 미션 프로그램 상태. 꺼져 있거나 서버가 못 닿으면 null 이고, 그 이유(서버 detail)를 error 에 둔다.
export function useControlStatus() {
  const [status, setStatus] = useState<ControlStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  usePoll(
    api.control.status,
    POLL_MS,
    (d) => (setStatus(d), setError(null)),
    (e) => (setStatus(null), setError(e.message)),
  )
  return { status, error }
}

// 화면을 막 연 뒤에는 웹소켓이 붙는 중이라 상태가 잠깐 흔들린다. 그동안은 알리지 않는다.
const TOAST_GRACE_MS = 3000

// 헤더에 함께 보여줄 현재 문제들. down 은 선별이 멈추는 문제(빨강), warn 은 일부만 안 되는 문제(노랑).
// estop: 카메라/로봇팔 문제와 로봇 비상정지. 모두 비상정지 화면으로 알린다.
export type Issue = { key: string; label: string; level: 'down' | 'warn'; detail: string; estop?: boolean }

// 문제가 새로 생기거나 해결될 때 문제별로 한 번씩 알린다.
export function useIssueToasts(issues: Issue[] | null) {
  const prev = useRef<Map<string, Issue> | null>(null)
  const startedAt = useRef<number | null>(null)
  const keys = issues?.map((i) => i.key).join(',') ?? null

  useEffect(() => {
    // 첫 응답 전(null)은 비교하지 않는다.
    if (issues === null) return
    startedAt.current ??= Date.now()
    const before = prev.current
    const now = new Map(issues.map((i) => [i.key, i]))
    prev.current = now
    if (before === null || Date.now() - startedAt.current < TOAST_GRACE_MS) return

    for (const issue of now.values()) {
      if (!before.has(issue.key)) toast(issue.level === 'down' ? 'error' : 'warning', issue.label, issue.detail)
    }
    for (const issue of before.values()) {
      if (!now.has(issue.key)) toast('success', `${issue.label} 해결`, '정상으로 돌아왔습니다')
    }
    // 문제 목록(keys)이 바뀔 때만 비교한다. 같은 문제의 문구만 바뀐 건 알리지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys])
}

export function useRollToast(motion: ReturnType<typeof useJudgeStream>['motion']) {
  useEffect(() => {
    if (motion?.roll_detected) {
      toast('warning', '사과를 떨어뜨렸습니다', '다음 동작의 접근 속도와 적재 높이를 낮춥니다')
    }
  }, [motion])
}

export function useMissionFinishedToast(mission: MissionState | null) {
  const prev = useRef<MissionState['status'] | null>(null)
  const status = mission?.status ?? null

  useEffect(() => {
    const before = prev.current
    prev.current = status
    if (before && before !== 'finished' && status === 'finished') {
      const d = mission?.duration_s
      toast('success', '미션을 완료했습니다', d !== null && d !== undefined ? `소요 시간 ${d.toFixed(1)}초` : undefined)
    }
    // 상태가 바뀔 때만 본다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])
}

// 로봇이 미션을 하는 중에 이상이 이 시간 넘게 이어지면 비상정지를 보낸다.
const AUTO_ESTOP_MS = 10_000

// active 동안 abnormal 이 AUTO_ESTOP_MS 넘게 이어지면 한 번만 onTrigger 를 부른다.
// 이상이 사라지거나 로봇이 멈추면(active=false) 다시 감시한다.
export function useAutoEstop(abnormal: Issue[], active: boolean, onTrigger: (reason: string) => void) {
  const watching = active && abnormal.length > 0
  const latest = useRef({ abnormal, onTrigger })
  const fired = useRef(false)

  useEffect(() => {
    latest.current = { abnormal, onTrigger }
  })

  useEffect(() => {
    if (!watching) {
      fired.current = false
      return
    }
    if (fired.current) return
    const timer = setTimeout(() => {
      fired.current = true
      latest.current.onTrigger(latest.current.abnormal.map((i) => i.detail).join(' / '))
    }, AUTO_ESTOP_MS)
    return () => clearTimeout(timer)
  }, [watching])
}
