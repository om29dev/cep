import React from 'react';
import { Box, Typography, Container, Button, Grid, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { ArrowRight, Droplets, Shield, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    return (
        <Box sx={{
            py: 12,
            position: 'relative',
            overflow: 'hidden',
            background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(0,210,255,0.1) 0%, rgba(157,80,187,0.15) 50%, rgba(0,210,255,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(0,210,255,0.15) 0%, rgba(157,80,187,0.1) 50%, rgba(0,210,255,0.15) 100%)'
        }}>
            {/* Animated background elements */}
            <Box sx={{
                position: 'absolute',
                top: '-20%',
                left: '-10%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(0,210,255,0.2) 0%, transparent 70%)',
                filter: 'blur(60px)',
                animation: 'float 8s ease-in-out infinite'
            }} />
            <Box sx={{
                position: 'absolute',
                bottom: '-20%',
                right: '-10%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(157,80,187,0.2) 0%, transparent 70%)',
                filter: 'blur(60px)',
                animation: 'float 8s ease-in-out infinite reverse'
            }} />

            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{
                            display: 'inline-flex',
                            p: 2,
                            background: 'rgba(0,210,255,0.15)',
                            borderRadius: '50%',
                            mb: 4
                        }}>
                            <Droplets size={48} color="#00D2FF" />
                        </Box>

                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 800,
                                mb: 3,
                                fontSize: { xs: '2rem', md: '3.5rem' },
                                background: `linear-gradient(90deg, ${theme.palette.text.primary} 0%, #00D2FF 50%, #9D50BB 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            Ready to Join the Network?
                        </Typography>

                        <Typography
                            variant="h5"
                            sx={{
                                color: 'text.secondary',
                                mb: 5,
                                maxWidth: '700px',
                                mx: 'auto',
                                fontWeight: 400,
                                lineHeight: 1.6
                            }}
                        >
                            Join thousands of citizens who are transforming urban water management.
                            Your voice matters. Report an issue today and be part of the solution.
                        </Typography>

                        {/* Feature highlights */}
                        <Grid container spacing={4} sx={{ mb: 5 }} justifyContent="center">
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <Zap size={24} color="#00D2FF" />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        Quick & Easy
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Report in under 30 seconds
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <Shield size={24} color="#9D50BB" />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        Blockchain Secured
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Your data is protected
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <Droplets size={24} color="#4CAF50" />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        Real Impact
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Complaints lead to action
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* CTA Buttons */}
                        <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => navigate('/register')}
                                    endIcon={<ArrowRight />}
                                    sx={{
                                        px: 5,
                                        py: 2,
                                        fontSize: '1.1rem',
                                        background: 'linear-gradient(90deg, #00D2FF 0%, #3A7BD5 100%)',
                                        boxShadow: '0 10px 30px rgba(0,210,255,0.3)',
                                        '&:hover': {
                                            boxShadow: '0 15px 40px rgba(0,210,255,0.4)'
                                        }
                                    }}
                                >
                                    Get Started Free
                                </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={() => navigate('/login')}
                                    sx={{
                                        px: 5,
                                        py: 2,
                                        fontSize: '1.1rem',
                                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                                        color: 'text.primary',
                                        '&:hover': {
                                            borderColor: '#00D2FF',
                                            background: 'rgba(0,210,255,0.05)'
                                        }
                                    }}
                                >
                                    Sign In
                                </Button>
                            </motion.div>
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
                            No credit card required • Free for citizens • Secure & Private
                        </Typography>
                    </Box>
                </motion.div>
            </Container>

            {/* CSS Animation */}
            <style>
                {`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-30px); }
                    }
                `}
            </style>
        </Box>
    );
};

export default CTASection;
