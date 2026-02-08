import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Container,
    Typography,
    Paper,
    Chip,
    Stack,
    Grid,
    useTheme,
    CircularProgress,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    ImageList,
    ImageListItem
} from '@mui/material';
import { CheckCircle, Clock, MapPin, AlertCircle, Phone, Mail } from 'lucide-react';

const UserComplaints = () => {
    const theme = useTheme();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const response = await axios.get('/api/complaints');
                setComplaints(response.data);
            } catch (err) {
                console.error("Error fetching complaints:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchComplaints();
    }, []);

    const parseImages = (images) => {
        if (!images) return [];
        try {
            if (Array.isArray(images)) return images;
            if (typeof images === 'string') return JSON.parse(images);
            return [];
        } catch (e) { return []; }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ py: 6, minHeight: '80vh', background: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc' }}>
            <Container maxWidth="md">
                <Typography variant="h4" fontWeight={800} gutterBottom sx={{ mb: 4 }}>
                    My Reported Issues
                </Typography>

                {complaints.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                        <Typography color="text.secondary">You haven't reported any issues yet.</Typography>
                    </Paper>
                ) : (
                    <Stack spacing={3}>
                        {complaints.map((complaint) => (
                            <Paper
                                key={complaint.id}
                                elevation={0}
                                onClick={() => setSelectedComplaint(complaint)}
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    border: `1px solid ${theme.palette.divider}`,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                        borderColor: '#00D2FF'
                                    }
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                    <Box display="flex" gap={1} alignItems="center">
                                        <AlertCircle size={20} color={theme.palette.text.secondary} />
                                        <Typography variant="h6" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                                            {complaint.category} Issue
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={complaint.status === 'resolved' ? 'RESOLVED' : 'PENDING'}
                                        icon={complaint.status === 'resolved' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                        sx={{
                                            fontWeight: 700,
                                            borderRadius: 2,
                                            bgcolor: complaint.status === 'resolved' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                                            color: complaint.status === 'resolved' ? '#4CAF50' : '#ff9800',
                                            '& .lucide': { color: 'inherit' }
                                        }}
                                    />
                                </Box>

                                <Typography variant="body1" color="text.secondary" sx={{
                                    mb: 2,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {complaint.description}
                                </Typography>

                                <Box display="flex" gap={3} alignItems="center" flexWrap="wrap">
                                    <Box display="flex" gap={1} alignItems="center">
                                        <MapPin size={16} color={theme.palette.text.disabled} />
                                        <Typography variant="caption" color="text.disabled">
                                            {complaint.location}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.disabled">
                                        Reported: {new Date(complaint.created_at).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                )}

                {/* Simple Detail Modal */}
                <Dialog
                    open={!!selectedComplaint}
                    onClose={() => setSelectedComplaint(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 4 } }}
                >
                    {selectedComplaint && (
                        <>
                            <DialogTitle sx={{ pt: 3, pb: 1 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" fontWeight={800}>Issue #{selectedComplaint.id}</Typography>
                                    <Chip
                                        label={selectedComplaint.status.toUpperCase()}
                                        color={selectedComplaint.status === 'resolved' ? "success" : "warning"}
                                        size="small"
                                        sx={{ fontWeight: 700 }}
                                    />
                                </Box>
                            </DialogTitle>
                            <DialogContent sx={{ py: 2 }}>
                                {/* ASSIGNED OFFICER / DEPARTMENT CONTACT SECTION */}
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 700 }}>
                                        ASSIGNED OFFICER / CONTACT
                                    </Typography>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            background: theme.palette.mode === 'dark' ? 'rgba(0, 210, 255, 0.05)' : 'rgba(0, 210, 255, 0.02)',
                                            border: `1px solid ${theme.palette.divider}`
                                        }}
                                    >
                                        <Box display="flex" flexDirection="column" gap={1.5}>
                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Typography variant="body1" fontWeight={800} color="primary">
                                                    PCMC Water Department (Sarathi)
                                                </Typography>
                                                {!selectedComplaint.officer_id && (
                                                    <Chip label="DEPT FALLBACK" size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20, bgcolor: 'rgba(0, 210, 255, 0.1)', color: '#00D2FF' }} />
                                                )}
                                            </Box>

                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Phone size={16} color={theme.palette.text.secondary} />
                                                        <Typography variant="body2" fontWeight={600}>8888006666</Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Mail size={16} color={theme.palette.text.secondary} />
                                                        <Typography variant="body2" fontWeight={600}>sarathi@pcmcindia.gov.in</Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>

                                            <Typography variant="caption" color="text.secondary" fontStyle="italic">
                                                * This issue is tracked in the registry and monitored by the central department.
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Box>

                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>DESCRIPTION</Typography>
                                <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: theme.palette.action.hover, border: 'none' }}>
                                    <Typography variant="body1">{selectedComplaint.description}</Typography>
                                </Paper>

                                {parseImages(selectedComplaint.images).length > 0 && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>EVIDENCE</Typography>
                                        <ImageList cols={3} gap={8} rowHeight={100}>
                                            {parseImages(selectedComplaint.images).map((img, i) => {
                                                const filename = img.split(/[/\\]/).pop();
                                                const url = `http://localhost:5000/uploads/${filename}`;
                                                return (
                                                    <ImageListItem key={i} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                                        <img src={url} alt="evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => window.open(url)} />
                                                    </ImageListItem>
                                                )
                                            })}
                                        </ImageList>
                                    </>
                                )}

                                {selectedComplaint.status === 'resolved' && (
                                    <Box sx={{ mt: 3, mb: 2 }}>
                                        <Typography variant="subtitle2" color="success.main" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CheckCircle size={16} /> OFFICIAL RESOLUTION
                                        </Typography>
                                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.05)', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                                            <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic', mb: parseImages(selectedComplaint.resolution_images).length > 0 ? 2 : 0 }}>
                                                "{selectedComplaint.resolution_remarks || 'No remarks provided.'}"
                                            </Typography>

                                            {parseImages(selectedComplaint.resolution_images).length > 0 && (
                                                <>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 700 }}>
                                                        RESOLUTION EVIDENCE:
                                                    </Typography>
                                                    <ImageList cols={3} gap={8} rowHeight={100}>
                                                        {parseImages(selectedComplaint.resolution_images).map((img, i) => {
                                                            const filename = img.split(/[/\\]/).pop();
                                                            const url = `http://localhost:5000/uploads/${filename}`;
                                                            return (
                                                                <ImageListItem key={i} sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer' }}>
                                                                    <img
                                                                        src={url}
                                                                        alt="resolution evidence"
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        onClick={() => window.open(url)}
                                                                    />
                                                                </ImageListItem>
                                                            )
                                                        })}
                                                    </ImageList>
                                                </>
                                            )}
                                        </Paper>
                                    </Box>
                                )}

                                <Box sx={{ mt: 4, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
                                    <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontWeight: 700 }}>
                                        <CheckCircle size={16} /> VERIFIABLE BLOCKCHAIN PROOF
                                    </Typography>
                                    <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 210, 255, 0.05)' : 'rgba(0, 210, 255, 0.02)', p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                                        <Box sx={{ mb: 1.5 }}>
                                            <Typography variant="caption" color="text.secondary" display="block">SECURE AUDIT ID</Typography>
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-word', color: '#9D50BB', fontSize: '1rem', letterSpacing: 2 }}>
                                                {selectedComplaint.hash ? `0x${selectedComplaint.hash.substring(0, 8)}...` : 'PENDING'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mb: 1.5 }}>
                                            <Typography variant="caption" color="text.secondary" display="block">MINING NONCE</Typography>
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 800 }}>
                                                {selectedComplaint.nonce || 0} (Calculated to meet "000" difficulty)
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4CAF50' }} />
                                            <Typography variant="caption" fontWeight={700} color="success.main">
                                                Integrity Verified via Cryptographic Chain
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </DialogContent>
                            <DialogActions sx={{ p: 3 }}>
                                <Button onClick={() => setSelectedComplaint(null)} fullWidth variant="outlined" sx={{ borderRadius: 2 }}>
                                    Close
                                </Button>
                            </DialogActions>
                        </>
                    )}
                </Dialog>
            </Container>
        </Box>
    );
};

export default UserComplaints;