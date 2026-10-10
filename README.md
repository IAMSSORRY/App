# App — SSORRY 관제 앱

> 판정 근거를 제시하는 사과 선별 시스템

[Web 대시보드](https://github.com/IAMSSORRY/Web)를 같은 화면 구성으로 옮긴 React Native(Expo) 앱입니다.
현장에서 휴대폰이나 태블릿으로 로봇의 판정 과정을 보고, 바로 멈출 수 있습니다.

---

## 화면

| 경로 | 화면 |
|---|---|
| `/` | 랜딩 |
| `/dashboard` | 실시간 관제 대시보드 |

### 대시보드

| 섹션 | 구성 |
|---|---|
| **실시간** | 카메라 영상(실시간 사과 박스) · 해당 사과 정보 · 신뢰도 · 미션 진행 · 로봇 이벤트 |
| **통계** | 등급별 사과 개수 · 처리 현황 · 떨어뜨린 사과 |
| **분석** | 판정 이력 · 회차 기록 · 기기 백업 · AI 분석 |

화면 폭이 1024 이상(태블릿 가로)이면 웹과 같은 배치로 바뀝니다.

## 주요 기능

| 기능 | 내용 |
|---|---|
| 판정 근거 | 등급과 함께 빨강 비율 · 흠 비율 · 멍 비율 · 신뢰도 표시 |
| 비상정지 | 헤더 버튼으로 즉시 정지. 카메라 · 로봇팔 이상이 10초 넘게 이어지면 자동 비상정지 |
| CSV 내보내기 | 회차별 · 전체 · 기기 백업 CSV를 공유 시트로 내보내기 (파일 앱, 메일 등) |
| 기기 백업 | 받은 판정 기록을 기기에 저장 |
| AI 분석 | 등급 분포 분석 · 낙하 · 멍 상태 확인 · 작업 개선 조언 |

## 웹과 다른 점

| 웹 | 앱 |
|---|---|
| 개발 서버 프록시 + 세션 쿠키 | 서버로 직접 호출 |
| 브라우저 백업 (IndexedDB) | 기기 백업 (AsyncStorage) |
| CSV 파일 다운로드 | 공유 시트로 내보내기 |
| 마우스를 올리면 보이는 연결 상태 설명 | 연결 상태를 누르면 표시 |
| GSAP 등장 효과 | RN Animated 로 같은 효과 |

## 기술 스택

| 영역 | 스택 |
|---|---|
| 프레임워크 | React Native 0.86 · Expo SDK 57 · TypeScript |
| 라우팅 | Expo Router |
| UI | react-native-svg · expo-image · expo-blur · Pretendard |
| 저장 · 공유 | AsyncStorage · expo-file-system · expo-sharing |
| 통신 | fetch · WebSocket |

## 실행

```bash
npm install
npx expo start        # i: iOS 시뮬레이터, a: 안드로이드, 또는 Expo Go 로 QR 스캔
```

### 서버 주소

기본값은 `https://api.apah.site` 입니다 (`app.json` 의 `extra.apiBase`).

```bash
EXPO_PUBLIC_API_BASE=http://<서버 IP>:8000 npx expo start
```

### 세션 쿠키

서버는 세션 쿠키로 웹소켓을 확인합니다. 플랫폼마다 쿠키가 붙는 방식이 달라서 따로 처리합니다.

| 플랫폼 | 처리 |
|---|---|
| iOS | 웹소켓이 fetch 와 같은 쿠키 저장소를 쓰므로 헤더를 따로 넣지 않음 (넣으면 쿠키가 두 번 붙어 세션을 못 찾음) |
| Android | 웹소켓이 fetch 쿠키를 보지 못하므로 `/session` 에서 받은 값을 `Cookie` 헤더로 직접 넣음 |

## 구조

```
src/app/          라우트 (_layout, index = 랜딩, dashboard)
src/dashboard/    대시보드 카드 (실시간 · 통계 · 분석 · 비상정지 화면)
src/components/   헤더 · 푸터 · 토스트 · 공용 UI
src/hooks/        카메라 · 판정 웹소켓
src/lib/          API · CSV · 토스트 · 기기 백업
src/theme.ts      웹과 같은 색 · 글자 크기
```

## 관련 저장소

- [Web](https://github.com/IAMSSORRY/Web) — 웹 관제 대시보드
- [Server](https://github.com/IAMSSORRY/Server) — 영상 · 판정 · 제어 API
- [Piper](https://github.com/IAMSSORRY/Piper) — 로봇팔 제어 · 비전

## 팀

**암쏘사과** · 대구소프트웨어마이스터고등학교

| 이름 | 담당 |
|---|---|
| 이도건 | 대시보드, 로봇팔 제어 |
| 김준현 | 비전, 데이터 처리 |
