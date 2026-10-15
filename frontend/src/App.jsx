import { Navigate, Route, Routes } from "react-router-dom";
import { FamilyWelcome } from "./components/FamilyWelcome.jsx";
import { GuestRoute, ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { CalendarPage } from "./pages/CalendarPage.jsx";
import { GamePage } from "./pages/GamePage.jsx";
import { OmokGamePage } from "./pages/OmokGamePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { PendingPage } from "./pages/PendingPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";

export default function App() {
  const { welcome, dismissWelcome } = useAuth();

  return (
    <>
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route path="/pending" element={<PendingPage />} />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/game"
        element={
          <ProtectedRoute>
            <GamePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/game/omok"
        element={
          <ProtectedRoute>
            <OmokGamePage />
          </ProtectedRoute>
        }
      />
      <Route path="/game/matgo" element={<Navigate to="/game" replace />} />
      <Route path="/game/dodge" element={<Navigate to="/game" replace />} />
      <Route path="/game/yut" element={<Navigate to="/game" replace />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/calendar" replace />} />
      <Route path="*" element={<Navigate to="/calendar" replace />} />
    </Routes>
    {welcome && (
      <FamilyWelcome url={welcome.url} name={welcome.name} onDone={dismissWelcome} />
    )}
    </>
  );
}
