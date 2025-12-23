import React from 'react';
import { Box, Typography, Button, Container, Grid, useTheme, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
import { Shield, BarChart3, Users } from 'lucide-react';

const Hero = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Box sx={{
            minHeight: '85vh',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            pt: { xs: 8, md: 0 }
        }}>
            {/* Background Decorative Elements */}
            <Box sx={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(0, 210, 255, 0.1) 0%, rgba(157, 80, 187, 0.05) 100%)',
                filter: 'blur(100px)',
                zIndex: 0,
                borderRadius: '50%'
            }} />

            <Container maxWidth="lg" sx={{ zIndex: 1 }}>
                <Grid container spacing={4} alignItems="center">
                    <Grid size={{ xs: 12, md: 7 }}>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <Typography
                                variant="overline"
                                sx={{
                                    color: 'primary.main',
                                    fontWeight: 700,
                                    letterSpacing: 3,
                                    mb: 1,
                                    display: 'block'
                                }}
                            >
                                URBAN WATER INTELLIGENCE SYSTEM
                            </Typography>
                            <Typography
                                variant="h1"
                                sx={{
                                    fontSize: { xs: '2.5rem', md: '4.5rem' },
                                    mb: 3,
                                    background: `linear-gradient(${theme.palette.text.primary}, ${theme.palette.text.secondary})`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Resilience Through Clean <br />
                                <span style={{ color: '#00D2FF' }}>Water Intelligence</span>
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    color: 'text.secondary',
                                    mb: 4,
                                    maxWidth: '600px',
                                    fontWeight: 400,
                                    fontSize: { xs: '1rem', md: '1.25rem' }
                                }}
                            >
                                UIIS tracks urban water crises through community-driven data.
                                Report shortages, contamination, and infrastructure leaks to influence digital water management.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    sx={{ px: 4, py: 1.5 }}
                                    onClick={() => document.getElementById('report-issue').scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Start Reporting
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={() => document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' })}
                                    sx={{
                                        px: 4,
                                        py: 1.5,
                                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                        color: 'text.primary',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            background: theme.palette.mode === 'dark' ? 'rgba(0, 210, 255, 0.05)' : 'rgba(0, 210, 255, 0.02)'
                                        }
                                    }}
                                >
                                    View Live Map
                                </Button>
                            </Box>
                        </motion.div>
                    </Grid>

                    <Grid size={{ xs: 12, md: 5 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.2 }}
                        >
                            <Box sx={{
                                position: 'relative',
                                p: { xs: 2, md: 4 },
                                background: theme.palette.mode === 'dark' ? 'rgba(17, 34, 64, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                                borderRadius: 4,
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${theme.palette.divider}`,
                                boxShadow: theme.palette.mode === 'dark' ? '0 20px 50px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)'
                            }}>
                                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                    <Box sx={{ p: 1, background: 'rgba(0,210,255,0.1)', borderRadius: 2 }}>
                                        <Shield color="#00D2FF" />
                                    </Box>
                                    <Typography variant="h6">Integrity First</Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Each complaint is hashed and secured via blockchain, ensuring your voice
                                    remains immutable and trust-worthy.
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mb: 2, fontStyle: 'italic', opacity: 0.7 }}>
                                    Verified Civic Data Protocol
                                </Typography>
                                <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Active Hotspots Detected</Typography>
                                        <Typography variant="caption" color="primary.main">12 New</Typography>
                                    </Box>
                                    <Box sx={{ height: 6, width: '100%', background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '75%' }}
                                            transition={{ duration: 2, delay: 1 }}
                                            style={{ height: '100%', background: 'linear-gradient(90deg, #00D2FF, #9D50BB)' }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </motion.div>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Hero;
