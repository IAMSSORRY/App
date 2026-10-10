import { Redirect } from 'expo-router'

// 없는 경로는 처음 화면으로 보낸다.
export default function NotFound() {
  return <Redirect href="/" />
}
