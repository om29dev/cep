import React from 'react';
import { Box, Typography, Container, Grid, Paper, useTheme } from '@mui/material';
import { AlertCircle, FileText, Map, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const ProblemSection = () => {
    const theme = useTheme();
    const points = [
        {
            icon: <AlertCircle color="#ff4d4d" />,
            title: "Chronic Scarcity",
            desc: "Prolonged periods without water force residents to depend on expensive, unverified private tankers."
        },
        {
            icon: <FileText color="#00D2FF" />,
            title: "Contaminated Supply",
            desc: "Visible dirt, sewage seepage, and chemical odors posing severe health hazards to urban clusters."
        },
        {
            icon: <Map color="#9D50BB" />,
            title: "Leaky Infrastructure",
            desc: "Broken pipelines and faulty meters lead to massive water waste and incorrect consumer billing."
        },
        {
            icon: <Activity color="#00D2FF" />,
            title: "Inefficient Drainage",
            desc: "Blocked sewerage and waterlogging create unhygienic conditions and disrupt urban mobility."
        }
    ];

    return (
        <Box sx={{ py: 12, background: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
            <Container maxWidth="lg">
                <Typography
                    variant="h2"
                    align="center"
                    gutterBottom
                    sx={{
                        fontWeight: 800,
                        mb: 2,
                        fontSize: { xs: '2rem', md: '3.75rem' }
                    }}
                >
                    The Challenges We Face
                </Typography>
                <Typography
                    variant="h6"
                    align="center"
                    sx={{ color: 'text.secondary', mb: 8, maxWidth: '800px', mx: 'auto' }}
                >
                    Existing systems fail to represent the collective urgency of community issues.
                    UIIS bridges this gap with structured, evidence-based data.
                </Typography>

                <Grid container spacing={4}>
                    {points.map((point, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                            <motion.div
                                whileHover={{ y: -10 }}
                                transition={{ duration: 0.3 }}
                                style={{ height: '100%' }}
                            >
                                <Paper
                                    sx={{
                                        p: 4,
                                        height: '100%',
                                        background: theme.palette.mode === 'dark' ? 'rgba(17, 34, 64, 0.4)' : 'rgba(255, 255, 255, 0.9)',
                                        border: `1px solid ${theme.palette.divider}`,
                                        backdropFilter: 'blur(10px)',
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        borderRadius: 4
                                    }}
                                >
                                    <Box sx={{
                                        mb: 2, p: 2,
                                        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                        borderRadius: '50%'
                                    }}>
                                        {point.icon}
                                    </Box>
                                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: 'text.primary' }}>
                                        {point.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {point.desc}
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

export default ProblemSection;
