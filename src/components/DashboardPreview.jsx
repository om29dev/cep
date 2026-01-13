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
    Map as MapIcon
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

// Internal component to handle reverse geocoding (Adapted for Dashboard)
const LocationResolver = ({ locationString, district, variant = "subtitle2" }) => {
    const [address, setAddress] = useState(district || null);

    useEffect(() => {
        // If we already have a blockchain-verified district, use it.
        if (district) {
            setAddress(district);
            return;
        }

        if (!locationString) {
            setAddress("Location N/A");
            return;
        }

        const fetchAddress = async () => {
            const cleanLoc = locationString.replace(/[()]/g, '');
            const [lat, lng] = cleanLoc.split(',').map(s => s.trim());

            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                setAddress(locationString);
                return;
            }

            try {
                // Using OpenStreetMap Nominatim API
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`);
                const data = await response.json();

                const addr = data.address || {};
                // Prioritize District/Area names
                const region = addr.city_district || addr.suburb || addr.neighbourhood || addr.town || addr.city || "Unknown Region";
                setAddress(region);
            } catch (error) {
                setAddress(locationString);
            }
        };

        // Small delay to prevent rate limiting if many markers load
        const timer = setTimeout(fetchAddress, Math.random() * 1000 + 500);
        return () => clearTimeout(timer);
    }, [locationString, district]);

    return (
        <Typography variant={variant} fontWeight={800} sx={{ textTransform: 'capitalize' }}>
            {address || "Loading..."}
        </Typography>
    );
};

const StatCard = ({ title, value, icon: Icon, color, trend, compact }) => {
    const theme = useTheme();
    return (
        <Paper
            elevation={0}
            sx={{
                p: compact ? 2 : 3,
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                gap: compact ? 2 : 3,
                minHeight: compact ? '80px' : '160px',
                height: '100%',
                background: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }
            }}
        >
            <Box sx={{
                p: compact ? 1.5 : 2,
                borderRadius: 0,
                bgcolor: `${color}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${color}30`,
                minWidth: compact ? '48px' : '64px',
                height: compact ? '48px' : '64px'
            }}>
                <Icon size={compact ? 24 : 32} color={color} />
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={600} sx={{ letterSpacing: '0.1em', fontSize: compact ? '0.65rem' : 'inherit' }}>
                    {title}
                </Typography>
                <Typography variant={compact ? "h5" : "h4"} fontWeight={700} color="text.primary" sx={{ my: 0.5, letterSpacing: '-0.02em' }}>
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



    const refreshData = async () => {
        setLoading(true);
        await Promise.all([fetchComplaints()]);
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
    const activeComplaints = complaints.filter(c => c.status !== 'resolved');
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
    const criticalIssues = complaints.filter(c => c.status !== 'resolved' && (c.category === 'No Water Supply' || c.category === 'Contaminated Water' || c.category === 'Water Leakage')).length;

    const clusterData = useMemo(() => {
        const clusters = [];
        const processedIds = new Set();
        const RADIUS_KM = 1.0;
        const validComplaints = activeComplaints.filter(c => getPosition(c.location));

        validComplaints.forEach((current) => {
            if (processedIds.has(current.id)) return;
            const currentPos = getPosition(current.location);
            const newCluster = {
                id: `zone-${clusters.length + 1}`,
                name: `Issue ${clusters.length + 1}`,
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
    }, [activeComplaints]);

    // Data for Pie Chart
    const categoryData = useMemo(() => {
        const counts = {};
        activeComplaints.forEach(c => {
            counts[c.category] = (counts[c.category] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }, [activeComplaints]);

    // Data for Zone/District Chart
    const districtData = useMemo(() => {
        const counts = {};
        activeComplaints.forEach(c => {
            const d = c.district || 'Unmapped Zone';
            counts[d] = (counts[d] || 0) + 1;
        });
        return Object.keys(counts)
            .map(key => ({ name: key, count: counts[key] }))
            .sort((a, b) => b.count - a.count);
    }, [activeComplaints]);

    // Data for Time Analysis (Complaints per Hour)
    const timeData = useMemo(() => {
        const counts = {};
        activeComplaints.forEach(c => {
            if (!c.created_at) return;
            const hour = new Date(c.created_at).getHours();
            // Format hour as "10 AM", "2 PM"
            const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
            counts[label] = (counts[label] || 0) + 1;
        });

        // Ensure chronological order if possible, or just by key existence for now
        // For simplicity, let's just map existing data. 
        // Ideally we fill 0 for missing hours, but let's just show active hours.
        return Object.keys(counts).map(key => ({ name: key, count: counts[key] }));
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
                            sx={{ borderRadius: 0, border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            Refresh Live Data

                        </Button>
                    </Stack>
                </Box>



                {/* MAIN CONTENT SPLIT */}
                <Grid container spacing={3}>
                    {/* LEFT COLUMN - MAP & VISUALS */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Paper sx={{
                            height: '650px',
                            borderRadius: 0,
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
                                    borderRadius: 0,
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
                                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                            <Chip
                                                                label={complaint.category.toUpperCase()}
                                                                size="small"
                                                                color={complaint.ai_urgency === 'Emergency' ? 'error' : 'primary'}
                                                                sx={{ fontSize: '10px', height: 20 }}
                                                            />
                                                            {complaint.ai_urgency && (
                                                                <Typography variant="caption" sx={{ color: complaint.ai_urgency === 'Emergency' ? '#ef4444' : 'text.secondary', fontWeight: 700 }}>
                                                                    {complaint.ai_urgency}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <LocationResolver
                                                            locationString={complaint.location}
                                                            district={complaint.district}
                                                        />
                                                        <Typography variant="body2" sx={{ mt: 1, mb: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
                                                            {complaint.description.substring(0, 80)}...
                                                        </Typography>
                                                        <Typography variant="caption" display="block" sx={{ mb: 1, opacity: 0.8 }}>
                                                            {new Date(complaint.created_at).toLocaleDateString()}
                                                        </Typography>
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
                        <Stack spacing={2} sx={{ width: '100%', minHeight: '650px' }}>
                            {/* SYSTEM STATUS PANEL REMOVED */}
                            {/* LIVE INCIDENT LOG */}
                            <Paper sx={{
                                borderRadius: 0,
                                height: '400px', // Fixed height to show approx 4 items
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
                                    <Badge badgeContent={activeComplaints.length} color="error" variant="dot">
                                        <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 600 }}>LIVE</Typography>
                                    </Badge>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
                                    {activeComplaints.map((complaint, index) => (
                                        <Box key={complaint.id}
                                            // Disabled Click
                                            sx={{
                                                p: 2,
                                                borderBottom: `1px solid ${theme.palette.divider}`,
                                                // Removed cursor pointer and hover effect
                                                display: 'flex',
                                                gap: 2
                                            }}
                                        >
                                            <Box sx={{ pt: 0.5 }}>
                                                <div style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    backgroundColor: complaint.ai_urgency === 'Emergency' ? '#ef4444' : (complaint.ai_urgency === 'High' ? '#f59e0b' : '#3b82f6'),
                                                    boxShadow: `0 0 8px ${complaint.ai_urgency === 'Emergency' ? '#ef4444' : (complaint.ai_urgency === 'High' ? '#f59e0b' : '#3b82f6')}`
                                                }} />
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                    <Typography variant="caption" fontWeight={700} color="text.secondary" fontFamily="monospace">
                                                        #{complaint.id} • {complaint.category?.toUpperCase() || 'GENERAL'}
                                                    </Typography>
                                                    <Box display="flex" gap={1} alignItems="center">
                                                        {complaint.ai_urgency && (
                                                            <Chip
                                                                label={complaint.ai_urgency}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{
                                                                    height: 16,
                                                                    fontSize: '8px',
                                                                    fontWeight: 800,
                                                                    borderColor: complaint.ai_urgency === 'Emergency' ? '#ef4444' : 'divider',
                                                                    color: complaint.ai_urgency === 'Emergency' ? '#ef4444' : 'text.secondary'
                                                                }}
                                                            />
                                                        )}
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(complaint.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, color: 'text.primary', fontSize: '0.85rem' }}>
                                                    {complaint.description.substring(0, 100)}...
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <MapIcon size={12} style={{ opacity: 0.5 }} />
                                                    <LocationResolver
                                                        locationString={complaint.location}
                                                        district={complaint.district}
                                                        variant="caption"
                                                    />
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>

                            <Stack spacing={2}>
                                <StatCard
                                    title="Total Active"
                                    value={activeComplaints.length}
                                    icon={Users}
                                    color="#3b82f6"
                                    compact
                                />
                                <StatCard
                                    title="Active Hotspots"
                                    value={clusterData.filter(c => c.count > 1).length}
                                    icon={MapIcon}
                                    color="#f59e0b"
                                    compact
                                />
                            </Stack>
                        </Stack>
                    </Grid>

                    {/* ROW 2: ANALYSIS CHARTS */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper sx={{
                            p: 3,
                            borderRadius: 0,
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
                            borderRadius: 0,
                            height: '400px',
                            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                            border: `1px solid ${theme.palette.divider}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                        }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1.5}>
                                <Box sx={{ width: 4, height: 20, bgcolor: 'secondary.main', borderRadius: 2 }} />
                                Major Issues
                            </Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={clusterData.slice(0, 5)} layout="vertical" margin={{ left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: theme.palette.action.hover }} />
                                    <Bar
                                        dataKey="count"
                                        fill="#8884d8"
                                        radius={[0, 0, 0, 0]}
                                        barSize={20}
                                        onClick={(data) => {
                                            if (data && data.complaints && data.complaints.length > 0) {
                                                setSelectedComplaint(data.complaints[0]);
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {clusterData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#6366f1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* ROW 3: ZONE & TIME ANALYSIS */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper sx={{
                            p: 3,
                            borderRadius: 0,
                            height: '350px',
                            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                            border: `1px solid ${theme.palette.divider}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1.5}>
                                <Box sx={{ width: 4, height: 20, bgcolor: '#10b981', borderRadius: 2 }} />
                                Regional Zone Intensity
                            </Typography>
                            <ResponsiveContainer width="100%" height="85%">
                                <BarChart data={districtData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} tick={{ fontSize: 12, fontWeight: 600 }} />
                                    <YAxis stroke={theme.palette.text.secondary} />
                                    <RechartsTooltip
                                        cursor={{ fill: theme.palette.action.hover }}
                                        contentStyle={{
                                            backgroundColor: theme.palette.mode === 'dark' ? '#0f172a' : '#fff',
                                            borderColor: theme.palette.divider,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={50}>
                                        {districtData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#10b981', '#34d399', '#6ee7b7'][index % 3]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper sx={{
                            p: 3,
                            borderRadius: 0,
                            height: '350px',
                            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                            border: `1px solid ${theme.palette.divider}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1.5}>
                                <Box sx={{ width: 4, height: 20, bgcolor: '#f43f5e', borderRadius: 2 }} />
                                Temporal Surge
                            </Typography>
                            <ResponsiveContainer width="100%" height="85%">
                                <BarChart data={timeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} tick={{ fontSize: 10, fontWeight: 600 }} />
                                    <YAxis stroke={theme.palette.text.secondary} tick={{ fontSize: 10 }} />
                                    <RechartsTooltip
                                        cursor={{ fill: theme.palette.action.hover }}
                                        contentStyle={{
                                            backgroundColor: theme.palette.mode === 'dark' ? '#0f172a' : '#fff',
                                            borderColor: theme.palette.divider,
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
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
                    PaperProps={{ sx: { borderRadius: 0 } }}
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
                                    <Paper elevation={0} sx={{ p: 2, bgcolor: theme.palette.action.hover, borderRadius: 0 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {selectedComplaint.description}
                                        </Typography>
                                    </Paper>

                                    <Box display="flex" gap={2}>
                                        <Box flex={1}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>JURISDICTION</Typography>
                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                <Chip
                                                    label={`Area: ${selectedComplaint.district || "Unknown Area"}`}
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
                                            <Typography variant="caption" color="text.secondary" fontWeight={700}>PRECISE LOCATION</Typography>
                                            <LocationResolver
                                                locationString={selectedComplaint.location}
                                                district={null} // Force resolve coordinates
                                                variant="body2"
                                            />
                                            <Button
                                                variant="text"
                                                size="small"
                                                startIcon={<MapIcon size={14} />}
                                                href={`https://www.google.com/maps?q=${selectedComplaint.location}`}
                                                target="_blank"
                                                sx={{ mt: 0.5, p: 0, minWidth: 'auto', textTransform: 'none' }}
                                            >
                                                Open in Geo-Sat
                                            </Button>
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
                            </DialogActions>
                        </>
                    )}
                </Dialog>
            </Container >
        </Box >
    );
};

export default DashboardPreview;