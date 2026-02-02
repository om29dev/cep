import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Container,
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
    Skeleton
} from '@mui/material';
import { DataGrid, GridToolbar, GridActionsCellItem } from '@mui/x-data-grid';
import {
    CheckCircle2,
    Clock,
    AlertTriangle,
    Eye,
    Search,
    MapPin,
    Filter,
    Download // Import Download icon
} from 'lucide-react';

// ... (LocationResolver component remains unchanged)
// Internal component to handle reverse geocoding
// LocationResolver component removed as we now use explicit Area/Ward fields

const OfficerComplaints = () => {
    const theme = useTheme();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [searchText, setSearchText] = useState('');

    // Resolution Form State
    const [resolutionRemarks, setResolutionRemarks] = useState('');
    const [resolutionFiles, setResolutionFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchComplaints();
    }, []);

    // Reset resolution form when opening a new complaint
    useEffect(() => {
        if (selectedComplaint) {
            setResolutionRemarks('');
            setResolutionFiles([]);
        }
    }, [selectedComplaint]);

    const fetchComplaints = async () => {
        try {
            const response = await axios.get('/api/complaints');
            setComplaints(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch complaints:", err);
            setLoading(false);
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
                formData.append('evidence', file); // Field name must match backend 'evidence'
            });

            const response = await axios.post(`/api/complaints/${selectedComplaint.id}/resolve`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Update local state
            const updatedComplaint = response.data;
            setComplaints(prev => prev.map(c => c.id === updatedComplaint.id ? updatedComplaint : c));
            setSelectedComplaint(updatedComplaint); // Update dialog view to show resolved status

        } catch (err) {
            console.error("Error submitting resolution:", err);
            alert("Failed to submit resolution.");
        } finally {
            setSubmitting(false);
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

    const handleExport = () => {
        if (!filteredComplaints.length) {
            alert("No data to export");
            return;
        }

        const headers = ["ID", "Category", "Description", "Location", "Area", "Ward", "Status", "Reported At"];
        const rows = filteredComplaints.map(c => [
            c.id,
            `"${c.category}"`, // Quote strings to handle commas
            `"${c.description.replace(/"/g, '""')}"`, // Escape quotes
            `"${c.location}"`,
            `"${c.area || 'Unknown'}"`,
            `"${c.ward || 'General'}"`,
            c.status,
            new Date(c.created_at).toLocaleString()
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `complaints_registry_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 50 },
        {
            field: 'category',
            headerName: 'Category',
            width: 140,
            renderCell: (params) => (
                <Chip
                    label={params.value.toUpperCase()}
                    size="small"
                    color={params.value.includes('Contaminated') ? 'error' : 'primary'}
                    sx={{ fontWeight: 700, borderRadius: 1 }}
                />
            )
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 1,
            minWidth: 200,
        },
        {
            field: 'area',
            headerName: 'Area',
            width: 120,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
                    <Typography variant="body2" fontWeight={600} noWrap>{params.value || 'Unknown'}</Typography>
                </Box>
            )
        },
        {
            field: 'ward',
            headerName: 'Ward',
            width: 80,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
                    <Typography variant="body2" color="text.secondary" noWrap>{params.value || '-'}</Typography>
                </Box>
            )
        },

        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => (
                <Chip
                    label={params.value.toUpperCase()}
                    size="small"
                    icon={params.value === 'resolved' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    sx={{
                        bgcolor: params.value === 'resolved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                        color: params.value === 'resolved' ? '#22c55e' : '#eab308',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: params.value === 'resolved' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)'
                    }}
                />
            )
        },
        {
            field: 'created_at',
            headerName: 'Reported At',
            width: 160,
            valueFormatter: (value) => new Date(value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
        },

    ];

    const filteredComplaints = complaints.filter((c) =>
        c.description.toLowerCase().includes(searchText.toLowerCase()) ||
        c.category.toLowerCase().includes(searchText.toLowerCase()) ||
        c.id.toString().includes(searchText)
    );

    return (
        <Box sx={{
            py: 4,
            minHeight: '100vh',
            bgcolor: theme.palette.mode === 'dark' ? '#0b1120' : '#f0f2f5'
        }}>
            <Container maxWidth="xl">
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={1.5}>
                            OFFICER PORTAL
                        </Typography>
                        <Typography variant="h3" fontWeight={800} sx={{
                            background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: theme.palette.mode === 'dark' ? 'transparent' : 'inherit'
                        }}>
                            Issue Registry
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <TextField
                            placeholder="Search complaints..."
                            variant="outlined"
                            size="small"
                            onChange={(e) => setSearchText(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={20} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 3, bgcolor: theme.palette.background.paper }
                            }}
                        />
                        <Button
                            variant="outlined"
                            startIcon={<Download size={18} />}
                            onClick={handleExport}
                            sx={{
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                bgcolor: theme.palette.background.paper
                            }}
                        >
                            Export CSV
                        </Button>
                    </Stack>
                </Box>

                <Paper sx={{
                    height: 700,
                    width: '100%',
                    borderRadius: 0,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                }}>
                    <DataGrid
                        rows={filteredComplaints}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10, 20, 50]}
                        checkboxSelection
                        disableSelectionOnClick
                        loading={loading}
                        onRowClick={(params) => setSelectedComplaint(params.row)}
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-cell': {
                                borderBottom: `1px solid ${theme.palette.divider}`
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: theme.palette.action.hover,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                fontSize: '0.75rem'
                            }
                        }}
                    />
                </Paper>

                {/* DETAIL DIALOG */}
                <Dialog
                    open={!!selectedComplaint}
                    onClose={() => setSelectedComplaint(null)}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 4, bgcolor: theme.palette.background.paper } }}
                >
                    {selectedComplaint && (
                        <>
                            <DialogTitle sx={{ pb: 1, pt: 3, px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box display="flex" gap={2} alignItems="center">
                                        <Typography variant="h5" fontWeight={800}>#{selectedComplaint.id}</Typography>
                                        <Chip
                                            label={selectedComplaint.category.toUpperCase()}
                                            color="primary"
                                            size="small"
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </Box>
                                    <Chip
                                        icon={selectedComplaint.status === 'resolved' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                        label={selectedComplaint.status.toUpperCase()}
                                        color={selectedComplaint.status === 'resolved' ? "success" : "warning"}
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
                                                {selectedComplaint.description}
                                            </Typography>
                                        </Paper>

                                        {parseImages(selectedComplaint.images).length > 0 && (
                                            <Box sx={{ mb: 4 }}>
                                                <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
                                                    EVIDENCE LOG
                                                </Typography>
                                                <ImageList cols={3} gap={16} rowHeight={160}>
                                                    {parseImages(selectedComplaint.images).map((img, index) => {
                                                        const filename = img.split(/[/\\]/).pop();
                                                        const imageUrl = `http://localhost:5000/uploads/${filename}`;
                                                        return (
                                                            <ImageListItem key={index} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                                                <img
                                                                    src={imageUrl}
                                                                    srcSet={imageUrl}
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

                                        {/* RESOLUTION SECTION */}
                                        <Divider sx={{ mb: 3 }} />
                                        <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
                                            OFFICIAL RESOLUTION
                                        </Typography>

                                        {selectedComplaint.status === 'resolved' ? (
                                            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                                <Box display="flex" gap={2} mb={2}>
                                                    <CheckCircle2 color={theme.palette.success.main} />
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight={700} color="success.main">
                                                            Issue Resolved
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            on {new Date(selectedComplaint.resolved_at).toLocaleString()}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                                                    "{selectedComplaint.resolution_remarks || "No remarks provided."}"
                                                </Typography>

                                                {/* Resolution Evidence */}
                                                {parseImages(selectedComplaint.resolution_images).length > 0 && (
                                                    <Box>
                                                        <Typography variant="caption" fontWeight={700} color="text.secondary" gutterBottom>
                                                            RESOLUTION EVIDENCE
                                                        </Typography>
                                                        <ImageList cols={4} gap={8} rowHeight={100} sx={{ mt: 1 }}>
                                                            {parseImages(selectedComplaint.resolution_images).map((img, index) => {
                                                                const filename = img.split(/[/\\]/).pop();
                                                                const imageUrl = `http://localhost:5000/uploads/${filename}`;
                                                                return (
                                                                    <ImageListItem key={index} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                                                        <img
                                                                            src={imageUrl}
                                                                            srcSet={imageUrl}
                                                                            alt={`Res Evidence ${index + 1}`}
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
                                            </Paper>
                                        ) : (
                                            <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.default }}>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    Please provide details about the resolution action taken.
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={4}
                                                    placeholder="Enter official resolution remarks..."
                                                    variant="outlined"
                                                    value={resolutionRemarks}
                                                    onChange={(e) => setResolutionRemarks(e.target.value)}
                                                    sx={{ mb: 2, bgcolor: theme.palette.background.paper }}
                                                />
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Button
                                                        component="label"
                                                        variant="outlined"
                                                        startIcon={<Filter size={18} />} // Using Filter as a placeholder for Paperclip/Upload if needed, or change to specific icon
                                                        sx={{ textTransform: 'none' }}
                                                    >
                                                        Attach Evidence
                                                        <input type="file" hidden multiple onChange={handleFileSelect} />
                                                    </Button>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {resolutionFiles.length} files selected
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        )}
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                                            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
                                                METADATA
                                            </Typography>
                                            <Stack spacing={2}>
                                                <Box>
                                                    <Typography variant="caption" color="text.disabled">LOCATION / ZONE</Typography>
                                                    <Box display="flex" gap={1} alignItems="center">
                                                        <MapPin size={16} color={theme.palette.primary.main} />
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={700}>
                                                                {selectedComplaint.area || 'Unknown Area'} (Ward {selectedComplaint.ward || '-'})
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Typography variant="caption" fontFamily="monospace" sx={{ ml: 3, opacity: 0.7 }}>
                                                        Coordinates: {selectedComplaint.location}
                                                    </Typography>
                                                </Box>
                                                <Divider />
                                                <Box>
                                                    <Typography variant="caption" color="text.disabled">TIMESTAMPS</Typography>
                                                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                        <Clock size={16} opacity={0.5} />
                                                        <Typography variant="body2">
                                                            Reported: {new Date(selectedComplaint.created_at).toLocaleString()}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Divider />
                                                <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(157, 80, 187, 0.05)' : 'rgba(157, 80, 187, 0.02)', p: 1.5, borderRadius: 2, border: '1px solid rgba(157, 80, 187, 0.2)' }}>
                                                    <Typography variant="caption" sx={{ color: '#9D50BB', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                                        <CheckCircle2 size={14} /> BLOCKCHAIN PROOF
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>SECURE AUDIT ID</Typography>
                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-word', display: 'block', mb: 1, letterSpacing: 1, fontWeight: 700 }}>
                                                        {selectedComplaint.hash ? `0x${selectedComplaint.hash.substring(0, 8)}...` : 'PENDING'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>NONCE (PROOF OF WORK)</Typography>
                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mb: 1, color: 'primary.main', fontWeight: 700 }}>
                                                        {selectedComplaint.nonce || 0}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                                <Button onClick={() => setSelectedComplaint(null)} color="inherit" size="large" sx={{ borderRadius: 2 }}>
                                    Close
                                </Button>
                                {selectedComplaint.status !== 'resolved' && (
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
                        </>
                    )}
                </Dialog>
            </Container>
        </Box>
    );
};

export default OfficerComplaints;
