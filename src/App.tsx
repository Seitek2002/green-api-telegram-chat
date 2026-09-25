import { ChatLayout } from './components/ChatLayout'
import { LoginScreen } from './components/LoginScreen'
import { useAuthStore } from './store/authStore'

export default function App() {
  const isAuthorized = useAuthStore((state) => state.credentials !== null)
  return isAuthorized ? <ChatLayout /> : <LoginScreen />
}
