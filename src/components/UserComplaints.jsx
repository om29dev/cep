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
import { CheckCircle, Clock, MapPin, AlertCircle } from 'lucide-react';

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