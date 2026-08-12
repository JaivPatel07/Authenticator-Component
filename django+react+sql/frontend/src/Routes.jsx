import {BrowserRouter, Routes, Route} from 'react-router-dom'

import Auth from './Auth/authenticate.jsx'
import RegisterModal from './Auth/register.jsx'
import ForgotPassword from './Auth/ForgotPassword.jsx'
import ResetPasswordConfirm from './Auth/ResetPasswordConfirm.jsx'
import { OAuthCallback } from './api/oauth.jsx'
import Dashboard from './Auth/Dashboard.jsx' // Import the Dashboard component

import { useAuth } from './Auth/AuthContext.jsx'
import Layout from './Layout.jsx'

function OAuthCallbackWrapper() {
  const { login } = useAuth();
  return <OAuthCallback login={login} />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <RegisterModal />
      <Routes>
        {/* Pages without Navbar */}
        <Route path="/login" element={<Auth />} />

        {/* Pages with Navbar */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordConfirm />} />
          <Route path="/auth/callback/google" element={<OAuthCallbackWrapper />} />
          <Route path="/auth/callback/github" element={<OAuthCallbackWrapper />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}