import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import {
    Box,
    Typography,
    Paper,
    useTheme,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Stack,
    Divider,
    ImageList,
    ImageListItem,
    IconButton,
    InputAdornment,
    TextField,
    Grid,
    CircularProgress
} from '@mui/material';
import {
    CheckCircle2,
    Clock,
    MapPin,
    Filter,
    Sparkles,
    Bot,
    Send,
    X,
    Map as MapIcon
} from 'lucide-react';

const IssueDetailDialog = ({ open, complaint, onClose, onUpdate }) => {
    const theme = useTheme();

    // Resolution Form State
    const [resolutionRemarks, setResolutionRemarks] = useState('');
    const [resolutionFiles, setResolutionFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // AI Assistant State
    const [aiQuery, setAiQuery] = useState('');
    const [aiChat, setAiChat] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiOpen, setAiOpen] = useState(false);

    useEffect(() => {
        if (complaint) {
            setResolutionRemarks('');
            setResolutionFiles([]);
            setAiChat([]);
            setAiQuery('');
            setAiOpen(false);
        }
    }, [complaint]);

    const handleOpenAI = () => {
        setAiOpen(true);
        if (aiChat.length === 0) {
            fetchInitialRecommendation();
        }
    };

    const fetchInitialRecommendation = async () => {
        setAiLoading(true);
        try {
            const res = await axios.post('/api/officer/ask-ai', {
                complaintId: complaint.id,
                query: 'Based on this complaint, provide a brief analysis and recommended resolution steps.'
            });
            const { answer, suggestedAction } = res.data;
            setAiChat([{ sender: 'ai', text: answer, action: suggestedAction }]);
        } catch (err) {
            console.error("AI Initial Fetch Error:", err);
            setAiChat([{ sender: 'ai', text: "Unable to fetch AI recommendation. You can ask questions below." }]);
        } finally {
            setAiLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files) {
            setResolutionFiles(Array.from(e.target.files));
        }
    };

    const submitResolution = async () => {
        if (!resolutionRemarks.trim()) {
            alert("Please enter a resolution remark.");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('remarks', resolutionRemarks);
            resolutionFiles.forEach(file => {
                formData.append('evidence', file);
            });

            const response = await axios.post(`/api/complaints/${complaint.id}/resolve`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (onUpdate) onUpdate(response.data);
            onClose(); // Close after resolution or keep open? OfficerComplaints updates selectedComplaint.
            // For now, I'll follow OfficerComplaints logic: it updates selectedComplaint which keeps it open.
            // But if I want to be safe, I'll let the parent handle the update.
        } catch (err) {
            console.error("Error submitting resolution:", err);
            alert("Failed to submit resolution.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAskAI = async () => {
        if (!aiQuery.trim()) return;

        const query = aiQuery;
        setAiQuery('');
        setAiChat(prev => [...prev, { sender: 'user', text: query }]);
        setAiLoading(true);

        try {
            const res = await axios.post('/api/officer/ask-ai', {
                complaintId: complaint.id,
                query: query
            });

            const { answer, suggestedAction } = res.data;
            setAiChat(prev => [...prev, { sender: 'ai', text: answer, action: suggestedAction }]);

        } catch (err) {
            console.error("AI Error:", err);
            setAiChat(prev => [...prev, { sender: 'ai', text: "I'm having trouble connecting to the network. Please try again." }]);
        } finally {
            setAiLoading(false);
        }
    };

    const parseImages = (images) => {
        if (!images) return [];
        try {
            if (Array.isArray(images)) return images;
            if (typeof images === 'string') {
                const parsed = JSON.parse(images);
                return Array.isArray(parsed) ? parsed : [];
            }
            return [];
        } catch (e) { return []; }
    };

    if (!complaint) return null;

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, bgcolor: theme.palette.background.paper } }}
            >
                <DialogTitle sx={{ pb: 1, pt: 3, px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" gap={2} alignItems="center">
                            <Typography variant="h5" fontWeight={800}>#{complaint.id}</Typography>
                            <Chip
                                label={complaint.category.toUpperCase()}
                                color="primary"
                                size="small"
                                sx={{ fontWeight: 700 }}
                            />
                        </Box>
                        <Chip
                            icon={complaint.status === 'resolved' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                            label={complaint.status.toUpperCase()}
                            color={complaint.status === 'resolved' ? "success" : "warning"}
                            sx={{ fontWeight: 800 }}
                        />
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 3, pt: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
                                DESCRIPTION
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: theme.palette.action.hover, border: 'none', mb: 3 }}>
                                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                    {complaint.description}
                                </Typography>
                            </Paper>

                            {parseImages(complaint.images).length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
                                        EVIDENCE LOG
                                    </Typography>
                                    <ImageList cols={3} gap={16} rowHeight={140}>
                                        {parseImages(complaint.images).map((img, index) => {
                                            const filename = img.split(/[/\\]/).pop();
                                            const imageUrl = `http://localhost:5000/uploads/${filename}`;
                                            return (
                                                <ImageListItem key={index} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                                    <img
                                                        src={imageUrl}
                                                        alt={`Evidence ${index + 1}`}
                                                        loading="lazy"
                                                        style={{ height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                                        onClick={() => window.open(imageUrl, '_blank')}
                                                    />
                                                </ImageListItem>
                                            );
                                        })}
                                    </ImageList>
                                </Box>
                            )}

                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
                                OFFICIAL RESOLUTION
                            </Typography>

                            {complaint.status === 'resolved' ? (
                                <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                    <Box display="flex" gap={2} mb={2}>
                                        <CheckCircle2 color={theme.palette.success.main} />
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={700} color="success.main">
                                                Issue Resolved
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                on {new Date(complaint.resolved_at).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                                        "{complaint.resolution_remarks || "No remarks provided."}"
                                    </Typography>
                                    {parseImages(complaint.resolution_images).length > 0 && (
                                        <Box>
                                            <Typography variant="caption" fontWeight={700} color="text.secondary">EVIDENCE</Typography>
                                            <ImageList cols={4} gap={8} rowHeight={80} sx={{ mt: 1 }}>
                                                {parseImages(complaint.resolution_images).map((img, index) => {
                                                    const filename = img.split(/[/\\]/).pop();
                                                    const imageUrl = `http://localhost:5000/uploads/${filename}`;
                                                    return (
                                                        <ImageListItem key={index} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                                            <img src={imageUrl} alt={`Res ${index + 1}`} style={{ height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(imageUrl, '_blank')} />
                                                        </ImageListItem>
                                                    );
                                                })}
                                            </ImageList>
                                        </Box>
                                    )}
                                </Paper>
                            ) : (
                                <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.default }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Provide resolution action details.
                                    </Typography>
                                    <TextField
                                        fullWidth multiline rows={3}
                                        placeholder="Enter official resolution remarks..."
                                        value={resolutionRemarks}
                                        onChange={(e) => setResolutionRemarks(e.target.value)}
                                        sx={{ mb: 2, bgcolor: theme.palette.background.paper }}
                                    />
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Button component="label" variant="outlined" startIcon={<Filter size={16} />} sx={{ textTransform: 'none' }}>
                                            Attach Evidence
                                            <input type="file" hidden multiple onChange={handleFileSelect} />
                                        </Button>
                                        <Typography variant="caption" color="text.secondary">{resolutionFiles.length} files attached</Typography>
                                    </Box>
                                </Paper>
                            )}
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={2}>METADATA</Typography>
                                <Stack spacing={1.5}>
                                    <Box>
                                        <Typography variant="caption" color="text.disabled">LOCATION</Typography>
                                        <Box display="flex" gap={1} alignItems="center">
                                            <MapPin size={14} color={theme.palette.primary.main} />
                                            <Typography variant="body2" fontWeight={600}>{complaint.area || 'Unknown'} (Ward {complaint.ward || '-'})</Typography>
                                        </Box>
                                        <Typography variant="caption" fontFamily="monospace" sx={{ opacity: 0.6 }}>{complaint.location}</Typography>
                                    </Box>
                                    <Divider />
                                    <Box>
                                        <Typography variant="caption" color="text.disabled">REPORTED</Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Clock size={14} opacity={0.5} />
                                            <Typography variant="body2">{new Date(complaint.created_at).toLocaleString()}</Typography>
                                        </Box>
                                    </Box>
                                    <Divider />
                                    <Box sx={{ bgcolor: 'rgba(157, 80, 187, 0.04)', p: 1.5, borderRadius: 2, border: '1px solid rgba(157, 80, 187, 0.15)' }}>
                                        <Typography variant="caption" sx={{ color: '#9D50BB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CheckCircle2 size={12} /> BLOCKCHAIN
                                        </Typography>
                                        <Typography variant="caption" fontFamily="monospace" sx={{ display: 'block', fontWeight: 600 }}>
                                            {complaint.hash ? `0x${complaint.hash.substring(0, 12)}...` : 'PENDING'}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled">Nonce: {complaint.nonce || 0}</Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Button onClick={onClose} color="inherit" size="large" sx={{ borderRadius: 2 }}>
                        Close
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        size="large"
                        startIcon={<Sparkles size={18} />}
                        onClick={handleOpenAI}
                        sx={{ borderRadius: 2, px: 3, fontWeight: 700, mr: 'auto', ml: 2, background: 'linear-gradient(45deg, rgba(0,210,255,0.05), rgba(157,80,187,0.05))' }}
                    >
                        Ask AI Assistant
                    </Button>
                    {complaint.status !== 'resolved' && (
                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            startIcon={submitting ? <Clock /> : <CheckCircle2 />}
                            onClick={submitResolution}
                            disabled={submitting}
                            sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
                        >
                            {submitting ? 'Submitting...' : 'Submit Resolution'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* AI ASSISTANT DIALOG */}
            <Dialog
                open={aiOpen}
                onClose={() => setAiOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        height: '600px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{
                    p: 3,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.05) 0%, rgba(157, 80, 187, 0.05) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: 'rgba(157, 80, 187, 0.1)',
                            color: '#9D50BB',
                            display: 'flex'
                        }}>
                            <Sparkles size={20} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
                                AI Assistant
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Powered by Gemini 2.5 Flash
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => setAiOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
                        <X size={20} />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flexGrow: 1, bgcolor: theme.palette.background.default }}>
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
                        {aiLoading && aiChat.length === 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.6, gap: 2 }}>
                                <CircularProgress size={40} sx={{ color: '#9D50BB' }} />
                                <Typography variant="body2" fontWeight={600} color="text.secondary">Analyzing Complaint Details...</Typography>
                            </Box>
                        ) : aiChat.length === 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5, gap: 2 }}>
                                <Bot size={48} strokeWidth={1} />
                                <Typography variant="body2" align="center">
                                    Ready to assist. I have context on Complaint #{complaint?.id}.
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={2}>
                                {aiChat.map((msg, i) => (
                                    <Box key={i} sx={{
                                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '85%'
                                    }}>
                                        <Paper elevation={0} sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            borderTopLeftRadius: msg.sender === 'user' ? 3 : 0,
                                            borderTopRightRadius: msg.sender === 'user' ? 0 : 3,
                                            bgcolor: msg.sender === 'user' ? 'primary.main' : 'background.paper',
                                            color: msg.sender === 'user' ? 'white' : 'text.primary',
                                            boxShadow: msg.sender === 'ai' ? '0 2px 8px -2px rgba(0,0,0,0.05)' : 'none',
                                            border: msg.sender === 'ai' ? `1px solid ${theme.palette.divider}` : 'none'
                                        }}>
                                            {msg.sender === 'ai' ? (
                                                <Box sx={{
                                                    '& h1, & h2, & h3': { fontSize: '1rem', fontWeight: 700, mt: 1, mb: 0.5 },
                                                    '& p': { margin: '0.5em 0', lineHeight: 1.6 },
                                                    '& ul, & ol': { pl: 2, my: 0.5 },
                                                    '& li': { mb: 0.5 },
                                                    '& strong': { fontWeight: 700 },
                                                    '& code': { bgcolor: 'action.hover', px: 0.5, borderRadius: 0.5, fontSize: '0.85em' }
                                                }}>
                                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                                    {msg.text}
                                                </Typography>
                                            )}
                                        </Paper>
                                        {msg.action && (
                                            <Chip
                                                label={`Suggestion: ${msg.action}`}
                                                size="small"
                                                icon={<Sparkles size={12} />}
                                                sx={{ mt: 1, bgcolor: 'rgba(157, 80, 187, 0.1)', color: '#9D50BB', fontWeight: 700, border: '1px solid rgba(157, 80, 187, 0.2)' }}
                                            />
                                        )}
                                    </Box>
                                ))}
                                {aiLoading && (
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'rgba(157, 80, 187, 0.1)' }}>
                                            <Sparkles size={12} color="#9D50BB" />
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>Thinking...</Typography>
                                    </Box>
                                )}
                            </Stack>
                        )}
                    </Box>

                    <Box sx={{ p: 2, bgcolor: theme.palette.background.paper, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <TextField
                            fullWidth
                            placeholder="Ask a follow-up question..."
                            variant="outlined"
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={handleAskAI}
                                            disabled={!aiQuery.trim() || aiLoading}
                                            color="primary"
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                '&:hover': { bgcolor: 'primary.dark' },
                                                '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                                                width: 36, height: 36
                                            }}
                                        >
                                            <Send size={18} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc' }
                            }}
                        />
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default IssueDetailDialog;
