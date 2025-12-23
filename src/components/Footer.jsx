import React, { useState } from 'react';
import { Box, Container, Typography, Grid, Link, IconButton, Divider, Button, InputBase, useTheme } from '@mui/material';
import { Droplets, Twitter, Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [email, setEmail] = useState('');

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email) {
            alert(`Highly appreciated! ${email} has been subscribed to our intelligence grid.`);
            setEmail('');
        }
    };

    return (
        <Box sx={{
            background: isDarkMode ? '#050a14' : '#f8f9fa',
            pt: 10,
            pb: 4,
            borderTop: `1px solid ${theme.palette.divider}`
        }}>
            <Container maxWidth="lg">
                <Grid container spacing={4} sx={{ mb: 6 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Droplets size={24} color="#00D2FF" style={{ marginRight: 8 }} />
                            <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>UIIS</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                            Aggregating urban water data for a smarter, more resilient future.
                            Civic intelligence platform for sustainable management.
                        </Typography>
                        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                            {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                                <IconButton key={i} size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                    <Icon size={20} />
                                </IconButton>
                            ))}
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.primary', fontWeight: 700 }}>Platform</Typography>
                        <Link onClick={() => document.getElementById('report-issue').scrollIntoView({ behavior: 'smooth' })} component="button" underline="none" display="block" sx={{ mb: 1, color: 'text.secondary', '&:hover': { color: 'primary.main' }, textAlign: 'left' }}>
                            Report Issue
                        </Link>
                        <Link onClick={() => document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' })} component="button" underline="none" display="block" sx={{ mb: 1, color: 'text.secondary', '&:hover': { color: 'primary.main' }, textAlign: 'left' }}>
                            Live Dashboard
                        </Link>
                        <Link onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })} component="button" underline="none" display="block" sx={{ mb: 1, color: 'text.secondary', '&:hover': { color: 'primary.main' }, textAlign: 'left' }}>
                            About Platform
                        </Link>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.primary', fontWeight: 700 }}>Resources</Typography>
                        {['Documentation', 'API Access', 'Privacy Policy'].map(item => (
                            <Link key={item} href="#" underline="none" display="block" sx={{ mb: 1, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                                {item}
                            </Link>
                        ))}
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.primary', fontWeight: 700 }}>Stay Updated</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Join our mailing list for monthly urban impact reports.
                        </Typography>
                        <Box component="form" onSubmit={handleSubscribe} sx={{ display: 'flex' }}>
                            <InputBase
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                sx={{
                                    flexGrow: 1,
                                    px: 2,
                                    py: 1,
                                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: '10px 0 0 10px',
                                    color: 'text.primary',
                                    fontSize: '0.875rem'
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{
                                    borderRadius: '0 10px 10px 0',
                                    background: 'linear-gradient(45deg, #00D2FF, #3A7BD5)',
                                    fontWeight: 700,
                                    px: 3
                                }}
                            >
                                Join
                            </Button>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ borderColor: theme.palette.divider, mb: 4 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                        © 2025 UIIS | Urban Water Intelligence System.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Action-Oriented Intelligence for Water Resilience
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
