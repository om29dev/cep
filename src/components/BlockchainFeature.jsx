import { Box, Typography, Container, Grid, Paper, useTheme, useMediaQuery } from '@mui/material';
import { Lock, Cpu, Database, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const BlockchainFeature = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box sx={{
            py: 12,
            background: isDarkMode
                ? 'linear-gradient(180deg, rgba(10, 25, 47, 0) 0%, rgba(13, 71, 161, 0.1) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(0, 210, 255, 0.05) 100%)'
        }}>
            <Container maxWidth="lg">
                <Grid container spacing={8} alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 2 }}>
                            TRANSPARENCY LAYER
                        </Typography>
                        <Typography
                            variant="h2"
                            sx={{
                                fontWeight: 800,
                                mb: 3,
                                fontSize: { xs: '2rem', md: '3.75rem' }
                            }}
                        >
                            Immutable Trust via <br />
                            <span style={{ color: '#9D50BB' }}>Blockchain</span>
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem' }}>
                            Authorities often question the validity of water crisis complaints. We eliminate this friction
                            using a cryptographic proof-of-integrity layer for all water reports.
                        </Typography>

                        <Box sx={{ mt: 4 }}>
                            {[
                                { title: "Data Hashing", text: "Water complaint clusters are summarized into cryptographic hashes." },
                                { title: "Immutable Registry", text: "Hashes are stored on blockchain, proving water data existed at given time." },
                                { title: "Anti-Manipulation", text: "Prevents deleting or modifying water complaints after submission." }
                            ].map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                    <CheckCircle size={24} color="#00D2FF" />
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                            {/* Visual representation of a block */}
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <Paper sx={{
                                    p: { xs: 2, md: 4 },
                                    width: { xs: '260px', sm: '300px' },
                                    height: { xs: '260px', sm: '300px' },
                                    background: isDarkMode ? 'rgba(17, 34, 64, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'relative',
                                    zIndex: 2,
                                    border: `2px solid #9D50BB`,
                                    boxShadow: isDarkMode ? 'none' : '0 10px 40px rgba(0,0,0,0.05)'
                                }}>
                                    <Lock size={isMobile ? 48 : 64} color="#9D50BB" style={{ marginBottom: 20 }} />
                                    <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={700}>Block #4829</Typography>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                                        SHA-256: 0x72...f9a
                                    </Typography>
                                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">142 Water Issues Verified</Typography>
                                        <Typography variant="caption" display="block">Region: Navi Mumbai</Typography>
                                    </Box>
                                </Paper>
                            </motion.div>

                            {/* Decorative background nodes */}
                            <Box sx={{ position: 'absolute', top: -50, right: 0, opacity: 0.1 }}><Cpu size={100} /></Box>
                            <Box sx={{ position: 'absolute', bottom: -50, left: 0, opacity: 0.1 }}><Database size={100} /></Box>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default BlockchainFeature;
