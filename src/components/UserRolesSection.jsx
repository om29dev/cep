import React from 'react';
import { Box, Typography, Container, Grid, Paper, Button, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { User, Shield, Settings, ArrowRight, FileText, MapPin, BarChart3, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserRolesSection = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const roles = [
        {
            icon: <User size={40} />,
            title: 'Citizen',
            subtitle: 'Report & Track Issues',
            color: '#00D2FF',
            gradient: 'linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%)',
            features: [
                { icon: <FileText size={18} />, text: 'Submit water complaints with photos & location' },
                { icon: <MapPin size={18} />, text: 'Pinpoint exact location on interactive map' },
                { icon: <Bell size={18} />, text: 'Track complaint status in real-time' },
                { icon: <Shield size={18} />, text: 'Blockchain-verified complaint history' }
            ],
            action: 'Start Reporting',
            path: '/register'
        },
        {
            icon: <Shield size={40} />,
            title: 'Water Officer',
            subtitle: 'Manage & Resolve',
            color: '#9D50BB',
            gradient: 'linear-gradient(135deg, #9D50BB 0%, #6B3FA0 100%)',
            features: [
                { icon: <BarChart3 size={18} />, text: 'View priority-sorted complaint dashboard' },
                { icon: <MapPin size={18} />, text: 'Access water intelligence heatmaps' },
                { icon: <FileText size={18} />, text: 'Update complaint status & add notes' },
                { icon: <Bell size={18} />, text: 'Receive AI-powered insights & alerts' }
            ],
            action: 'Officer Login',
            path: '/login'
        },
        {
            icon: <Settings size={40} />,
            title: 'Administrator',
            subtitle: 'Oversee & Analyze',
            color: '#FF6B6B',
            gradient: 'linear-gradient(135deg, #FF6B6B 0%, #D63447 100%)',
            features: [
                { icon: <BarChart3 size={18} />, text: 'Access comprehensive analytics dashboard' },
                { icon: <User size={18} />, text: 'Manage users, officers & permissions' },
                { icon: <Shield size={18} />, text: 'Verify blockchain integrity' },
                { icon: <FileText size={18} />, text: 'Generate detailed reports' }
            ],
            action: 'Admin Portal',
            path: '/login'
        }
    ];

    return (
        <Box sx={{
            py: 12,
            background: theme.palette.mode === 'dark'
                ? 'rgba(0,0,0,0.3)'
                : 'rgba(0,0,0,0.02)'
        }}>
            <Container maxWidth="lg">
                <Typography
                    variant="overline"
                    sx={{
                        color: 'primary.main',
                        fontWeight: 700,
                        letterSpacing: 3,
                        display: 'block',
                        textAlign: 'center',
                        mb: 1
                    }}
                >
                    FOR EVERYONE
                </Typography>
                <Typography
                    variant="h2"
                    align="center"
                    sx={{
                        fontWeight: 800,
                        mb: 2,
                        fontSize: { xs: '2rem', md: '3rem' }
                    }}
                >
                    Three Roles, One Mission
                </Typography>
                <Typography
                    variant="h6"
                    align="center"
                    sx={{ color: 'text.secondary', mb: 8, maxWidth: '800px', mx: 'auto' }}
                >
                    Whether you're a citizen reporting issues, an officer resolving them, or an administrator overseeing the system — UIIS (Urban Water Intelligence System) has tailored features for you.
                </Typography>

                <Grid container spacing={4}>
                    {roles.map((role, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.15 }}
                                viewport={{ once: true }}
                                style={{ height: '100%' }}
                            >
                                <Paper sx={{
                                    height: '100%',
                                    p: 4,
                                    background: theme.palette.mode === 'dark'
                                        ? 'rgba(17, 34, 64, 0.6)'
                                        : 'rgba(255, 255, 255, 0.95)',
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 4,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.4s ease',
                                    '&:hover': {
                                        transform: 'translateY(-10px)',
                                        boxShadow: `0 30px 60px ${role.color}30`,
                                        borderColor: role.color
                                    }
                                }}>
                                    {/* Gradient accent bar */}
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '4px',
                                        background: role.gradient
                                    }} />

                                    {/* Icon */}
                                    <Box sx={{
                                        p: 2,
                                        background: `${role.color}15`,
                                        borderRadius: 3,
                                        display: 'inline-flex',
                                        alignSelf: 'flex-start',
                                        mb: 3,
                                        color: role.color
                                    }}>
                                        {role.icon}
                                    </Box>

                                    {/* Title */}
                                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                                        {role.title}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                        {role.subtitle}
                                    </Typography>

                                    {/* Features */}
                                    <Box sx={{ flex: 1, mb: 3 }}>
                                        {role.features.map((feature, i) => (
                                            <Box key={i} sx={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 1.5,
                                                mb: 2
                                            }}>
                                                <Box sx={{ color: role.color, mt: 0.3 }}>
                                                    {feature.icon}
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {feature.text}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>

                                    {/* Action Button */}
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        onClick={() => navigate(role.path)}
                                        endIcon={<ArrowRight size={18} />}
                                        sx={{
                                            background: role.gradient,
                                            py: 1.5,
                                            '&:hover': {
                                                background: role.gradient,
                                                filter: 'brightness(1.1)'
                                            }
                                        }}
                                    >
                                        {role.action}
                                    </Button>
                                </Paper>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default UserRolesSection;
