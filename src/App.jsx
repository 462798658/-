import React from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './state/AppContext'
import Layout from './components/Layout'
import { Celebration, ToastHost } from './components/ui'
import Login from './pages/Login'
import Home from './pages/Home'
import CheckinHub from './pages/CheckinHub'
import ReadingCheckin from './pages/ReadingCheckin'
import ReadingHistory from './pages/ReadingHistory'
import CalcCheckin from './pages/CalcCheckin'
import CalcRecords from './pages/CalcRecords'
import Points from './pages/Points'
import Shop from './pages/Shop'
import Orders from './pages/Orders'
import Addresses from './pages/Addresses'
import Records from './pages/Records'
import Rules from './pages/Rules'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

function RequireAuth({ children }) {
  const { user } = useApp()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function Overlays() {
  const { toasts, dismissToast, celebration, dismissCelebration } = useApp()
  return (
    <>
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
      <Celebration data={celebration} onClose={dismissCelebration} />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <div className="app-shell">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Home />} />
              <Route path="/checkin" element={<CheckinHub />} />
              <Route path="/checkin/reading" element={<ReadingCheckin />} />
              <Route path="/checkin/reading/history" element={<ReadingHistory />} />
              <Route path="/checkin/calc" element={<CalcCheckin />} />
              <Route path="/checkin/calc/records" element={<CalcRecords />} />
              <Route path="/points" element={<Points />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/addresses" element={<Addresses />} />
              <Route path="/records" element={<Records />} />
              <Route path="/rules" element={<Rules />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </div>
      </HashRouter>
      <Overlays />
    </AppProvider>
  )
}
