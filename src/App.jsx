import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProblemSection from './components/ProblemSection';
import HowItWorks from './components/HowItWorks';
import BlockchainFeature from './components/BlockchainFeature';
import DashboardPreview from './components/DashboardPreview';
import UserComplaints from './components/UserComplaints';
import AdminDashboard from './components/AdminDashboard';
import ComplaintForm from './components/ComplaintForm';
import Footer from './components/Footer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from './AuthContext';
import Profile from './components/Profile';

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

    // Fix: Normalize role to lowercase before checking permissions
    if (allowedRoles && !allowedRoles.includes(user.role.toLowerCase())) {
        return <Navigate to="/" />;
    }

    return children;
};

const HomePage = () => (/* ... existing HomePage code ... */
    <>
        <Box id="home"><Hero /></Box>
        <Box id="about" sx={{ py: 12 }}><ProblemSection /><HowItWorks /><BlockchainFeature /></Box>
    </>
);

function App() {
    return (
        <Router>
            <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['officer']}><DashboardPreview /></ProtectedRoute>} />
                    <Route path="/my-complaints" element={<ProtectedRoute allowedRoles={['citizen']}><UserComplaints /></ProtectedRoute>} />
                    <Route path="/report" element={<ProtectedRoute allowedRoles={['citizen']}><ComplaintForm /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                <Footer />
            </Box>
        </Router>
    );
}

export default App;