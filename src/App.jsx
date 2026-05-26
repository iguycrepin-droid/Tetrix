import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider } from './hooks/useAuth'
import { ConsentProvider, useConsent } from './components/ConsentBanner'
import { I18nProvider } from './lib/i18n'
import { SplashScreen } from './components/SplashScreen'
import { ConsentBanner } from './components/ConsentBanner'
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages'
import { MenuPage } from './pages/MenuPage'
import { GamePage } from './pages/GamePage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { StorePage } from './pages/StorePage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { TermsOfUsePage } from './pages/TermsOfUsePage'
import { NotFoundPage } from './pages/NotFoundPage'

function AppInner() {
  const [splashDone, setSplashDone] = useState(false)
  const { needsConsent, grantAll, grantEssentialOnly } = useConsent()

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      {splashDone && needsConsent && (
        <ConsentBanner onAccept={grantAll} onDecline={grantEssentialOnly} />
      )}
      <Routes>
        <Route path="/" element={<Navigate to="/menu" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfUsePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <ConsentProvider>
          <AuthProvider>
            <AppInner />
          </AuthProvider>
        </ConsentProvider>
      </BrowserRouter>
    </I18nProvider>
  )
}
