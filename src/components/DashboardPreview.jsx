import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Container,
    Typography,
    Paper,
    useTheme,
    Button,
    Card,
    CardContent,
    Stack,
    CircularProgress,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Divider
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
    Users,
    TrendingUp,
    Droplets,
    MapPin,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Initial India Center
const INDIA_CENTER = [20.5937, 78.9629];

// Component to recenter map automatically when complaints change
const AutoRecenterMap = ({ complaints, getPosition }) => {
    const map = useMap();

    useEffect(() => {
        if (complaints && complaints.length > 0) {
            // Calculate centroid or bounds
            const positions = complaints
                .map(c => getPosition(c.location))
                .filter(p => p !== null);

            if (positions.length > 0) {
                const bounds = L.latLngBounds(positions);
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        }
    }, [complaints, map]);

    return null;
};

const StatCard = ({ title, value, icon: Icon, color }) => {
    const theme = useTheme();
    return (
        <Paper
            elevation={2}
            sx={{
                p: 3,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                height: '120px',
                background: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
                transition: 'transform 0.2s',
                '&:hover': {
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <Box sx={{
                p: 1.5,
                borderRadius: '50%',
                background: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Icon size={32} color={color} />
            </Box>
            <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={600} mb={0.5}>
                    {title}
                </Typography>
                <Typography variant="h4" fontWeight={800} color="text.primary">
                    {value}
                </Typography>
            </Box>
        </Paper>
    );
};

const DashboardPreview = () => {
    const theme = useTheme();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/complaints');
            setComplaints(response.data);
        } catch (err) {
            console.error("Failed to fetch complaints:", err);
            // No fallback data - rely on empty state or real DB data
            setComplaints([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        try {
            await axios.patch(`/api/complaints/${id}/status`, { status: 'resolved' });
            // Optimistic update
            setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c));

            // Also update selected complaint if it exists
            if (selectedComplaint && selectedComplaint.id === id) {
                setSelectedComplaint(prev => ({ ...prev, status: 'resolved' }));
            }

            alert("Complaint marked as resolved.");
        } catch (err) {
            console.error("Error resolving complaint:", err);
            alert("Failed to update status. Are you likely not logged in or authorized?");
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    // Helper to parse location
    const getPosition = (locString) => {
        if (!locString) return null;
        try {
            const [lat, lng] = locString.split(',').map(s => parseFloat(s.trim()));
            if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
        } catch (e) { return null; }
        return null;
    };

    // Derived stats
    const totalReports = complaints.length;

    const activeComplaints = complaints.filter(c => c.status !== 'resolved');

    // Very basic clustering logic: just active count for now since real spatial clustering is complex without libraries
    const activeClusters = activeComplaints.length > 0 ? "Active Zone" : "No Activity";

    const activeLeaks = complaints.filter(c => c.category === 'supply' && c.status !== 'resolved').length;

    // Determine Pattern Intelligence based on real data
    const getPatternIntel = () => {
        if (activeComplaints.length === 0) return "No active anomalies detected. System operating normally.";
        if (activeLeaks > 2) return `Critical Alert: ${activeLeaks} active leaks detected in close proximity. Potential pipeline failure.`;
        return "Routine monitoring active. No major anomalies.";
    };

    const patternIntel = getPatternIntel();

    return (
        <Box sx={{
            py: 8,
            background: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'
        }}>
            <Container maxWidth="xl">
                {/* Flex Container instead of Grid for stability */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 4,
                    alignItems: 'stretch'
                }}>

                    {/* Left Section: Map (Flex 2 = 66%) */}
                    <Box sx={{ flex: { xs: '1 1 auto', md: 2 }, minWidth: 0 }}>
                        <Paper
                            elevation={3}
                            sx={{
                                height: '650px',
                                width: '100%',
                                borderRadius: 0,
                                overflow: 'hidden',
                                position: 'relative',
                                border: `4px solid ${theme.palette.background.paper}`,
                                bgcolor: '#e2e8f0'
                            }}
                        >
                            <MapContainer
                                center={INDIA_CENTER}
                                zoom={5}
                                style={{ height: '100%', width: '100%', minHeight: '650px' }}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <AutoRecenterMap complaints={activeComplaints} getPosition={getPosition} />

                                {activeComplaints.map((complaint) => {
                                    const pos = getPosition(complaint.location);
                                    if (!pos) return null;
                                    return (
                                        <React.Fragment key={complaint.id}>
                                            <Circle
                                                center={pos}
                                                radius={800}
                                                pathOptions={{
                                                    color: 'transparent',
                                                    fillColor: '#FF4D4D',
                                                    fillOpacity: 0.3
                                                }}
                                            />
                                            <Circle
                                                center={pos}
                                                radius={300}
                                                pathOptions={{
                                                    color: 'transparent',
                                                    fillColor: '#FF4D4D',
                                                    fillOpacity: 0.6
                                                }}
                                            />
                                            <Marker position={pos}>
                                                <Popup>
                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                        {complaint.category?.toUpperCase() || 'ISSUE'}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ my: 1 }}>
                                                        {complaint.description}
                                                    </Typography>
                                                    <Button
                                                        variant="contained"
                                                        size="small"
                                                        color="success"
                                                        fullWidth
                                                        onClick={() => handleResolve(complaint.id)}
                                                    >
                                                        Mark Resolved
                                                    </Button>
                                                </Popup>
                                            </Marker>
                                        </React.Fragment>
                                    );
                                })}
                            </MapContainer>

                            {/* Floating Pill - Dynamic Text */}
                            <Paper sx={{
                                position: 'absolute',
                                bottom: 30,
                                left: 30,
                                zIndex: 1000,
                                py: 1.5,
                                px: 3,
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                            }}>
                                <AlertCircle size={20} color={activeComplaints.length > 0 ? "#FF4D4D" : "#4CAF50"} />
                                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                                    Status: <span style={{ color: '#000' }}>{activeClusters}</span> | Reports: <span style={{ color: '#000' }}>{activeComplaints.length}</span>
                                </Typography>
                            </Paper>
                        </Paper>
                    </Box>

                    {/* Right Section: Stats (Flex 1 = 33%) */}
                    <Box sx={{ flex: { xs: '1 1 auto', md: 1 }, minWidth: 0 }}>
                        <Stack spacing={3} sx={{ height: '100%' }}>
                            <StatCard
                                title="Total Reports"
                                value={totalReports.toLocaleString()}
                                icon={Users}
                                color="#00D2FF"
                            />

                            <StatCard
                                title="Active Issues"
                                value={activeComplaints.length}
                                icon={TrendingUp}
                                color="#4CAF50"
                            />

                            <StatCard
                                title="Critical Leaks"
                                value={activeLeaks}
                                icon={Droplets}
                                color="#FF4D4D"
                            />

                            {/* Pattern Intelligence Card - Dynamic */}
                            <Paper sx={{
                                mt: 'auto !important',
                                p: 4,
                                borderRadius: 5,
                                background: 'linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 100%)',
                                color: '#4a148c',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <Typography variant="h6" fontWeight={800} gutterBottom sx={{ color: '#5e35b1' }}>
                                    Live Intelligence
                                </Typography>
                                <Typography variant="body2" sx={{ lineHeight: 1.6, fontWeight: 500, opacity: 0.9 }}>
                                    {patternIntel}
                                </Typography>
                            </Paper>
                        </Stack>
                    </Box>
                </Box>

                {/* Complaints Table Section */}
                <Box sx={{ mt: 6 }}>
                    <Paper
                        elevation={3}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                            background: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
                            width: '100%',
                            overflow: 'hidden'
                        }}
                    >
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                            <Typography variant="h6" fontWeight={800} color="text.primary">
                                Recent Complaints Log
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Typography variant="caption" sx={{
                                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    px: 2, py: 0.5, borderRadius: 10, fontWeight: 600
                                }}>
                                    Total: {complaints.length}
                                </Typography>
                            </Box>
                        </Stack>

                        <Box sx={{ height: 500, width: '100%' }}>
                            <DataGrid
                                rows={complaints}
                                onRowClick={(params) => setSelectedComplaint(params.row)}
                                columns={[
                                    { field: 'id', headerName: 'ID', width: 90 },
                                    {
                                        field: 'category',
                                        headerName: 'Category',
                                        width: 150,
                                        renderCell: (params) => (
                                            <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                                                {params.value}
                                            </Typography>
                                        )
                                    },
                                    { field: 'location', headerName: 'Location Coordinates', width: 200 },
                                    { field: 'description', headerName: 'Description', width: 300, flex: 1 },
                                    {
                                        field: 'status',
                                        headerName: 'Status',
                                        width: 150,
                                        renderCell: (params) => {
                                            const status = params.value;
                                            const color = status === 'resolved' ? '#4CAF50' : status === 'pending' ? '#FFC107' : '#FF4D4D';
                                            return (
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    color: color,
                                                    fontWeight: 700
                                                }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                                                    {status?.toUpperCase()}
                                                </Box>
                                            )
                                        }
                                    },
                                    {
                                        field: 'created_at',
                                        headerName: 'Date Reported',
                                        width: 200,
                                        valueGetter: (params) => new Date(params).toLocaleString()
                                    },
                                ]}
                                pageSize={10}
                                rowsPerPageOptions={[10, 25, 50]}
                                disableSelectionOnClick={false}
                                slots={{ toolbar: GridToolbar }}
                                slotProps={{
                                    toolbar: {
                                        showQuickFilter: true,
                                    },
                                }}
                                sx={{
                                    border: 'none',
                                    '& .MuiDataGrid-cell': {
                                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                                        cursor: 'pointer'
                                    },
                                    '& .MuiDataGrid-row:hover': {
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                                    },
                                    '& .MuiDataGrid-columnHeaders': {
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                        borderBottom: 'none'
                                    }
                                }}
                            />
                        </Box>
                    </Paper>
                </Box>
            </Container>

            {/* Complaint Detail Dialog */}
            <Dialog
                open={!!selectedComplaint}
                onClose={() => setSelectedComplaint(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
                    }
                }}
            >
                {selectedComplaint && (
                    <>
                        <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" fontWeight={700}>
                                    Complaint #{selectedComplaint.id}
                                </Typography>
                                <Chip
                                    label={selectedComplaint.status?.toUpperCase()}
                                    size="small"
                                    sx={{
                                        fontWeight: 700,
                                        bgcolor: selectedComplaint.status === 'resolved' ? '#4CAF50' :
                                            selectedComplaint.status === 'pending' ? '#FFC107' : '#FF4D4D',
                                        color: '#fff'
                                    }}
                                />
                            </Box>
                        </DialogTitle>
                        <Divider />
                        <DialogContent sx={{ p: 4 }}>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
                                        Category
                                    </Typography>
                                    <Box display="flex" gap={1} alignItems="center">
                                        <AlertCircle size={18} />
                                        <Typography variant="body1" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                                            {selectedComplaint.category} Issue
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
                                        Location
                                    </Typography>
                                    <Box display="flex" gap={1} alignItems="center">
                                        <MapPin size={18} />
                                        <Typography variant="body1">
                                            {selectedComplaint.location}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
                                        Description
                                    </Typography>
                                    <Paper sx={{ p: 2, bgcolor: theme.palette.action.hover, borderRadius: 2 }} elevation={0}>
                                        <Typography variant="body1">
                                            {selectedComplaint.description}
                                        </Typography>
                                    </Paper>
                                </Box>

                                {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                                    <Box>
                                        <Typography variant="overline" color="text.secondary" fontWeight={700}>
                                            Attached Evidence
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                                            {(() => {
                                                try {
                                                    // Handle both stringified JSON and direct array
                                                    const imgs = typeof selectedComplaint.images === 'string'
                                                        ? JSON.parse(selectedComplaint.images)
                                                        : selectedComplaint.images;

                                                    return Array.isArray(imgs) ? imgs.map((img, index) => {
                                                        // Extract just the filename if a full path was stored
                                                        const filename = img.split(/[/\\]/).pop();
                                                        return (
                                                            <Box
                                                                key={index}
                                                                component="img"
                                                                src={`http://localhost:5000/uploads/${filename}`}
                                                                alt={`Evidence ${index + 1}`}
                                                                sx={{
                                                                    width: 100,
                                                                    height: 100,
                                                                    objectFit: 'cover',
                                                                    borderRadius: 2,
                                                                    border: `1px solid ${theme.palette.divider}`,
                                                                    cursor: 'pointer',
                                                                    '&:hover': { transform: 'scale(1.05)' },
                                                                    transition: 'transform 0.2s'
                                                                }}
                                                                onClick={() => window.open(`http://localhost:5000/uploads/${filename}`, '_blank')}
                                                            />
                                                        )
                                                    }) : null;
                                                } catch (e) {
                                                    console.error("Error parsing images", e);
                                                    return null;
                                                }
                                            })()}
                                        </Box>
                                    </Box>
                                )}

                                <Box>
                                    <Typography variant="overline" color="text.secondary" fontWeight={700}>
                                        Date Reported
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {new Date(selectedComplaint.created_at).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Stack>
                        </DialogContent>
                        <DialogActions sx={{ p: 3, pt: 0 }}>
                            <Button
                                onClick={() => setSelectedComplaint(null)}
                                variant="outlined"
                                color="inherit"
                                sx={{ borderRadius: 2 }}
                            >
                                Close
                            </Button>
                            {selectedComplaint.status !== 'resolved' && (
                                <Button
                                    onClick={() => handleResolve(selectedComplaint.id)}
                                    variant="contained"
                                    color="success"
                                    startIcon={<CheckCircle size={18} />}
                                    sx={{ borderRadius: 2, px: 3 }}
                                >
                                    Mark Resolved
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default DashboardPreview;
