import React from 'react';
import { Box, Typography, Button, Container, Grid, useTheme, useMediaQuery, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { Shield, BarChart3, Users, Droplets, MapPin, TrendingUp, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();

    // Floating stat cards data
    const floatingStats = [
        { icon: MapPin, value: '50+', label: 'Active Zones', color: '#00D2FF' },
        { icon: TrendingUp, value: '2.5K+', label: 'Issues Resolved', color: '#4CAF50' },
        { icon: Users, value: '10K+', label: 'Citizens', color: '#9D50BB' }
    ];

    return (
        <Box sx={{
            minHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            pt: { xs: 10, md: 0 },
            pb: { xs: 6, md: 0 }
        }}>
            {/* Animated Background Elements */}
            <Box sx={{
                position: 'absolute',
                top: '-20%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(0, 210, 255, 0.15) 0%, rgba(157, 80, 187, 0.08) 100%)',
                filter: 'blur(80px)',
                zIndex: 0,
                borderRadius: '50%',
                animation: 'pulse 8s ease-in-out infinite'
            }} />
            <Box sx={{
                position: 'absolute',
                bottom: '-30%',
                left: '-15%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(157, 80, 187, 0.12) 0%, rgba(0, 210, 255, 0.05) 100%)',
                filter: 'blur(100px)',
                zIndex: 0,
                borderRadius: '50%',
                animation: 'pulse 10s ease-in-out infinite reverse'
            }} />

            {/* Floating Water Drops Animation */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 100 }}
                    animate={{
                        opacity: [0, 0.6, 0],
                        y: [-20, -150],
                        x: Math.sin(i) * 30
                    }}
                    transition={{
                        duration: 4 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.8,
                        ease: 'easeOut'
                    }}
                    style={{
                        position: 'absolute',
                        left: `${15 + i * 15}%`,
                        bottom: '10%',
                        zIndex: 0
                    }}
                >
                    <Droplets size={16 + i * 4} color="#00D2FF" style={{ opacity: 0.3 }} />
                </motion.div>
            ))}

            <Container maxWidth="lg" sx={{ zIndex: 1 }}>
                <Grid container spacing={6} alignItems="center">
                    <Grid size={{ xs: 12, md: 7 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                            >
                                <Chip
                                    icon={<Zap size={14} />}
                                    label="AI-Powered Water Management"
                                    size="small"
                                    sx={{
                                        mb: 3,
                                        background: 'linear-gradient(90deg, rgba(0,210,255,0.15) 0%, rgba(157,80,187,0.15) 100%)',
                                        border: '1px solid rgba(0,210,255,0.3)',
                                        color: 'primary.main',
                                        fontWeight: 600,
                                        '& .MuiChip-icon': { color: '#00D2FF' }
                                    }}
                                />
                            </motion.div>

                            {/* Main Heading */}
                            <Typography
                                variant="h1"
                                sx={{
                                    fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem', lg: '4.5rem' },
                                    fontWeight: 900,
                                    lineHeight: 1.1,
                                    mb: 2,
                                    letterSpacing: '-0.02em'
                                }}
                            >
                                <Box component="span" className="notranslate" sx={{ color: 'text.primary' }}>
                                    UIIS: Urban Issue
                                </Box>
                                <br />
                                <Box
                                    component="span"
                                    className="notranslate"
                                    sx={{
                                        background: 'linear-gradient(90deg, #00D2FF 0%, #9D50BB 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}
                                >
                                    Intelligence System
                                </Box>
                            </Typography>

                            {/* Subheading with Water Focus */}
                            <Typography
                                variant="h5"
                                sx={{
                                    color: 'text.secondary',
                                    mb: 4,
                                    maxWidth: '600px',
                                    fontWeight: 400,
                                    fontSize: { xs: '1rem', md: '1.25rem' },
                                    lineHeight: 1.6
                                }}
                            >
                                <Box component="span" sx={{ display: 'block', mb: 1, fontWeight: 700, color: 'primary.main' }}>
                                    Current Focus: Water Management Solutions
                                </Box>
                                Empowering citizens to report water issues — shortages, contamination,
                                leaks — while giving officers AI-driven insights to resolve them faster using AMTG.
                            </Typography>

                            {/* CTA Buttons */}
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        sx={{
                                            px: 4,
                                            py: 1.5,
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            background: 'linear-gradient(90deg, #00D2FF 0%, #3A7BD5 100%)',
                                            boxShadow: '0 8px 25px rgba(0,210,255,0.3)',
                                            '&:hover': {
                                                boxShadow: '0 12px 35px rgba(0,210,255,0.4)'
                                            }
                                        }}
                                        onClick={() => navigate('/register')}
                                    >
                                        Start Reporting
                                    </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        onClick={() => navigate('/login')}
                                        sx={{
                                            px: 4,
                                            py: 1.5,
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                                            color: 'text.primary',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                background: theme.palette.mode === 'dark' ? 'rgba(0, 210, 255, 0.08)' : 'rgba(0, 210, 255, 0.04)'
                                            }
                                        }}
                                    >
                                        View Dashboard
                                    </Button>
                                </motion.div>
                            </Box>

                            {/* Trust Indicators */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Shield size={18} color="#4CAF50" />
                                    <Typography variant="body2" color="text.secondary">
                                        Blockchain Secured
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BarChart3 size={18} color="#00D2FF" />
                                    <Typography variant="body2" color="text.secondary">
                                        AI Analytics
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Users size={18} color="#9D50BB" />
                                    <Typography variant="body2" color="text.secondary">
                                        Community Driven
                                    </Typography>
                                </Box>
                            </Box>

                        </motion.div>
                    </Grid>

                    {/* Right Side - Stats Cards */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            <Box sx={{ position: 'relative' }}>
                                {/* Main Feature Card */}
                                <Box sx={{
                                    p: { xs: 3, md: 4 },
                                    background: theme.palette.mode === 'dark'
                                        ? 'linear-gradient(135deg, rgba(17, 34, 64, 0.8) 0%, rgba(10, 25, 47, 0.9) 100%)'
                                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                                    borderRadius: 4,
                                    backdropFilter: 'blur(20px)',
                                    border: `1px solid ${theme.palette.divider}`,
                                    boxShadow: theme.palette.mode === 'dark'
                                        ? '0 25px 60px rgba(0,0,0,0.5)'
                                        : '0 20px 50px rgba(0,0,0,0.08)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Decorative gradient */}
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '4px',
                                        background: 'linear-gradient(90deg, #00D2FF, #9D50BB, #00D2FF)',
                                        backgroundSize: '200% 100%',
                                        animation: 'gradient 3s ease infinite'
                                    }} />

                                    <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                                        <Box sx={{
                                            p: 1.5,
                                            background: 'linear-gradient(135deg, rgba(0,210,255,0.15) 0%, rgba(157,80,187,0.15) 100%)',
                                            borderRadius: 2,
                                            display: 'flex'
                                        }}>
                                            <Shield color="#00D2FF" size={28} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                                Integrity First
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Blockchain-verified complaints
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
                                        Every complaint is cryptographically hashed and secured, ensuring your voice
                                        remains immutable and trustworthy in the system.
                                    </Typography>

                                    {/* Live Stats */}
                                    <Box sx={{
                                        pt: 3,
                                        borderTop: `1px solid ${theme.palette.divider}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2
                                    }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Active Hotspots Detected
                                            </Typography>
                                            <Chip
                                                label="12 New"
                                                size="small"
                                                sx={{
                                                    background: 'rgba(0,210,255,0.15)',
                                                    color: '#00D2FF',
                                                    fontWeight: 600,
                                                    fontSize: '0.7rem'
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{
                                            height: 8,
                                            width: '100%',
                                            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                            borderRadius: 4,
                                            overflow: 'hidden'
                                        }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '78%' }}
                                                transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                                                style={{
                                                    height: '100%',
                                                    background: 'linear-gradient(90deg, #00D2FF, #9D50BB)',
                                                    borderRadius: 4
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Floating Stat Cards */}
                                {!isMobile && floatingStats.map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 + index * 0.15, duration: 0.5 }}
                                        style={{
                                            position: 'absolute',
                                            ...(index === 0 && { top: -20, right: -30 }),
                                            ...(index === 1 && { bottom: 60, left: -40 }),
                                            ...(index === 2 && { bottom: -25, right: 40 })
                                        }}
                                    >
                                        <Box sx={{
                                            p: 2,
                                            background: theme.palette.mode === 'dark'
                                                ? 'rgba(17, 34, 64, 0.95)'
                                                : 'rgba(255, 255, 255, 0.98)',
                                            borderRadius: 3,
                                            boxShadow: theme.palette.mode === 'dark'
                                                ? '0 10px 30px rgba(0,0,0,0.4)'
                                                : '0 8px 25px rgba(0,0,0,0.1)',
                                            border: `1px solid ${theme.palette.divider}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            backdropFilter: 'blur(10px)'
                                        }}>
                                            <Box sx={{
                                                p: 1,
                                                borderRadius: 2,
                                                background: `${stat.color}20`,
                                                display: 'flex'
                                            }}>
                                                <stat.icon size={18} color={stat.color} />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1 }}>
                                                    {stat.value}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                    {stat.label}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </motion.div>
                                ))}
                            </Box>
                        </motion.div>
                    </Grid>
                </Grid>
            </Container>

            {/* CSS Animations */}
            <style>
                {`
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.1); opacity: 0.8; }
                    }
                    @keyframes gradient {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                `}
            </style>
        </Box>
    );
};

export default Hero;