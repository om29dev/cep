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
import OfficerComplaints from './components/OfficerComplaints';
import WaterIntelligenceDashboard from './components/WaterIntelligenceDashboard';

// New comprehensive homepage sections

import FeaturesShowcase from './components/FeaturesShowcase';
import FAQSection from './components/FAQSection';
import CTASection from './components/CTASection';
import PresentationPage from './components/PresentationPage';

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

const HomePage = () => (
    <>
        {/* Hero Section - Main landing */}
        <Box id="home">
            <Hero />
        </Box>



        {/* Problem Section - The challenges */}
        <Box id="about">
            <ProblemSection />
        </Box>

        {/* How It Works - The UIIS solution */}
        <HowItWorks />

        {/* Features Showcase - All features */}
        <FeaturesShowcase />

        {/* Blockchain Feature - Transparency */}
        <BlockchainFeature />

        {/* FAQ Section - All questions answered */}
        <FAQSection />

        {/* Call to Action - Final push */}
        <CTASection />
    </>
);

import { useLocation } from 'react-router-dom';

function Layout() {
    const location = useLocation();
    const isPresentation = location.pathname === '/presentation';

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {!isPresentation && <Navbar />}
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/presentation" element={<PresentationPage />} />
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
                <Route path="/officer-complaints" element={<ProtectedRoute allowedRoles={['officer']}><OfficerComplaints /></ProtectedRoute>} />
                <Route path="/water-intelligence" element={<ProtectedRoute allowedRoles={['officer']}><WaterIntelligenceDashboard /></ProtectedRoute>} />

                <Route path="/my-complaints" element={<ProtectedRoute allowedRoles={['citizen']}><UserComplaints /></ProtectedRoute>} />
                <Route path="/report" element={<ProtectedRoute allowedRoles={['citizen']}><ComplaintForm /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            {!isPresentation && <Footer />}
        </Box>
    );
}

function App() {
    return (
        <Router>
            <Layout />
        </Router>
    );
}

export default App;