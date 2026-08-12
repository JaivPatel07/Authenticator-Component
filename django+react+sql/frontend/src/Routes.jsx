import {BrowserRouter, Routes, Route} from 'react-router-dom'

import Auth from './Auth/authenticate.jsx'
import Register from './Auth/register.jsx'
import ForgotPassword from './Auth/ForgotPassword.jsx'
import ResetPasswordConfirm from './Auth/ResetPasswordConfirm.jsx'
import { OAuthCallback } from './api/oauth.jsx'
import { useAuth } from './Auth/AuthContext.jsx'


function OAuthCallbackWrapper() {
  const { login } = useAuth();
  return <OAuthCallback login={login} />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordConfirm />} />
        <Route path="/auth/callback/google" element={<OAuthCallbackWrapper />} />
        <Route path="/auth/callback/github" element={<OAuthCallbackWrapper />} />
      </Routes>
    </BrowserRouter>
  )
}