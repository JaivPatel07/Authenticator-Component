import {BrowserRouter, Routes, Route} from 'react-router-dom'

import Auth from './Auth/authenticate.jsx'
import Register from './Auth/register.jsx'


export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}