import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, Button, useTheme, IconButton, Paper, Grid, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Shield, Lock, Database, Cpu, Droplets, Activity, CheckCircle, Map, Zap, AlertTriangle, FileText, Globe, Maximize, Minimize } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PresentationPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const slides = [
        {
            id: 1,
            type: "title",
            title: "Urban Water Intelligence System",
            subtitle: "Transforming Urban Water Management Through AI & Blockchain Technology"
        },
        {
            id: 2,
            type: "content",
            title: "The Crisis We're Solving",
            subtitle: "Urban water infrastructure faces critical challenges that demand innovation.",
            items: [
                { icon: AlertTriangle, title: "Trust Deficit", text: "70% of citizen complaints are dismissed due to lack of verification, creating mistrust between citizens and authorities." },
                { icon: Activity, title: "Data Overload", text: "Municipal officers spend 40% of their time filtering spam and duplicate reports instead of solving real issues." },
                { icon: Globe, title: "No Real-Time Visibility", text: "Water shortages and contamination events go unreported for days, escalating into crises." }
            ]
        },
        {
            id: 3,
            type: "content",
            title: "Our Solution: UIIS Platform",
            subtitle: "A complete ecosystem that bridges the gap between citizens & water authorities",
            items: [
                { icon: FileText, title: "Smart Reporting", text: "Citizens submit geo-tagged complaints with photo evidence, AI auto-categorizes and prioritizes them instantly." },
                { icon: Shield, title: "Verified Trust", text: "Every complaint is cryptographically hashed and stored on our blockchain layer - tamper-proof and auditable." },
                { icon: Zap, title: "Intelligent Resolution", text: "Officers receive AI-powered insights, priority queues, and contamination source mapping for faster action." }
            ]
        },
        {
            id: 4,
            type: "feature",
            title: "AI-Powered Smart Analysis",
            subtitle: "Google Gemini AI (gemini-1.5-flash) processes every complaint in real-time",
            features: [
                { label: "Auto-Categorization", desc: "Instantly classifies: No Water, Leakage, Contamination, Illegal Connection, Infrastructure Damage" },
                { label: "Urgency Scoring", desc: "AI assigns priority levels (Low → Emergency) based on content analysis and historical patterns" },
                { label: "Spam Detection", desc: "Filters out 95%+ of irrelevant, abusive, or duplicate submissions before they reach officers" },
                { label: "Location Intelligence", desc: "Clusters nearby complaints to identify hotspots and potential contamination sources" }
            ],
            icon: Cpu
        },
        {
            id: 5,
            type: "feature",
            title: "Blockchain Transparency Layer",
            subtitle: "Cryptographic proof-of-integrity that eliminates trust issues forever",
            features: [
                { label: "SHA-256 Hashing", desc: "Every complaint receives a unique cryptographic hash that cannot be altered or deleted" },
                { label: "Immutable Chain", desc: "All hashes are linked in a verifiable chain - proving data existed at a specific timestamp" },
                { label: "Public Auditability", desc: "Citizens can verify their complaints were recorded; authorities can prove they took action" },
                { label: "Anti-Manipulation", desc: "Once recorded, no one - not even admins - can modify or delete complaint history" }
            ],
            icon: Lock
        },
        {
            id: 6,
            type: "content",
            title: "Citizen Experience",
            subtitle: "Empowering citizens with a voice that cannot be ignored",
            items: [
                { icon: Map, title: "One-Click Reporting", text: "Submit complaints with automatic GPS tagging, upload photos, and get instant AI-generated category suggestions." },
                { icon: CheckCircle, title: "Real-Time Tracking", text: "Track complaint status from submission to resolution. Get notified when officers take action." },
                { icon: Shield, title: "Blockchain Receipt", text: "Receive a cryptographic hash as proof your complaint was recorded - auditable forever." }
            ]
        },
        {
            id: 7,
            type: "content",
            title: "Officer Dashboard",
            subtitle: "AI-powered command center for water management officers",
            items: [
                { icon: Activity, title: "Priority Queue", text: "See all complaints ranked by AI urgency. Emergency cases surface automatically to the top." },
                { icon: Map, title: "Live Hotspot Map", text: "Interactive Leaflet map showing complaint clusters, pipeline overlays, and contamination zones." },
                { icon: Database, title: "Water Intelligence", text: "AI correlates leakage reports with contamination data to pinpoint potential source locations." }
            ]
        },
        {
            id: 8,
            type: "tech",
            title: "Technical Architecture",
            subtitle: "Enterprise-grade stack built for scale and reliability",
            stack: [
                { category: "Frontend", tools: "React 18, Material UI v5, Framer Motion, Leaflet Maps" },
                { category: "Backend", tools: "Node.js, Express.js, JWT Authentication, REST APIs" },
                { category: "Database", tools: "PostgreSQL with optimized indexes, connection pooling" },
                { category: "AI Engine", tools: "Google Generative AI SDK (Gemini 1.5 Flash)" },
                { category: "Security", tools: "Bcrypt hashing, OTP verification, SHA-256 blockchain" }
            ]
        },
        {
            id: 9,
            type: "workflow",
            title: "Complete Workflow",
            subtitle: "From citizen complaint to verified resolution in 5 steps",
            steps: [
                "Citizen logs in, submits complaint with photo evidence & auto GPS location",
                "AI Engine analyzes text, assigns category (Contamination/Leakage/etc.) and urgency level",
                "Blockchain Layer generates SHA-256 hash, links to previous record in verified chain",
                "Officer Dashboard receives prioritized complaint with AI insights & source mapping",
                "Resolution logged, citizen notified, entire process permanently recorded on chain"
            ]
        },
        {
            id: 10,
            type: "conclusion",
            title: "The Vision",
            tagline: "Integrity First. Resilience Always.",
            summary: "UIIS is not just a complaint system — it's a Verified Civic Data Protocol that transforms how cities manage water infrastructure through transparency, AI intelligence, and immutable trust.",
            cta: "Experience the Future of Water Management"
        }
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(curr => curr + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(curr => curr - 1);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide]);

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#0a192f', // Deep Blue background
            color: 'white',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Background Effects */}
            <Box sx={{
                position: 'absolute',
                top: '-20%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(0, 210, 255, 0.1) 0%, rgba(157, 80, 187, 0.05) 100%)',
                filter: 'blur(80px)',
                zIndex: 0,
                borderRadius: '50%',
            }} />

            {/* Top Controls */}
            <Box sx={{
                position: 'absolute',
                top: 30,
                right: 30,
                zIndex: 10
            }}>
                <IconButton onClick={toggleFullScreen} sx={{ color: '#00D2FF', border: '1px solid rgba(0,210,255,0.3)' }}>
                    {isFullscreen ? <Minimize /> : <Maximize />}
                </IconButton>
            </Box>

            {/* Controls */}
            <Box sx={{
                position: 'absolute',
                bottom: 30,
                right: 30,
                zIndex: 10,
                display: 'flex',
                gap: 2,
                alignItems: 'center'
            }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mr: 2 }}>
                    {currentSlide + 1} / {slides.length}
                </Typography>
                <IconButton onClick={prevSlide} disabled={currentSlide === 0} sx={{ color: '#00D2FF', border: '1px solid rgba(0,210,255,0.3)' }}>
                    <ChevronLeft />
                </IconButton>
                <IconButton onClick={nextSlide} disabled={currentSlide === slides.length - 1} sx={{ color: '#00D2FF', border: '1px solid rgba(0,210,255,0.3)', bgcolor: 'rgba(0,210,255,0.1)' }}>
                    <ChevronRight />
                </IconButton>
            </Box>

            {/* Slide Content */}
            <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'relative' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.5 }}
                        style={{ width: '100%' }}
                    >
                        {slides[currentSlide].type === 'title' && (
                            <Box sx={{ textAlign: 'center' }}>
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Droplets size={80} color="#00D2FF" style={{ marginBottom: 20 }} />
                                </motion.div>
                                <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(90deg, #00D2FF 0%, #9D50BB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {slides[currentSlide].title}
                                </Typography>
                                <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.7)', mb: 6 }}>
                                    {slides[currentSlide].subtitle}
                                </Typography>
                            </Box>
                        )}

                        {slides[currentSlide].type === 'content' && (
                            <Box>
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                                    {slides[currentSlide].title}
                                </Typography>
                                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', mb: 6 }}>
                                    {slides[currentSlide].subtitle}
                                </Typography>
                                <Grid container spacing={4}>
                                    {slides[currentSlide].items.map((item, idx) => (
                                        <Grid item xs={12} md={4} key={idx}>
                                            <Paper sx={{
                                                p: 4,
                                                height: '100%',
                                                bgcolor: 'rgba(17, 34, 64, 0.6)',
                                                border: '1px solid rgba(0,210,255,0.1)',
                                                backdropFilter: 'blur(10px)',
                                                borderRadius: 4
                                            }}>
                                                <item.icon size={40} color="#00D2FF" style={{ marginBottom: 16 }} />
                                                <Typography variant="h6" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
                                                    {item.title}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                                    {item.text}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {slides[currentSlide].type === 'feature' && (
                            <Box sx={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="overline" sx={{ color: '#9D50BB', letterSpacing: 2, fontWeight: 700 }}>
                                        From the Innovation Labs
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: 'white' }}>
                                        {slides[currentSlide].title}
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4 }}>
                                        {slides[currentSlide].subtitle}
                                    </Typography>
                                    <Box>
                                        {slides[currentSlide].features.map((feat, idx) => (
                                            <Box key={idx} sx={{ mb: 3, display: 'flex', gap: 2 }}>
                                                <CheckCircle size={24} color="#00D2FF" />
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>{feat.label}</Typography>
                                                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{feat.desc}</Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                                <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                                    <motion.div
                                        animate={{ y: [0, -20, 0] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    >
                                        <Paper sx={{
                                            width: 300,
                                            height: 300,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            borderRadius: '50%',
                                            border: '2px solid #00D2FF',
                                            boxShadow: '0 0 50px rgba(0,210,255,0.2)'
                                        }}>
                                            {React.createElement(slides[currentSlide].icon, { size: 100, color: "#00D2FF" })}
                                        </Paper>
                                    </motion.div>
                                </Box>
                            </Box>
                        )}

                        {slides[currentSlide].type === 'tech' && (
                            <Box>
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 6, textAlign: 'center' }}>
                                    {slides[currentSlide].title}
                                </Typography>
                                <Grid container spacing={3}>
                                    {slides[currentSlide].stack.map((stack, idx) => (
                                        <Grid item xs={12} md={6} key={idx}>
                                            <Paper sx={{
                                                p: 3,
                                                bgcolor: 'rgba(255,255,255,0.03)',
                                                borderLeft: '4px solid #9D50BB'
                                            }}>
                                                <Typography variant="subtitle2" sx={{ color: '#9D50BB', mb: 1 }}>{stack.category}</Typography>
                                                <Typography variant="h6" sx={{ color: 'white' }}>{stack.tools}</Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {slides[currentSlide].type === 'workflow' && (
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                                    {slides[currentSlide].title}
                                </Typography>
                                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 6 }}>
                                    {slides[currentSlide].subtitle}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800, mx: 'auto' }}>
                                    {slides[currentSlide].steps.map((step, idx) => (
                                        <Paper key={idx} sx={{
                                            p: 3,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 3,
                                            bgcolor: 'rgba(10, 25, 47, 0.8)',
                                            border: '1px solid rgba(0,210,255,0.2)'
                                        }}>
                                            <Box sx={{
                                                width: 40, height: 40, borderRadius: '50%',
                                                bgcolor: '#00D2FF', color: '#0a192f',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                fontWeight: 'bold'
                                            }}>
                                                {idx + 1}
                                            </Box>
                                            <Typography variant="h6" sx={{ textAlign: 'left', color: 'white' }}>{step}</Typography>
                                        </Paper>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {slides[currentSlide].type === 'conclusion' && (
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h2" sx={{ fontWeight: 800, mb: 4, background: 'linear-gradient(90deg, #00D2FF 0%, #9D50BB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {slides[currentSlide].tagline}
                                </Typography>
                                <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.8)', mb: 6, maxWidth: 800, mx: 'auto' }}>
                                    {slides[currentSlide].summary}
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => navigate('/')}
                                    sx={{
                                        background: 'linear-gradient(90deg, #00D2FF 0%, #9D50BB 100%)',
                                        color: 'white',
                                        fontWeight: 700,
                                        px: 6, py: 2
                                    }}
                                >
                                    {slides[currentSlide].cta}
                                </Button>
                            </Box>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Container>
        </Box>
    );
};

export default PresentationPage;
