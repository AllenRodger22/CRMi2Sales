import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import RouteGuard from './components/RouteGuard';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterPage from './pages/Register';
import UpdatePasswordPage from './pages/UpdatePassword';

const AppContent = () => {
    const { isPasswordRecovery, state } = useAuth();
    
    // The loading state is handled by RouteGuard for protected routes.
    // This initial loading can be useful for the overall app shell.
    if (state === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-white text-lg">Carregando sessão...</p>
            </div>
        );
    }

    if (isPasswordRecovery) {
        return <UpdatePasswordPage />;
    }

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
                path="/dashboard/*"
                element={
                    <RouteGuard>
                        <Dashboard />
                    </RouteGuard>
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
            <AppContent />
        </AuthProvider>
    </HashRouter>
  );
}
