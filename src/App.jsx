import React, { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProblemSection from './components/ProblemSection';
import HowItWorks from './components/HowItWorks';
import BlockchainFeature from './components/BlockchainFeature';
import DashboardPreview from './components/DashboardPreview';
import ComplaintForm from './components/ComplaintForm';
import Footer from './components/Footer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { Box, useTheme, CircularProgress } from '@mui/material';
import { useAuth } from './AuthContext';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" />;
    }

    return children;
};

const HomePage = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    return (
        <>
            <Box id="home">
                <Hero />
            </Box>

            <Box id="about" sx={{
                py: 12,
                background: isDarkMode ? '#0d1b33' : '#f0f3f7',
                borderTop: `1px solid ${theme.palette.divider}`
            }}>
                <ProblemSection />
                <HowItWorks />
                <BlockchainFeature />
            </Box>
        </>
    );
};

function App() {
    return (
        <Router>
            <Box sx={{ /* ... styles ... */ }}>
                <Navbar />

                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/report"
                        element={
                            <ProtectedRoute allowedRoles={['citizen']}>
                                <ComplaintForm />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['Admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>

                <Footer />
            </Box>
        </Router>
    );
}

export default App;