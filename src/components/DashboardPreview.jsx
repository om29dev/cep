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
    ImageListItem
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
    Users,
    TrendingUp,
    Droplets,
    BarChart3
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
            setComplaints([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        try {
            await axios.patch(`/api/complaints/${id}/status`, { status: 'resolved' });
            // Optimistic update: changes status in local state, which triggers useMemo
            setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c));

            if (selectedComplaint && selectedComplaint.id === id) {
                setSelectedComplaint(prev => ({ ...prev, status: 'resolved' }));
            }
            alert("Complaint marked as resolved.");
        } catch (err) {
            console.error("Error resolving complaint:", err);
            alert("Failed to update status.");
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

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
        } catch (e) {
            console.error("Image parse error", e);
            return [];
        }
    };

    // --- CLUSTERING LOGIC ---
    const clusterData = useMemo(() => {
        const clusters = [];
        const processedIds = new Set();
        const RADIUS_KM = 1.0;

        // UPDATED: Filter to only include NON-RESOLVED complaints with valid locations
        const validComplaints = complaints.filter(c =>
            c.status !== 'resolved' && getPosition(c.location)
        );

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
                    const distance = getDistanceFromLatLonInKm(
                        currentPos[0], currentPos[1],
                        neighborPos[0], neighborPos[1]
                    );

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
    }, [complaints]); // Dependency on complaints ensures re-calc when status changes

    const totalReports = complaints.length;
    const activeComplaints = complaints.filter(c => c.status !== 'resolved');
    const activeLeaks = complaints.filter(c => c.category === 'supply' && c.status !== 'resolved').length;

    const hotspots = clusterData.filter(c => c.count > 1);
    const patternIntel = hotspots.length > 0
        ? `Alert: ${hotspots.length} high-density zones detected. Zone 1 has ${hotspots[0]?.count} active reports.`
        : "No dense clusters detected. Issues are geographically scattered.";

    return (
        <Box sx={{
            py: 8,
            background: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'
        }}>
            <Container maxWidth="xl">
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 4,
                    alignItems: 'stretch',
                    mb: 4
                }}>
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

                                {clusterData.map((cluster) => (
                                    <React.Fragment key={cluster.id}>
                                        <Circle
                                            center={cluster.center}
                                            radius={1000}
                                            pathOptions={{
                                                color: cluster.count > 1 ? '#FF4D4D' : '#3388ff',
                                                fillColor: cluster.count > 1 ? '#FF4D4D' : '#3388ff',
                                                fillOpacity: 0.1,
                                                weight: 1,
                                                dashArray: '5, 10'
                                            }}
                                        />
                                    </React.Fragment>
                                ))}

                                {activeComplaints.map((complaint) => {
                                    const pos = getPosition(complaint.location);
                                    if (!pos) return null;
                                    return (
                                        <Marker key={complaint.id} position={pos}>
                                            <Popup>
                                                <Typography variant="subtitle2" fontWeight={700}>
                                                    {complaint.category?.toUpperCase()}
                                                </Typography>
                                                <Typography variant="caption">
                                                    {complaint.location}
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    color="success"
                                                    fullWidth
                                                    onClick={() => handleResolve(complaint.id)}
                                                    sx={{ mt: 1 }}
                                                >
                                                    Resolve
                                                </Button>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        </Paper>
                    </Box>

                    <Box sx={{ flex: { xs: '1 1 auto', md: 1 }, minWidth: 0 }}>
                        <Stack spacing={3} sx={{ height: '100%' }}>
                            <StatCard title="Total Reports" value={totalReports} icon={Users} color="#00D2FF" />
                            <StatCard title="Active Issues" value={activeComplaints.length} icon={TrendingUp} color="#4CAF50" />
                            <StatCard title="Critical Leaks" value={activeLeaks} icon={Droplets} color="#FF4D4D" />

                            <Paper sx={{
                                mt: 'auto !important',
                                p: 4,
                                borderRadius: 5,
                                background: 'linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 100%)',
                                color: '#4a148c'
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

                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3, borderRadius: 4, height: 450, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <BarChart3 size={24} color="#00D2FF" />
                                <Typography variant="h6" fontWeight={800}>
                                    Active Regional Density (1km Radius)
                                </Typography>
                            </Box>

                            <Box sx={{ flex: 1, minHeight: 0 }}>
                                {clusterData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={clusterData.slice(0, 5)} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" allowDecimals={false} />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={70}
                                                tick={{ fontSize: 12, fontWeight: 600 }}
                                            />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                cursor={{ fill: 'transparent' }}
                                            />
                                            <Bar dataKey="count" name="Active Complaints" radius={[0, 4, 4, 0]} barSize={30}>
                                                {clusterData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#FF4D4D' : '#00D2FF'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                        <Typography color="text.secondary">No active high-density zones</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3, borderRadius: 4, height: 450, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" fontWeight={800} mb={2}>Recent Log</Typography>
                            <Box sx={{ flex: 1, width: '100%' }}>
                                <DataGrid
                                    rows={complaints}
                                    onRowClick={(params) => setSelectedComplaint(params.row)}
                                    columns={[
                                        { field: 'category', headerName: 'Category', width: 130 },
                                        {
                                            field: 'status',
                                            headerName: 'Status',
                                            width: 120,
                                            renderCell: (params) => (
                                                <Box sx={{ color: params.value === 'resolved' ? '#4CAF50' : '#ff9800', fontWeight: 'bold' }}>
                                                    {params.value}
                                                </Box>
                                            )
                                        },
                                        { field: 'created_at', headerName: 'Date', width: 180, valueGetter: (params) => new Date(params).toLocaleDateString() },
                                    ]}
                                    pageSize={5}
                                    rowsPerPageOptions={[5]}
                                    hideFooter
                                    sx={{ border: 'none' }}
                                />
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                <Dialog
                    open={!!selectedComplaint}
                    onClose={() => setSelectedComplaint(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 4, bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#fff' } }}
                >
                    {selectedComplaint && (
                        <>
                            <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" fontWeight={700}>#{selectedComplaint.id}</Typography>
                                    <Chip label={selectedComplaint.status} color={selectedComplaint.status === 'resolved' ? "success" : "warning"} />
                                </Box>
                            </DialogTitle>
                            <DialogContent sx={{ p: 4 }}>
                                <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>ISSUE DESCRIPTION</Typography>
                                <Typography variant="body1" mb={3} sx={{ p: 2, bgcolor: theme.palette.action.hover, borderRadius: 2 }}>
                                    {selectedComplaint.description}
                                </Typography>

                                <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                                    <strong>Location:</strong> {selectedComplaint.location}
                                </Typography>

                                {parseImages(selectedComplaint.images).length > 0 && (
                                    <Box mt={3}>
                                        <Typography variant="subtitle2" color="text.secondary" fontWeight={700} gutterBottom>
                                            ATTACHED EVIDENCE
                                        </Typography>
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
                                                            style={{
                                                                borderRadius: 8,
                                                                cursor: 'pointer',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                border: '1px solid rgba(140, 140, 140, 0.2)'
                                                            }}
                                                            onClick={() => window.open(imageUrl, '_blank')}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = "https://placehold.co/100x100?text=No+Image";
                                                            }}
                                                        />
                                                    </ImageListItem>
                                                );
                                            })}
                                        </ImageList>
                                    </Box>
                                )}
                            </DialogContent>
                            <DialogActions sx={{ p: 3 }}>
                                <Button onClick={() => setSelectedComplaint(null)} color="inherit">Close</Button>
                                {selectedComplaint.status !== 'resolved' && (
                                    <Button variant="contained" color="success" onClick={() => handleResolve(selectedComplaint.id)}>Mark Resolved</Button>
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