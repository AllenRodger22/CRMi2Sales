
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuthBoot } from './auth/useAuthBoot';
// FIX: Changed to a named import for RequireAuth as it is not a default export.
import { RequireAuth } from './components/RequireAuth';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterPage from './pages/Register';
import UpdatePasswordPage from './pages/UpdatePassword';

const AuthBoot = () => {
    useAuthBoot();
    return null;
};

const AppContent = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route
                path="/dashboard/*"
                element={
                    <RequireAuth>
                        <Dashboard />
                    </RequireAuth>
                }
            />
            <Route path="*" element={<LoginPage />} />
        </Routes>
    );
};

export default function App() {
  return (
    <HashRouter>
        <AuthProvider>
            <AuthBoot />
            <AppContent />
        </AuthProvider>
    </HashRouter>
  );
}