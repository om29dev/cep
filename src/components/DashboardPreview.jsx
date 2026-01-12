import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Box,
    Container,
    Typography,
    Paper,
    useTheme,
    Button,
    Stack,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Divider,
    ImageList,
    ImageListItem,
    Avatar,
    IconButton,
    CircularProgress,
    Tooltip,
    Badge
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';
import {
    Users,
    TrendingUp,
    Droplets,
    BarChart3,
    Activity,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Map as MapIcon,
    BrainCircuit,
    ArrowRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

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

const INDIA_CENTER = [20.5937, 78.9629];

// --- Utility: Haversine Formula for Distance (km) ---
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// Component to recenter map automatically
const AutoRecenterMap = ({ complaints, getPosition }) => {
    const map = useMap();

    useEffect(() => {
        if (complaints && complaints.length > 0) {
            const positions = complaints
                .map(c => getPosition(c.location))
                .filter(p => p !== null);

            if (positions.length > 0) {
                const bounds = L.latLngBounds(positions);
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        }
    }, [complaints, map, getPosition]);

    return null;
};

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
    const theme = useTheme();
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 2, // Sharper corners for professional look
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                minHeight: '160px',
                height: '100%',
                background: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff', // Solid Slate-900 or White
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)', // Subtle shadow
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }
            }}
        >
            <Box sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: `${color}10`, // Subtle tint
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${color}30`,
                minWidth: '64px',
                height: '64px'
            }}>
                <Icon size={32} color={color} />
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ letterSpacing: '0.1em' }}>
                    {title}
                </Typography>
                <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ my: 0.5, letterSpacing: '-0.02em' }}>
                    {value}
                </Typography>
                {trend && (
                    <Typography variant="caption" sx={{
                        color: color,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                    }}>
                        {trend}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};


const DashboardPreview = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    const fetchComplaints = async () => {
        try {
            const response = await axios.get('/api/complaints');
            setComplaints(response.data);
        } catch (err) {
            console.error("Failed to fetch complaints:", err);
            setComplaints([]);
        }
    };

    const fetchPatterns = async () => {
        try {
            const response = await axios.get('/api/patterns');
            setPatterns(response.data);
        } catch (err) {
            console.error("Failed to fetch patterns", err);
        }
    }

    const refreshData = async () => {
        setLoading(true);
        await Promise.all([fetchComplaints(), fetchPatterns()]);
        setLoading(false);
    }

    useEffect(() => {
        refreshData();
    }, []);

    const handleResolve = async (id) => {
        try {
            await axios.patch(`/api/complaints/${id}/status`, { status: 'resolved' });
            // Optimistic update
            setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c));
            if (selectedComplaint && selectedComplaint.id === id) {
                setSelectedComplaint(prev => ({ ...prev, status: 'resolved' }));
            }
        } catch (err) {
            console.error("Error resolving complaint:", err);
            alert("Failed to update status.");
        }
    };

    const getPosition = (locString) => {
        if (!locString) return null;
        try {
            const [lat, lng] = locString.split(',').map(s => parseFloat(s.trim()));
            if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
        } catch (e) { return null; }
        return null;
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

    // --- HELPER: Resolve Ward from Coordinates (Tactical Fallback) ---
    // --- HELPER: Resolve Ward from Coordinates ---
    const resolveWard = (locString) => {
        return "Location Unidentified"; // Placeholder until actual Reverse Geocoding is implemented
    };

    // --- ANALYTICS ---
    const clusterData = useMemo(() => {
        const clusters = [];
        const processedIds = new Set();
        const RADIUS_KM = 1.0;
        const validComplaints = complaints.filter(c => c.status !== 'resolved' && getPosition(c.location));

        validComplaints.forEach((current) => {
            if (processedIds.has(current.id)) return;
            const currentPos = getPosition(current.location);
            const newCluster = {
                id: `zone-${clusters.length + 1}`,
                name: `Zone ${clusters.length + 1}`,
                center: currentPos,
                count: 1,
                complaints: [current]
            };
            processedIds.add(current.id);

            validComplaints.forEach((neighbor) => {
                if (!processedIds.has(neighbor.id)) {
                    const neighborPos = getPosition(neighbor.location);
                    const distance = getDistanceFromLatLonInKm(currentPos[0], currentPos[1], neighborPos[0], neighborPos[1]);
                    if (distance <= RADIUS_KM) {
                        newCluster.count += 1;
                        newCluster.complaints.push(neighbor);
                        processedIds.add(neighbor.id);
                    }
                }
            });
            clusters.push(newCluster);
        });
        return clusters.sort((a, b) => b.count - a.count);
    }, [complaints]);

    const activeComplaints = complaints.filter(c => c.status !== 'resolved');
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
    const criticalIssues = complaints.filter(c => c.status !== 'resolved' && (c.category === 'supply' || c.category === 'quality')).length;

    // Data for Pie Chart
    const categoryData = useMemo(() => {
        const counts = {};
        activeComplaints.forEach(c => {
            counts[c.category] = (counts[c.category] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }, [activeComplaints]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <Box sx={{
            py: 4,
            minHeight: '100vh',
            background: theme.palette.mode === 'dark' ? '#0b1120' : '#f0f2f5'
        }}>
            <Container maxWidth="xl">
                {/* HEADER */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box>
                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                            OFFICER COMMAND CONSOLE
                        </Typography>
                        <Typography variant="h3" fontWeight={800} sx={{
                            background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: theme.palette.mode === 'dark' ? 'transparent' : 'inherit'
                        }}>
                            Tactical Overview
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Activity />}
                            onClick={refreshData}
                            sx={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            Refresh Live Data
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<BrainCircuit />}
                            onClick={() => navigate('/patterns')}
                            sx={{
                                borderRadius: '12px',
                                background: 'linear-gradient(45deg, #6366f1 0%, #8b5cf6 100%)',
                                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                            }}
                        >
                            AI Intelligence
                        </Button>
                    </Stack>
                </Box>

                {/* STATS ROW */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard title="Total Complaints" value={complaints.length} icon={Users} color="#3b82f6" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard
                            title="Avg. Crisis Score"
                            value={patterns.length > 0
                                ? Math.round(patterns.reduce((acc, curr) => acc + (parseInt(curr.severity === 'CRITICAL' ? 85 : curr.severity === 'HIGH' ? 60 : 30)), 0) / patterns.length) + "/100"
                                : "N/A"
                            }
                            icon={Activity}
                            color="#ef4444"
                            trend={patterns.length > 0 ? "Live Calc" : "No Data"}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard title="Contamination Alerts" value={activeComplaints.filter(c => c.category && c.category.includes('quality')).length} icon={Droplets} color="#f59e0b" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <StatCard title="High Density Zones" value={clusterData.filter(c => c.count > 1).length} icon={MapIcon} color="#f59e0b" />
                    </Grid>
                </Grid>

                {/* MAIN CONTENT SPLIT */}
                <Grid container spacing={3}>
                    {/* LEFT COLUMN - MAP & VISUALS */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Paper sx={{
                            height: '650px',
                            borderRadius: 3,
                            overflow: 'hidden',
                            position: 'relative',
                            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                            border: `1px solid ${theme.palette.divider}`,
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}>
                            {/* Tactical Scan Overlay */}
                            <Box sx={{
                                position: 'absolute',
                                left: 0,
                                width: '100%',
                                height: '2px', // Thin laser line
                                background: '#38bdf8',
                                boxShadow: '0 0 15px #38bdf8, 0 0 30px #38bdf8',
                                animation: 'scan 4s linear infinite',
                                pointerEvents: 'none',
                                zIndex: 999,
                                opacity: 0.6
                            }} />

                            <Box sx={{ position: 'relative', height: '100%' }}>
                                {/* Map Header Overlay */}
                                <Box sx={{
                                    position: 'absolute',
                                    top: 20,
                                    left: 20,
                                    zIndex: 1000,
                                    background: 'rgba(15, 23, 42, 0.8)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '12px',
                                    p: 1.5,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                }}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Box sx={{
                                            width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444',
                                            boxShadow: '0 0 10px #ef4444'
                                        }} />
                                        <Typography variant="subtitle2" color="white" fontWeight={700} display="flex" alignItems="center" gap={1}>
                                            LIVE GEOSPATIAL FEED
                                        </Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                                    <Typography variant="caption" color="rgba(255,255,255,0.7)" sx={{ fontFamily: 'monospace' }}>
                                        Monitoring {activeComplaints.length} nodes
                                    </Typography>
                                </Box>

                                <MapContainer center={INDIA_CENTER} zoom={5} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer
                                        url={theme.palette.mode === 'dark'
                                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                        }
                                        attribution='&copy; OpenStreetMap'
                                    />
                                    <AutoRecenterMap complaints={activeComplaints} getPosition={getPosition} />

                                    {/* Render Clusters */}
                                    {clusterData.map((cluster) => (
                                        <Circle
                                            key={cluster.id}
                                            center={cluster.center}
                                            radius={800 * Math.sqrt(cluster.count)} // Scale radius by density
                                            pathOptions={{
                                                color: cluster.count > 1 ? '#ef4444' : '#3b82f6',
                                                fillColor: cluster.count > 1 ? '#ef4444' : '#3b82f6',
                                                fillOpacity: 0.2,
                                                weight: 1,
                                                dashArray: '4, 8'
                                            }}
                                        />
                                    ))}

                                    {/* Render Individual Markers */}
                                    {activeComplaints.map((complaint) => {
                                        const pos = getPosition(complaint.location);
                                        if (!pos) return null;
                                        return (
                                            <Marker key={complaint.id} position={pos}>
                                                <Popup>
                                                    <Box sx={{ p: 1 }}>
                                                        <Chip
                                                            label={complaint.category.toUpperCase()}
                                                            size="small"
                                                            color={complaint.category === 'supply' ? 'error' : 'primary'}
                                                            sx={{ mb: 1, fontSize: '10px', height: 20 }}
                                                        />
                                                        <Typography variant="subtitle2" fontWeight={800}>{complaint.ward || resolveWard(complaint.location)}</Typography>
                                                        <Typography variant="caption" display="block" sx={{ mb: 1, opacity: 0.8 }}>
                                                            {new Date(complaint.created_at).toLocaleDateString()}
                                                        </Typography>
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            color="success"
                                                            fullWidth
                                                            onClick={() => handleResolve(complaint.id)}
                                                            sx={{ fontSize: '10px' }}
                                                        >
                                                            Mark Resolved
                                                        </Button>
                                                    </Box>
                                                </Popup>
                                            </Marker>
                                        );
                                    })}
                                </MapContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* RIGHT COLUMN - COMMAND FEED */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={3} sx={{ width: '100%', height: '650px' }}> {/* MATCH MAP HEIGHT */}

                            {/* SYSTEM STATUS PANEL */}
                            <Paper sx={{
                                p: 0,
                                borderRadius: 3,
                                overflow: 'hidden',
                                bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#1e293b', // Deep Navy
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                                flexShrink: 0
                            }}>
                                <Box sx={{
                                    p: 2,
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    bgcolor: 'rgba(0,0,0,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <BrainCircuit size={18} color="#38bdf8" />
                                        <Typography variant="subtitle2" fontWeight={700} letterSpacing="0.05em">
                                            INTELLIGENCE
                                        </Typography>
                                    </Box>
                                    <Chip label="ONLINE" size="small" sx={{
                                        height: 20,
                                        bgcolor: 'rgba(34, 197, 94, 0.2)',
                                        color: '#4ade80',
                                        fontSize: '0.65rem',
                                        fontWeight: 800
                                    }}
                                    />
                                </Box>

                                <Box sx={{ p: 2.5 }}>
                                    {patterns.length > 0 ? (
                                        <>
                                            <Box display="flex" alignItems="baseline" gap={1} mb={1}>
                                                <Typography variant="h6" fontWeight={700} color="#38bdf8">
                                                    {patterns[0].issue.toUpperCase()}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ opacity: 0.8, mb: 2, lineHeight: 1.5, fontFamily: 'monospace' }}>
                                                Analysis of <strong>{patterns[0].count} reports</strong> in <strong>{patterns[0].area}</strong> indicates high severity.
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                endIcon={<ArrowRight size={16} />}
                                                onClick={() => navigate('/patterns')}
                                                sx={{
                                                    borderColor: 'rgba(56, 189, 248, 0.5)',
                                                    color: '#38bdf8',
                                                    '&:hover': { borderColor: '#38bdf8', bgcolor: 'rgba(56, 189, 248, 0.1)' }
                                                }}
                                            >
                                                View Analysis
                                            </Button>
                                        </>
                                    ) : (
                                        <Box display="flex" alignItems="center" gap={2} sx={{ opacity: 0.7 }}>
                                            <Typography variant="body2" fontFamily="monospace">NO CRITICAL ANOMALIES</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>

                            {/* LIVE INCIDENT LOG */}
                            <Paper sx={{
                                borderRadius: 3,
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor: theme.palette.background.paper,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{
                                    p: 2,
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    bgcolor: theme.palette.action.hover
                                }}>
                                    <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Incoming Feed
                                    </Typography>
                                    <Badge badgeContent={complaints.length} color="error" variant="dot">
                                        <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 600 }}>LIVE</Typography>
                                    </Badge>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
                                    {complaints.map((complaint, index) => (
                                        <Box key={complaint.id}
                                            onClick={() => setSelectedComplaint(complaint)}
                                            sx={{
                                                p: 2,
                                                borderBottom: `1px solid ${theme.palette.divider}`,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                '&:hover': { bgcolor: theme.palette.action.selected, pl: 2.5 },
                                                display: 'flex',
                                                gap: 2
                                            }}
                                        >
                                            <Box sx={{ pt: 0.5 }}>
                                                <div style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    backgroundColor: complaint.category && complaint.category.includes('quality') ? '#ef4444' : '#3b82f6',
                                                    boxShadow: `0 0 8px ${complaint.category && complaint.category.includes('quality') ? '#ef4444' : '#3b82f6'}`
                                                }} />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                    <Typography variant="caption" fontWeight={700} color="text.secondary" fontFamily="monospace">
                                                        #{complaint.id} • {complaint.category?.toUpperCase() || 'GENERAL'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(complaint.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, color: 'text.primary', fontSize: '0.85rem' }}>
                                                    {complaint.description.substring(0, 60)}{complaint.description.length > 60 ? '...' : ''}
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <MapIcon size={12} style={{ opacity: 0.5 }} />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {complaint.ward || resolveWard(complaint.location)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        </Stack>
                    </Grid>

                    {/* ROW 2: ANALYSIS CHARTS */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{
                            p: 3,
                            borderRadius: 3,
                            height: '400px',
                            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                            border: `1px solid ${theme.palette.divider}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                        }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1.5}>
                                <Box sx={{ width: 4, height: 20, bgcolor: 'primary.main', borderRadius: 2 }} />
                                Issue Distribution
                            </Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, marginTop: 10 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{
                            p: 3,
                            borderRadius: 3,
                            height: '400px',
                            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                            border: `1px solid ${theme.palette.divider}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                        }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1.5}>
                                <Box sx={{ width: 4, height: 20, bgcolor: 'secondary.main', borderRadius: 2 }} />
                                Cluster Density
                            </Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={clusterData.slice(0, 5)} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: theme.palette.action.hover }} />
                                    <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20}>
                                        {clusterData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#6366f1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>

                {/* DETAIL DIALOG */}
                <Dialog
                    open={!!selectedComplaint}
                    onClose={() => setSelectedComplaint(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 6 } }}
                >
                    {selectedComplaint && (
                        <>
                            <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">ISSUE ID: #{selectedComplaint.id}</Typography>
                                        <Typography variant="h6" fontWeight={800}>{selectedComplaint.category.toUpperCase()} ALERT</Typography>
                                    </Box>
                                    <Chip
                                        label={selectedComplaint.status.toUpperCase()}
                                        color={selectedComplaint.status === 'resolved' ? "success" : "warning"}
                                        sx={{ fontWeight: 800 }}
                                    />
                                </Box>
                            </DialogTitle>
                            <DialogContent sx={{ px: 3, pt: 2 }}>
                                <Stack spacing={3}>
                                    <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.action.hover, borderRadius: 3 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {selectedComplaint.description}
                                        </Typography>
                                    </Paper>

                                    <Box display="flex" gap={2}>
                                        <Box flex={1}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>JURISDICTION</Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                <Chip
                                                    label={`Ward: ${selectedComplaint.ward || "Unknown"}`}
                                                    variant="outlined"
                                                    sx={{
                                                        borderColor: '#a855f7',
                                                        color: '#d8b4fe',
                                                        bgcolor: 'rgba(168, 85, 247, 0.1)',
                                                        fontWeight: 600
                                                    }}
                                                />
                                                <Chip
                                                    label={`Constituency: ${selectedComplaint.constituency || selectedComplaint.district || "Pune District"}`}
                                                    variant="outlined"
                                                    sx={{
                                                        borderColor: '#3b82f6',
                                                        color: '#93c5fd',
                                                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </Stack>
                                        </Box>
                                        <Divider orientation="vertical" flexItem />
                                        <Box flex={1}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700}>COORDINATES</Typography>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selectedComplaint.location}</Typography>
                                        </Box>
                                    </Box>

                                    {parseImages(selectedComplaint.images).length > 0 && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700} gutterBottom display="block">EVIDENCE LOG</Typography>
                                            <ImageList cols={3} rowHeight={100} gap={8}>
                                                {parseImages(selectedComplaint.images).map((img, index) => {
                                                    const filename = img.split(/[/\\]/).pop();
                                                    const imageUrl = `http://localhost:5000/uploads/${filename}`;
                                                    return (
                                                        <ImageListItem key={index}>
                                                            <img
                                                                src={imageUrl}
                                                                srcSet={imageUrl}
                                                                alt={`Evidence ${index + 1}`}
                                                                loading="lazy"
                                                                style={{ borderRadius: 8, height: '100%', objectFit: 'cover' }}
                                                                onClick={() => window.open(imageUrl, '_blank')}
                                                            />
                                                        </ImageListItem>
                                                    );
                                                })}
                                            </ImageList>
                                        </Box>
                                    )}
                                </Stack>
                            </DialogContent>
                            <DialogActions sx={{ p: 3 }}>
                                <Button onClick={() => setSelectedComplaint(null)} color="inherit" sx={{ borderRadius: 2 }}>Dismiss</Button>
                                {selectedComplaint.status !== 'resolved' && (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<CheckCircle2 size={18} />}
                                        onClick={() => handleResolve(selectedComplaint.id)}
                                        sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
                                    >
                                        Mark Resolved
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

export default DashboardPreview;