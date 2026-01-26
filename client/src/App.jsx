import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';
import HomePage from './pages/HomePage';
import MaterialListPage from './pages/MaterialListPage';
import MaterialDetailPage from './pages/MaterialDetailPage';
import QuizSessionPage from './pages/QuizSessionPage';
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import QuizEditorPage from './pages/QuizEditorPage';
import ForumPage from './pages/ForumPage';

import { Toaster } from 'react-hot-toast';
import { AudioProvider } from './context/AudioContext';

function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <Router>
          <Toaster 
            position="top-center" 
            reverseOrder={false} 
            toastOptions={{
              duration: 5000,
              style: {
                background: '#333',
                color: '#fff',
                zIndex: 9999,
              },
            }} 
          />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
            <Route path="/dashboard-guru" element={<RequireRole role="guru"><TeacherDashboard /></RequireRole>} />
            <Route path="/dashboard-admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
            <Route path="/manage-quiz/:materiId" element={<QuizEditorPage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/belajar/:kategori" element={<MaterialListPage />} />
            <Route path="/materi/:id" element={<MaterialDetailPage />} />
            <Route path="/quiz/:materiId" element={<QuizSessionPage />} />
          </Routes>
        </Router>
      </AudioProvider>
    </AuthProvider>
  );
}

const RootRedirect = () => {
  const auth = useAuth() || {};
  const user = auth.user;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'guru') return <Navigate to="/dashboard-guru" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard-admin" replace />;
  return <HomePage />;
};

const PublicOnly = ({ children }) => {
  const auth = useAuth() || {};
  const user = auth.user;
  if (user?.role === 'guru') return <Navigate to="/dashboard-guru" replace />;
  if (user?.role === 'admin') return <Navigate to="/dashboard-admin" replace />;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const RequireRole = ({ role, children }) => {
  const auth = useAuth() || {};
  const user = auth.user;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/belajar/akademik" replace />;
  return children;
};

export default App;
