# SSORRY App — 암쏘사과 관제 앱

[Web](https://github.com/IAMSSORRY/Web) 대시보드를 같은 모양으로 옮긴 React Native(Expo) 앱입니다.

| 경로 | 화면 |
|---|---|
| `/` | 랜딩 |
| `/dashboard` | 실시간 관제 대시보드 (실시간 · 통계 · 분석) |

## 실행

```bash
npm install
npx expo start        # i: iOS 시뮬레이터, a: 안드로이드, 또는 Expo Go 로 QR 스캔
```

서버 주소는 기본 `https://api.apah.site` 입니다(`app.json` 의 `extra.apiBase`).
바꾸려면 `EXPO_PUBLIC_API_BASE=http://<서버IP>:8000 npx expo start`.

## 웹과 다른 점

| 웹 | 앱 |
|---|---|
| 개발 서버 프록시 + 세션 쿠키 | 서버로 직접 호출. 세션 쿠키는 기기 쿠키 저장소가 fetch · 웹소켓에 같이 붙인다 |
| 마우스를 올리면 보이는 연결 상태 설명 | 연결 상태 알약을 누르면 표시 |
| 브라우저 백업(IndexedDB) | 기기 백업(AsyncStorage) |
| CSV 파일 다운로드 | 공유 시트로 내보내기(파일 앱 저장, 메일 등) |
| 서버 박스가 없을 때 브라우저 색 검출로 박스 표시 | 서버(비전)가 보낸 박스만 표시 |
| GSAP 등장 효과 | RN Animated 로 같은 효과(40px · 0.8초) |
| `lg:`(1024px) 배치 | 화면 폭 1024 이상(태블릿 가로)이면 같은 배치 |

## 구조

```
src/app/          라우트 (_layout, index=랜딩, dashboard)
src/components/   헤더 · 푸터 · 토스트 · 공용 UI
src/dashboard/    대시보드 카드 (실시간 · 통계 · 분석 · 비상정지 화면)
src/hooks/        카메라 · 판정 웹소켓
src/lib/          API · CSV · 토스트 · 기기 백업
src/theme.ts      웹과 같은 색 · 글자 크기
```
