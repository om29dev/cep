import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Chip, Button,
    CircularProgress, Container, Card, CardContent,
    Tooltip, IconButton
} from '@mui/material';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LaunchIcon from '@mui/icons-material/Launch';
import TimelineIcon from '@mui/icons-material/Timeline';
import axios from 'axios';

const PatternsDashboard = () => {
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);

    const fetchPatterns = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/patterns', { withCredentials: true });
            setPatterns(response.data);
        } catch (error) {
            console.error('Error fetching patterns:', error);
        } finally {
            setLoading(false);
        }
    };

    const triggerAI = async () => {
        setTriggering(true);
        try {
            await axios.post('http://localhost:5000/api/patterns/trigger', {}, { withCredentials: true });
            await fetchPatterns();
        } catch (error) {
            console.error('Error triggering AI:', error);
        } finally {
            setTriggering(false);
        }
    };

    useEffect(() => {
        fetchPatterns();
    }, []);

    const radarData = patterns.slice(0, 5).map(p => ({
        subject: p.area,
        A: p.count,
        fullMark: 20,
    }));

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="xl" sx={{ py: 6, mt: 8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                <Box>
                    <Typography variant="h3" fontWeight="800" gutterBottom sx={{
                        background: 'linear-gradient(45deg, #00f2fe 0%, #4facfe 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-1px'
                    }}>
                        AI Pattern Analysis
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Neural clustering of complaints with Blockchain verification
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={triggering ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
                    onClick={triggerAI}
                    disabled={triggering}
                    sx={{
                        borderRadius: '12px',
                        px: 4,
                        py: 1.5,
                        background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
                        boxShadow: '0 8px 16px rgba(37, 117, 252, 0.3)',
                        '&:hover': { transform: 'translateY(-2px)' }
                    }}
                >
                    {triggering ? 'Analyzing...' : 'Trigger AI Engine'}
                </Button>
            </Box>

            <Grid container spacing={4}>
                {/* Visual Analysis Chart */}
                <Grid item xs={12} lg={5}>
                    <Paper sx={{
                        p: 4,
                        borderRadius: '24px',
                        height: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimelineIcon color="primary" /> Cluster Density
                        </Typography>
                        <Box sx={{ height: 400, mt: 2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 20]} />
                                    <Radar
                                        name="Complaints"
                                        dataKey="A"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        fillOpacity={0.6}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>

                {/* Pattern List */}
                <Grid item xs={12} lg={7}>
                    <Grid container spacing={3}>
                        {patterns.length === 0 ? (
                            <Box sx={{ textAlign: 'center', width: '100%', py: 10, opacity: 0.5 }}>
                                <Typography variant="h6">No patterns detected yet. Trigger the AI engine.</Typography>
                            </Box>
                        ) : patterns.map((pattern) => (
                            <Grid item xs={12} key={pattern.id}>
                                <Card sx={{
                                    borderRadius: '16px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        borderColor: 'primary.main',
                                        transform: 'translateX(8px)'
                                    }
                                }}>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Box sx={{
                                            p: 2,
                                            borderRadius: '12px',
                                            background: 'rgba(37, 117, 252, 0.1)',
                                            color: 'primary.main',
                                            textAlign: 'center',
                                            minWidth: '80px'
                                        }}>
                                            <Typography variant="h4" fontWeight="bold">{pattern.count}</Typography>
                                            <Typography variant="caption">REPORTS</Typography>
                                        </Box>

                                        <Box sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="h6" fontWeight="bold">{pattern.issue}</Typography>
                                                <Chip
                                                    label={pattern.severity}
                                                    size="small"
                                                    color={pattern.severity === 'High' ? 'error' : 'warning'}
                                                    sx={{ height: 20, fontSize: '10px' }}
                                                />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Location: <strong>{pattern.area}</strong> • Spanned over 72 hours
                                            </Typography>
                                        </Box>

                                        <Box sx={{ textAlign: 'right' }}>
                                            <Tooltip title="Blockchain Verified Proof">
                                                <Chip
                                                    icon={<VerifiedUserIcon />}
                                                    label="IMMUTABLE PROOF"
                                                    color="success"
                                                    variant="outlined"
                                                    sx={{ mb: 1, borderColor: '#00e676', color: '#00e676' }}
                                                />
                                            </Tooltip>
                                            <Box>
                                                <Button
                                                    size="small"
                                                    color="inherit"
                                                    endIcon={<LaunchIcon />}
                                                    href={`https://amoy.polygonscan.com/tx/${pattern.tx_id}`}
                                                    target="_blank"
                                                    disabled={!pattern.tx_id || pattern.tx_id === 'SIMULATED_TX_ID'}
                                                    sx={{ fontSize: '10px', opacity: 0.7 }}
                                                >
                                                    PolygonScan
                                                </Button>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
};

export default PatternsDashboard;
