import React from 'react';
import { Box, Typography, Container, Grid, Paper, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import {
    Brain,
    Link,
    Map,
    BarChart3,
    Camera,
    Bell,
    ShieldCheck,
    Zap,
    Globe
} from 'lucide-react';

const FeaturesShowcase = () => {
    const theme = useTheme();

    const features = [
        {
            icon: <Brain size={28} />,
            title: 'AI-Powered Analysis',
            description: 'Our intelligent system analyzes complaints to detect patterns, prioritize urgent issues, and provide actionable insights to officers.',
            color: '#00D2FF',
            highlight: true
        },
        {
            icon: <Link size={28} />,
            title: 'Blockchain Verification',
            description: 'Every complaint is cryptographically hashed and stored on blockchain, ensuring data integrity and preventing tampering.',
            color: '#9D50BB',
            highlight: true
        },
        {
            icon: <Map size={28} />,
            title: 'Interactive Heatmaps',
            description: 'Visualize water crisis hotspots on live maps. Officers can see clustered issues and prioritize affected areas.',
            color: '#4CAF50',
            highlight: true
        },
        {
            icon: <Camera size={28} />,
            title: 'Photo Evidence',
            description: 'Citizens can attach photos to complaints, providing visual evidence that helps officers assess and respond faster.',
            color: '#FF9800'
        },
        {
            icon: <Bell size={28} />,
            title: 'Real-time Notifications',
            description: 'Get instant updates on complaint status changes. Stay informed as your issue progresses through resolution.',
            color: '#E91E63'
        },
        {
            icon: <BarChart3 size={28} />,
            title: 'Analytics Dashboard',
            description: 'Comprehensive analytics for administrators showing trends, resolution rates, and performance metrics.',
            color: '#3F51B5'
        },
        {
            icon: <ShieldCheck size={28} />,
            title: 'Secure & Private',
            description: 'Your data is protected with industry-standard encryption. Personal information is never shared publicly.',
            color: '#009688'
        },
        {
            icon: <Zap size={28} />,
            title: 'Instant Submission',
            description: 'Report issues in under 30 seconds. Our streamlined form captures all essential details quickly.',
            color: '#FFC107'
        },
        {
            icon: <Globe size={28} />,
            title: 'Multi-locality Support',
            description: 'UIIS (Urban Water Intelligence System) supports multiple localities and zones, making it scalable for entire municipal regions.',
            color: '#673AB7'
        }
    ];

    return (
        <Box sx={{ py: 12 }}>
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
                    POWERFUL FEATURES
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
                    Everything You Need
                </Typography>
                <Typography
                    variant="h6"
                    align="center"
                    sx={{ color: 'text.secondary', mb: 8, maxWidth: '800px', mx: 'auto' }}
                >
                    Built with cutting-edge technology to ensure transparency, efficiency, and community empowerment.
                </Typography>

                <Grid container spacing={3} justifyContent="center">
                    {features.map((feature, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                viewport={{ once: true }}
                                style={{ height: '100%' }}
                            >
                                <Paper sx={{
                                    height: '100%',
                                    p: 3,
                                    background: theme.palette.mode === 'dark'
                                        ? feature.highlight
                                            ? `linear-gradient(135deg, rgba(${feature.color === '#00D2FF' ? '0,210,255' : feature.color === '#9D50BB' ? '157,80,187' : '76,175,80'},0.15) 0%, rgba(17, 34, 64, 0.8) 100%)`
                                            : 'rgba(17, 34, 64, 0.5)'
                                        : feature.highlight
                                            ? 'rgba(255, 255, 255, 1)'
                                            : 'rgba(255, 255, 255, 0.9)',
                                    border: `1px solid ${feature.highlight ? feature.color + '40' : theme.palette.divider}`,
                                    borderRadius: 3,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        borderColor: feature.color,
                                        boxShadow: `0 15px 30px ${feature.color}25`
                                    }
                                }}>
                                    <Box sx={{
                                        p: 1.5,
                                        background: `${feature.color}20`,
                                        borderRadius: 2,
                                        display: 'inline-flex',
                                        mb: 2,
                                        color: feature.color
                                    }}>
                                        {feature.icon}
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                        {feature.description}
                                    </Typography>
                                </Paper>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default FeaturesShowcase;
