import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    IconButton,
    CircularProgress,
    Tooltip,
    Badge,
    Card,
    CardContent,
    Alert,
    AlertTitle,
    LinearProgress,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Collapse,
    FormControlLabel,
    Checkbox,
    Switch,
    TextField,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
    AlertTriangle,
    Droplets,
    Activity,
    MapPin,
    CheckCircle2,
    Clock,
    ChevronRight,
    ChevronDown,
    Wrench,
    TrendingUp,
    AlertCircle,
    Navigation,
    Layers,
    ZoomIn,
    RefreshCw,
    FileText,
    Phone,
    Truck,
    TestTube,
    Route,
    Plus,
    X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Data and utilities
// Removed local imports - fetching from API

// Fix for Leaflet default marker icon
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

// Custom icons
const createCustomIcon = (color, type = 'default') => {
    // Exclamation mark for all complaints (user request), slightly larger for critical
    const size = type === 'critical' ? 32 : 28;

    // SVG with Exclamation mark for complaints, or a Pin for connections
    let svg = '';
    if (type === 'connection' || type === 'target') {
        svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="${size}" height="${size}">
                 <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-12-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" filter="drop-shadow(0 2px 2px rgba(0,0,0,0.5))" stroke="#fff" stroke-width="1"/>
               </svg>`;
    } else {
        svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="${size}" height="${size}">
                 <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm1.5-6.5a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 3 0v6.5z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
               </svg>`;
    }

    return L.divIcon({
        html: svg,
        className: 'custom-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size]
    });
};

// PCMC Center coordinates
const PCMC_CENTER = [18.6298, 73.7858];

// Severity colors
const SEVERITY_COLORS = {
    CRITICAL: '#ef4444',
    HIGH: '#f59e0b',
    MEDIUM: '#3b82f6',
    LOW: '#22c55e',
};

const CATEGORY_COLORS = {
    'Contaminated Water': '#dc2626',
    'Water Leakage': '#2563eb',
    'No Water Supply': '#7c3aed',
    'Low Water Pressure': '#0891b2',
    'Drainage & Sewage': '#854d0e',
    'Illegal Connection': '#be123c',
    'Other Water Issue': '#6b7280',
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const PriorityBadge = ({ severity }) => {
    const colors = {
        CRITICAL: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
        HIGH: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
        MEDIUM: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
        LOW: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    };
    const style = colors[severity] || colors.MEDIUM;

    return (
        <Chip
            label={severity}
            size="small"
            sx={{
                bgcolor: style.bg,
                color: style.text,
                border: `1px solid ${style.border}`,
                fontWeight: 700,
                fontSize: '10px',
            }}
        />
    );
};

const StatCard = ({ title, value, icon: Icon, color, trend, onClick }) => {
    const theme = useTheme();
    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 2.5,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                border: `1px solid ${theme.palette.divider}`,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                '&:hover': onClick ? {
                    borderColor: color,
                    boxShadow: `0 0 0 1px ${color}20`,
                } : {},
            }}
        >
            <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <Icon size={24} color={color} />
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {title}
                </Typography>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                    {value}
                </Typography>
                {trend && (
                    <Typography variant="caption" color={color} fontWeight={600}>
                        {trend}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

// Auto center map on complaints
const MapController = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || 13, { duration: 1 });
        }
        // Force resize calculation
        setTimeout(() => map.invalidateSize(), 100);
    }, [center, zoom, map]);

    return null;
};

// Map click handler
// Map click handler & Viewport Tracker
const MapEventsHandler = ({ onMapClick, isPicking, setZoom, onBoundsChange }) => {
    const map = useMapEvents({
        click(e) {
            if (isPicking && onMapClick) {
                onMapClick(e.latlng);
            }
        },
        zoomend() {
            setZoom(map.getZoom());
            onBoundsChange(map.getBounds());
        },
        moveend() {
            onBoundsChange(map.getBounds());
        }
    });

    useEffect(() => {
        // Initial bounds
        onBoundsChange(map.getBounds());
    }, [map, onBoundsChange]);

    useEffect(() => {
        if (isPicking) {
            map.getContainer().style.cursor = 'crosshair';
        } else {
            map.getContainer().style.cursor = '';
        }
    }, [isPicking, map]);

    return null;
};

// ============================================================================
// PIPELINE MAP COMPONENT
// ============================================================================

const PipelineMap = ({
    complaints,
    clusters,
    selectedComplaint,
    selectedCluster,
    onComplaintSelect,
    showPipelines = true,
    plannedConnections = [], // Changed from highlightedPath
    newConnectionTarget = null,
    pipelineData = { nodes: [], edges: [], nodeTypes: {} },
    bottlenecks = [], // New prop for Max Flow Bottlenecks
    layerVisibility = {
        pipelines: true,
        reservoirs: true,
        esrs: true,
        pumps: true,
        junctions: true,
        valves: true,
        clusters: true,
        complaints: true
    },
    isPickingLocation = false,
    onMapClick = null,
    onClusterSelect = null,
    onDeleteConnection = null,
    pickingMode = null,
    onNodePick = null,
}) => {
    const theme = useTheme();
    const [zoom, setZoom] = useState(12);
    const [visibleNodes, setVisibleNodes] = useState([]);

    // throttle bounds updates
    const handleBoundsChange = useCallback((bounds) => {
        if (!pipelineData.nodes) return;

        // Filter: Keep ALL major infrastructure (WTP, ESR, Pump). 
        // Only filter 'junction' and 'valve' based on viewport AND zoom level to improve performance/clutter.
        const visible = pipelineData.nodes.filter(node => {
            // Always show critical infrastructure regardless of zoom/bounds
            if (node.type === 'reservoir' || node.type === 'esr' || node.type === 'pump') return true;

            // For junctions/valves, only show if zoomed in enough AND in bounds
            if (zoom < 15) return false;

            // Check bounds
            if (!node.coords) return false;
            return bounds.contains(node.coords);
        });

        // Slice limit to prevent rendering thousands of markers even if zoomed in
        setVisibleNodes(visible.slice(0, 500));
    }, [pipelineData.nodes, zoom]);

    const parseCoords = (locString) => {
        if (!locString) return null;
        try {
            const [lat, lng] = locString.replace(/[()]/g, '').split(',').map(s => parseFloat(s.trim()));
            if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
        } catch (e) { }
        return null;
    };

    const getNodeById = (id) => pipelineData.nodes.find(n => n.id === id);

    // Generate pipeline polylines
    const pipelineLines = useMemo(() => {
        if (!layerVisibility.pipelines || !pipelineData.edges) return [];

        return pipelineData.edges.map(edge => {
            // Apply zoom-based filtering for pipelines
            // Only show major distribution lines at lower zoom levels
            if (zoom < 14 && edge.diameter < 400) return null;

            let fromCoords = edge.fromCoords;
            let toCoords = edge.toCoords;

            if (!fromCoords || !toCoords) {
                const fromNode = getNodeById(edge.from);
                const toNode = getNodeById(edge.to);
                if (fromNode) fromCoords = fromNode.coords;
                if (toNode) toCoords = toNode.coords;
            }

            if (!fromCoords || !toCoords) return null;

            // Check if edge is part of ANY planner connection
            const isHighlighted = plannedConnections.some(conn => conn.edges?.includes(edge.id));

            // Check if edge is a bottleneck
            // Ensure ID comparison is robust (string vs number)
            const isBottleneck = bottlenecks.some(b => String(b.id) === String(edge.id));

            // VISUAL STYLING
            let color = '#93c5fd'; // Default light blue for minor lines
            let weight = 2;
            let opacity = 0.5;

            // Major Pipelines (Main Distribution Lines) >= 600mm
            if (edge.diameter >= 800) {
                color = '#1e3a8a'; // Deep Blue
                weight = 5;
                opacity = 0.9;
            } else if (edge.diameter >= 400) {
                color = '#2563eb'; // Medium Blue
                weight = 3;
                opacity = 0.7;
            }

            if (isHighlighted) {
                color = '#22c55e'; // Highlighted path - Green
                weight = 6;
                opacity = 1;
            }

            if (isBottleneck) {
                color = '#ef4444'; // Bottleneck - Red
                weight = 8;        // Thicker
                opacity = 1;
            }

            return {
                id: edge.id,
                positions: [fromCoords, toCoords],
                color,
                weight,
                opacity,
                dashArray: edge.status !== 'active' ? '5, 10' : null,
            };
        }).filter(Boolean);
    }, [layerVisibility.pipelines, plannedConnections, pipelineData, zoom]);

    // Complaint markers with severity styling
    const complaintMarkers = useMemo(() => {
        if (!layerVisibility.complaints) return [];

        return complaints.map(complaint => {
            const coords = parseCoords(complaint.location);
            if (!coords) return null;

            const isSelected = selectedComplaint?.id === complaint.id;
            const severity = complaint.severity || 'MEDIUM';
            const color = CATEGORY_COLORS[complaint.category] || '#6b7280';

            return {
                id: complaint.id,
                coords,
                complaint,
                color,
                severity,
                isSelected,
            };
        }).filter(Boolean);
    }, [complaints, selectedComplaint, layerVisibility.complaints]);

    return (
        <Box sx={{ height: '100%', width: '100%', position: 'relative', bgcolor: '#e5e7eb' }}>
            <MapContainer
                center={PCMC_CENTER}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                preferCanvas={true}
            >
                <MapEventsHandler
                    onMapClick={onMapClick}
                    isPicking={isPickingLocation}
                    setZoom={setZoom}
                    onBoundsChange={handleBoundsChange}
                />
                {/* ... (TileLayer, MapController, etc.) */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <MapController
                    center={
                        selectedComplaint ? parseCoords(selectedComplaint.location) :
                            selectedCluster?.center ? selectedCluster.center :
                                PCMC_CENTER
                    }
                    zoom={selectedComplaint ? 15 : selectedCluster ? 14 : 12}
                />



                {/* Pipeline Lines */}
                {pipelineLines.map(line => {
                    if (!line.positions || line.positions.length < 2 ||
                        !line.positions[0] || !line.positions[1] ||
                        line.positions[0][0] == null || line.positions[0][1] == null ||
                        line.positions[1][0] == null || line.positions[1][1] == null ||
                        isNaN(line.positions[0][0]) || isNaN(line.positions[0][1]) ||
                        isNaN(line.positions[1][0]) || isNaN(line.positions[1][1])) return null;

                    return (
                        <Polyline
                            key={line.id}
                            positions={line.positions}
                            pathOptions={{
                                color: line.color,
                                weight: line.weight,
                                opacity: line.opacity,
                                dashArray: line.dashArray,
                            }}
                        />
                    );
                })}

                {/* Pipeline Infrastructure Nodes - All Types */}
                {visibleNodes.map(node => {
                    // Check visibility based on node type
                    const shouldShow = (
                        (node.type === 'reservoir' && layerVisibility.reservoirs) ||
                        (node.type === 'esr' && layerVisibility.esrs) ||
                        (node.type === 'pump' && layerVisibility.pumps) ||
                        (node.type === 'junction' && layerVisibility.junctions) ||
                        (node.type === 'valve' && layerVisibility.valves)
                    );

                    if (!shouldShow) return null;

                    // Define colors, sizes, and icons for each type
                    const nodeConfig = {
                        reservoir: { color: '#0ea5e9', label: 'WTP/RESERVOIR', shape: 'square' },
                        esr: { color: '#6366f1', label: 'ESR (Tank)', shape: 'rect' },
                        pump: { color: '#f59e0b', label: 'PUMP STATION', shape: 'triangle' },
                        junction: { color: '#10b981', label: 'JUNCTION', shape: 'diamond' },
                        valve: { color: '#ef4444', label: 'VALVE', shape: 'circle-x' }
                    };

                    const config = nodeConfig[node.type] || { color: '#6b7280', label: 'NODE', shape: 'circle' };

                    // Create custom marker icon
                    const createInfraIcon = (type, color) => {
                        let html = '';
                        // Simple CSS shapes
                        if (type === 'reservoir') { // Square
                            html = `<div style="background-color: ${color}; width: 16px; height: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
                        } else if (type === 'esr') { // Vertical Rect (Tank)
                            html = `<div style="background-color: ${color}; width: 14px; height: 20px; border: 2px solid white; border-radius: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
                        } else if (type === 'pump') { // Triangle
                            html = `<div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 16px solid ${color}; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3)); stroke: white; stroke-width: 2px;"></div>`;
                        } else if (type === 'junction') { // Diamond
                            html = `<div style="background-color: ${color}; width: 12px; height: 12px; transform: rotate(45deg); border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
                        } else { // Valve (Circle with cross or just small circle)
                            html = `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
                        }

                        return L.divIcon({
                            className: 'custom-infra-icon',
                            html: html,
                            iconSize: [20, 20],
                            iconAnchor: [10, 10],
                            popupAnchor: [0, -10]
                        });
                    };

                    return (
                        <Marker
                            key={node.id}
                            position={node.coords}
                            icon={createInfraIcon(node.type, config.color)}
                            eventHandlers={{
                                click: (e) => {
                                    if (pickingMode) {
                                        L.DomEvent.stopPropagation(e); // Prevent map click
                                        onNodePick && onNodePick(node);
                                    }
                                }
                            }}
                        >
                            <Popup>
                                <Box sx={{ minWidth: 180 }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: config.color }}>
                                        {config.label}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {node.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        ID: {node.id}
                                    </Typography>
                                    {node.capacity && (
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                            <strong>Capacity:</strong> {node.capacity} {node.type === 'reservoir' ? 'MLD' : 'ML'}
                                        </Typography>
                                    )}
                                    {node.area && (
                                        <Typography variant="caption" display="block">
                                            <strong>Serves:</strong> {node.area.charAt(0).toUpperCase() + node.area.slice(1)}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" display="block" sx={{ mt: 0.5, color: node.status === 'active' ? '#22c55e' : '#ef4444' }}>
                                        Status: {node.status?.toUpperCase() || 'ACTIVE'}
                                    </Typography>
                                </Box>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Correlation Clusters */}
                {layerVisibility.clusters && clusters?.filter(c => c.complaints.length > 1).map(cluster => (
                    <Circle
                        key={cluster.id}
                        center={cluster.center}
                        radius={400 * Math.sqrt(cluster.complaints.length)}
                        pathOptions={{
                            color: cluster.correlationType === 'LEAKAGE_CONTAMINATION' ? '#dc2626' :
                                cluster.correlationType === 'WIDESPREAD_CONTAMINATION' ? '#f59e0b' : '#3b82f6',
                            fillColor: cluster.correlationType === 'LEAKAGE_CONTAMINATION' ? '#dc2626' :
                                cluster.correlationType === 'WIDESPREAD_CONTAMINATION' ? '#f59e0b' : '#3b82f6',
                            fillOpacity: 0.15,
                            weight: 2,
                            dashArray: '8, 8',
                        }}
                        interactive={false}
                    >
                        {/* Popup removed to prevent clash with sidebar; could keep concise one if desired */}
                    </Circle>
                ))}

                {/* Complaint Markers */}
                {complaintMarkers.map(marker => (
                    <Marker
                        key={marker.id}
                        position={marker.coords}
                        icon={createCustomIcon(
                            marker.color,
                            marker.severity === 'CRITICAL' ? 'critical' : 'default'
                        )}
                        eventHandlers={{
                            click: () => onComplaintSelect?.(marker.complaint),
                        }}
                    >
                        <Popup>
                            <Box sx={{ minWidth: 200, maxWidth: 280 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Chip
                                        label={marker.complaint.category}
                                        size="small"
                                        sx={{
                                            bgcolor: marker.color,
                                            color: 'white',
                                            fontSize: '10px',
                                            fontWeight: 700,
                                        }}
                                    />
                                    <PriorityBadge severity={marker.severity} />
                                </Box>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    {marker.complaint.description?.substring(0, 120)}...
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ID: #{marker.complaint.id} • {new Date(marker.complaint.created_at).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </Popup>
                    </Marker>
                ))}

                {/* Proposal: New Connection Lines & Markers (Multiple) */}
                {plannedConnections.map((conn, idx) => {
                    const isValidCoord = (c) => Array.isArray(c) && c.length === 2 &&
                        c[0] !== null && c[0] !== undefined &&
                        c[1] !== null && c[1] !== undefined &&
                        !isNaN(c[0]) && !isNaN(c[1]);

                    // Determine path to draw
                    let pathPositions = [];
                    if (conn.fullPathCoords && Array.isArray(conn.fullPathCoords) && conn.fullPathCoords.length > 0) {
                        pathPositions = conn.fullPathCoords.filter(isValidCoord);
                    } else if (conn.connectionPoint?.coords && conn.targetCoords) {
                        if (isValidCoord(conn.connectionPoint.coords) && isValidCoord(conn.targetCoords)) {
                            pathPositions = [conn.connectionPoint.coords, conn.targetCoords];
                        }
                    }

                    if (pathPositions.length < 2) return null; // Skip invalid paths

                    return (
                        <React.Fragment key={`planned-conn-group-${idx}`}>
                            <Polyline
                                positions={pathPositions}
                                pathOptions={{
                                    color: '#10b981',
                                    weight: 6,
                                    opacity: 0.8,
                                    lineCap: 'round'
                                }}
                            />
                            {conn.targetCoords && isValidCoord(conn.targetCoords) && (
                                <Marker
                                    position={conn.targetCoords}
                                    icon={createCustomIcon('#10b981', 'connection')}
                                >
                                    <Popup>
                                        <Box sx={{ minWidth: 220, p: 0.5 }}>
                                            <Typography variant="subtitle1" fontWeight={800} color="success.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                💧 Connection #{idx + 1}
                                            </Typography>

                                            <Paper variant="outlined" sx={{ p: 1, mb: 1, bgcolor: 'success.50' }}>
                                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                                    CONNECTING TO
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {conn.connectionPoint?.type?.toUpperCase()} #{conn.connectionPoint?.id} ({conn.connectionPoint?.diameter || 'Unknown'}mm)
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Distance from point: {conn.newPipeRequired?.estimatedLength ? `${conn.newPipeRequired.estimatedLength}m` : 'N/A'}
                                                </Typography>
                                            </Paper>

                                            <Paper variant="outlined" sx={{ p: 1, mb: 1, bgcolor: 'primary.50' }}>
                                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                                    SOURCE
                                                </Typography>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {conn.waterSource?.type?.toUpperCase()} #{conn.waterSource?.id}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Total Route: {conn.totalDistance ? `${conn.totalDistance} km` : 'N/A'}
                                                </Typography>
                                            </Paper>

                                            <Alert severity="info" sx={{ py: 0, px: 1, '& .MuiAlert-message': { py: 0.5 } }}>
                                                <Typography variant="caption">
                                                    Est. Cost: <b>{conn.newPipeRequired?.estimatedCost?.formatted || 'N/A'}</b>
                                                </Typography>
                                            </Alert>

                                            <Button
                                                size="small"
                                                color="error"
                                                fullWidth
                                                sx={{ mt: 1 }}
                                                onClick={() => onDeleteConnection && onDeleteConnection(idx)}
                                            >
                                                Remove Plan
                                            </Button>
                                        </Box>
                                    </Popup>
                                </Marker>
                            )}
                        </React.Fragment>
                    );
                })}

                {/* New Connection Target Marker */}
                {
                    newConnectionTarget && (
                        <Marker
                            position={newConnectionTarget}
                            icon={createCustomIcon('#3b82f6', 'target')}
                        >
                            <Popup>
                                <Box sx={{ p: 0.5, textAlign: 'center' }}>
                                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                        📍 Targeted Location
                                    </Typography>
                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1.5 }}>
                                        Optimal route calculation pending...
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        fullWidth
                                        onClick={() => onMapClick?.({ lat: newConnectionTarget[0], lng: newConnectionTarget[1] })}
                                    >
                                        Open Planner
                                    </Button>
                                </Box>
                            </Popup>
                        </Marker>
                    )
                }
            </MapContainer >

            {/* Map Legend */}
            <Paper
                sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    zIndex: 1000,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,0,0,0.1)',
                }}
            >
                <Typography variant="caption" fontWeight={700} display="block" mb={1}>
                    INFRASTRUCTURE
                </Typography>
                <Stack spacing={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 20, height: 3, bgcolor: '#1e40af' }} />
                        <Typography variant="caption">Main Pipeline</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#0ea5e9' }} />
                        <Typography variant="caption">WTP/Reservoir</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#6366f1' }} />
                        <Typography variant="caption">ESR (Tank)</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                        <Typography variant="caption">Pump Station</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                        <Typography variant="caption">Junction</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#ef4444' }} />
                        <Typography variant="caption">Valve</Typography>
                    </Box>
                </Stack>
                <Typography variant="caption" fontWeight={700} display="block" mt={1.5} mb={0.5}>
                    ISSUES
                </Typography>
                <Stack spacing={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#dc2626' }} />
                        <Typography variant="caption">Critical Issue</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                        <Typography variant="caption">Complaint</Typography>
                    </Box>
                </Stack>
            </Paper >
        </Box >
    );
};

// ============================================================================
// ISSUE DETAIL PANEL
// ============================================================================

const IssueDetailPanel = ({ complaint, onClose, allComplaints, onResolve }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState({ recs: true, affected: false });
    const [analysisData, setAnalysisData] = useState({ recommendations: [], affectedAreas: null });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (!complaint) return;
            setLoading(true);
            try {
                // Fetch recommendations and impact in parallel
                const [recsRes, impactRes] = await Promise.all([
                    axios.post('/api/analysis/recommendations', { complaintId: complaint.id }),
                    axios.post('/api/analysis/impact', { complaintId: complaint.id })
                ]);

                setAnalysisData({
                    recommendations: recsRes.data.recommendations || (Array.isArray(recsRes.data) ? recsRes.data : []),
                    affectedAreas: impactRes.data
                });
            } catch (error) {
                console.error("Analysis fetch error:", error);
                // Fallback or error state handling could go here
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [complaint]);

    if (!complaint) return null;

    const { recommendations, affectedAreas } = analysisData;
    const severity = complaint.severity || 'MEDIUM';

    const actionIcons = {
        'DISPATCH_REPAIR': Wrench,
        'WATER_TESTING': TestTube,
        'TANKER_DISPATCH': Truck,
        'ADVISORY': AlertCircle,
        'ISOLATE_VALVE': Activity,
        'CHECK_UPSTREAM': Route,
        'FIX_SOURCE': Droplets,
        'INVESTIGATION': FileText,
        'INSPECT': MapPin,
        'DRAINAGE_CLEAR': Activity,
        'PROXIMITY_CHECK': Navigation,
        'PRESSURE_CHECK': TrendingUp,
        'LEAK_CHECK': Droplets,
        'ENFORCEMENT': FileText,
    };

    return (
        <Paper
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 0,
                borderLeft: `4px solid ${SEVERITY_COLORS[severity]}`,
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: `${SEVERITY_COLORS[severity]}10`,
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            ISSUE ID: #{complaint.id}
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, mt: 0.5 }}>
                            {complaint.category}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -0.5 }}>
                        <X size={20} />
                    </IconButton>
                </Box>

                <Box sx={{ mt: 1 }}>
                    <PriorityBadge severity={severity} />
                </Box>

                {complaint.ai_urgency === 'Emergency' && (
                    <Alert severity="error" sx={{ mt: 1.5, py: 0 }}>
                        <AlertTitle sx={{ mb: 0, fontSize: '12px' }}>
                            EMERGENCY - Immediate action required
                        </AlertTitle>
                    </Alert>
                )}
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {complaint.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Details Grid */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">Location</Typography>
                        <Typography variant="body2" fontWeight={600}>
                            {complaint.area || 'Unknown Area'}
                            <Typography component="span" variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 500 }}>
                                Ward: {complaint.ward || '-'}
                            </Typography>
                        </Typography>
                    </Grid>
                    <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">Reported</Typography>
                        <Typography variant="body2" fontWeight={600}>
                            {new Date(complaint.created_at).toLocaleString()}
                        </Typography>
                    </Grid>
                    {/* AI Analysis Removed as per user request */}
                    <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">Priority Score</Typography>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                            {complaint.priorityScore || 'Calculating...'}
                        </Typography>
                    </Grid>
                </Grid>

                {/* Recommendations */}
                <Box sx={{ mb: 2 }}>
                    <Box
                        onClick={() => setExpanded(prev => ({ ...prev, recs: !prev.recs }))}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            py: 1,
                        }}
                    >
                        {expanded.recs ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <Typography variant="subtitle2" fontWeight={700}>
                            💡 Recommended Actions
                        </Typography>
                        {loading && <CircularProgress size={12} />}
                    </Box>
                    <Collapse in={expanded.recs}>
                        <List dense disablePadding>
                            {loading ? (
                                <ListItem><Typography variant="caption">Loading recommendations...</Typography></ListItem>
                            ) : recommendations.length === 0 ? (
                                <ListItem><Typography variant="caption">No specific recommendations.</Typography></ListItem>
                            ) : (
                                recommendations.map((rec, idx) => {
                                    const ActionIcon = actionIcons[rec.action] || CheckCircle2;
                                    return (
                                        <ListItem
                                            key={idx}
                                            sx={{
                                                bgcolor: rec.priority === 'CRITICAL' ? 'error.50' :
                                                    rec.priority === 'HIGH' ? 'warning.50' : 'action.hover',
                                                borderRadius: 1,
                                                mb: 0.5,
                                                border: rec.priority === 'CRITICAL' ? '1px solid' : 'none',
                                                borderColor: 'error.200',
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                <ActionIcon size={18} color={
                                                    rec.priority === 'CRITICAL' ? '#dc2626' :
                                                        rec.priority === 'HIGH' ? '#d97706' : '#3b82f6'
                                                } />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={rec.title}
                                                secondary={rec.description}
                                                primaryTypographyProps={{ fontWeight: 600, fontSize: '13px' }}
                                                secondaryTypographyProps={{ fontSize: '11px' }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {rec.estimatedTime}
                                            </Typography>
                                        </ListItem>
                                    );
                                })
                            )}
                        </List>
                    </Collapse>
                </Box>

                {/* Affected Areas */}
                {
                    affectedAreas?.success && (
                        <Box>
                            <Box
                                onClick={() => setExpanded(prev => ({ ...prev, affected: !prev.affected }))}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    cursor: 'pointer',
                                    py: 1,
                                }}
                            >
                                {expanded.affected ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                <Typography variant="subtitle2" fontWeight={700}>
                                    🌊 Downstream Impact
                                </Typography>
                                <Chip
                                    label={affectedAreas.severity}
                                    size="small"
                                    color={affectedAreas.severity === 'HIGH' ? 'error' :
                                        affectedAreas.severity === 'MEDIUM' ? 'warning' : 'success'}
                                    sx={{ height: 20, fontSize: '10px' }}
                                />
                            </Box>
                            <Collapse in={expanded.affected}>
                                <Box sx={{ pl: 3 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {affectedAreas.affectedNodes?.length || 0} infrastructure points potentially affected
                                    </Typography>
                                    {affectedAreas.affectedAreas?.length > 0 && (
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                            Areas: {affectedAreas.affectedAreas.join(', ')}
                                        </Typography>
                                    )}
                                </Box>
                            </Collapse>
                        </Box>
                    )
                }
            </Box >

            {/* Actions Footer */}
            <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<CheckCircle2 size={16} />}
                    fullWidth
                    onClick={() => onResolve(complaint, 'issue')}
                >
                    Mark Resolved
                </Button>
            </Box>
        </Paper>
    );
};

// ============================================================================
// CLUSTER DETAIL PANEL
// ============================================================================

const ClusterDetailPanel = ({ cluster, onClose, onSelectComplaint, onResolve }) => {
    if (!cluster) return null;

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                bgcolor: 'background.paper',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box>
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                        CLUSTER ANALYSIS
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                        {cluster.title}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
                    <X size={20} />
                </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>

                {/* AI Insight Removed */}

                {/* Complaint List */}
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AlertTriangle size={16} /> RELATED COMPLAINTS ({cluster.complaints?.length || 0})
                </Typography>

                <Stack spacing={1} mb={3}>
                    {cluster.complaints?.map((point, index) => (
                        <Card
                            key={index}
                            variant="outlined"
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.light' },
                                transition: 'all 0.2s'
                            }}
                            onClick={() => onSelectComplaint(point)}
                        >
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={1}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            #{point.id} • {point.category}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {point.description}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={point.status}
                                        size="small"
                                        color={point.status === 'resolved' ? 'success' : 'warning'}
                                        sx={{ height: 20, fontSize: '0.65rem' }}
                                    />
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            </Box>

            {/* Actions */}
            <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
                <Button
                    fullWidth
                    variant="contained"
                    color="primary" // Changed from secondary, user asked to remove "Contact Citizen" and implement resolution
                    startIcon={<CheckCircle2 size={18} />}
                    onClick={() => onResolve(cluster)}
                >
                    Mark Cluster Resolved
                </Button>
            </Box>
        </Paper>
    );
};

// ============================================================================
// NEW CONNECTION PLANNER
// ============================================================================

const NewConnectionPlanner = ({ isOpen, onClose, onPlanRoute, targetCoords, onPickLocation, existingConnections = [], onDeleteConnection }) => {
    const theme = useTheme();
    const [routeResult, setRouteResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pipeMaterial, setPipeMaterial] = useState('hdpe');

    const PIPE_COSTS = {
        'hdpe': { label: 'HDPE (110mm)', rate: 1200, material: 400, civil: 800 },
        'pvc': { label: 'PVC (110mm)', rate: 850, material: 250, civil: 600 },
        'di': { label: 'Ductile Iron (150mm)', rate: 2500, material: 1500, civil: 1000 }
    };

    // Reset result when target changes
    useEffect(() => {
        setRouteResult(null);
    }, [targetCoords]);

    const planRoute = async () => {
        if (!targetCoords) return;

        setLoading(true);
        try {
            const response = await axios.post('/api/analysis/route', {
                lat: targetCoords[0],
                lng: targetCoords[1]
            });
            const result = response.data;
            setRouteResult(result);
            onPlanRoute?.(result);
        } catch (error) {
            console.error('Route planning error:', error);
            setRouteResult({ success: false, error: 'Connection failed to server' });
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <Plus size={24} />
                    <Typography variant="h6" fontWeight={700}>
                        New Connection Planner
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Pick a location on the map to find the optimal water connection route from the nearest source.
                </Alert>

                {!targetCoords ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <MapPin size={48} color={theme.palette.text.secondary} />
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
                            No target location selected.
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={onPickLocation}
                            startIcon={<MapPin size={18} />}
                            size="large"
                        >
                            Pick Location on Map
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        📍 Target Location Set
                                    </Typography>
                                    <Typography variant="body2">
                                        Coordinates: {targetCoords[0].toFixed(5)}, {targetCoords[1].toFixed(5)}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={onPickLocation}
                                    startIcon={<MapPin size={14} />}
                                >
                                    Change
                                </Button>
                            </Box>
                        </Paper>

                        {/* Pipe Material Selection - ALWAYS VISIBLE */}
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                select
                                label="Select Pipe Material"
                                value={pipeMaterial}
                                onChange={(e) => setPipeMaterial(e.target.value)}
                                fullWidth
                                size="small"
                                SelectProps={{ native: true }}
                                helperText={`Cost Estimate: ₹${PIPE_COSTS[pipeMaterial].material} (Pipe) + ₹${PIPE_COSTS[pipeMaterial].civil} (Civil) = ₹${PIPE_COSTS[pipeMaterial].rate}/m`}
                            >
                                {Object.entries(PIPE_COSTS).map(([key, config]) => (
                                    <option key={key} value={key}>
                                        {config.label}
                                    </option>
                                ))}
                            </TextField>
                        </Box>

                        {!routeResult && !loading && (
                            <Button
                                variant="contained"
                                onClick={planRoute}
                                startIcon={<Route size={18} />}
                                fullWidth
                            >
                                Calculate Optimal Route
                            </Button>
                        )}

                        {loading && (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                <CircularProgress size={40} />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Computing optimal path...
                                </Typography>
                            </Box>
                        )}

                        {routeResult?.success && (
                            <Box sx={{ mt: 2 }}>
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    <AlertTitle>Route Found!</AlertTitle>
                                    Optimal connection path calculated from {routeResult.waterSource?.name}
                                </Alert>

                                <Grid container spacing={2}>
                                    <Grid size={6}>
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Water Source
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {routeResult.waterSource?.name}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid size={6}>
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Connection Point
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {routeResult.connectionPoint?.name}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid size={6}>
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Total Distance
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {(parseFloat(routeResult.totalDistance) + (routeResult.newPipeRequired?.estimatedLength || 0) / 1000).toFixed(2)} km
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid size={6}>
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                New Pipe Required
                                            </Typography>
                                            <Typography variant="body1" fontWeight={600}>
                                                {routeResult.newPipeRequired?.estimatedLength} m
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid size={12}>
                                        <Paper sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                                            <Typography variant="caption" color="text.secondary" gutterBottom>
                                                Cost Formula (Per Meter)
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', bgcolor: 'white', p: 1, borderRadius: 1, border: '1px dashed #ccc' }}>
                                                ₹{PIPE_COSTS[pipeMaterial].material} (Pipe) + ₹{PIPE_COSTS[pipeMaterial].civil} (Civil) = <span style={{ color: '#15803d', fontWeight: 'bold' }}>₹{PIPE_COSTS[pipeMaterial].rate}/m</span>
                                            </Typography>

                                            <Divider sx={{ my: 1.5 }} />

                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" color="text.secondary">
                                                    Total Estimate ({routeResult.newPipeRequired?.estimatedLength}m)
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} color="primary.main">
                                                    ₹ {((routeResult.newPipeRequired?.estimatedLength || 0) * PIPE_COSTS[pipeMaterial].rate).toLocaleString()}
                                                </Typography>
                                            </Box>

                                            <Typography component="span" variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                                                {routeResult.isFallback && <span style={{ color: '#f59e0b' }}>⚠️ Nearest junction unreachable. Connected to pipe/valve.</span>}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {routeResult && !routeResult.success && (
                            <Alert severity="error">
                                {routeResult.error || 'Could not find route to water source'}
                            </Alert>
                        )}
                    </Box>
                )}

                {/* Existing Planned Connections List */}
                {existingConnections.length > 0 && (
                    <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                            📋 Planned Connections ({existingConnections.length})
                        </Typography>
                        <Stack spacing={1}>
                            {existingConnections.map((conn, idx) => (
                                <Paper
                                    key={idx}
                                    sx={{
                                        p: 1.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        bgcolor: 'success.50',
                                        border: '1px solid',
                                        borderColor: 'success.200'
                                    }}
                                >
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>
                                            Connection #{idx + 1}: {conn.connectionPoint?.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {conn.newPipeRequired?.estimatedLength}m • {conn.newPipeRequired?.estimatedCost?.formatted}
                                        </Typography>
                                    </Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => onDeleteConnection?.(idx)}
                                        sx={{ color: 'error.main' }}
                                    >
                                        <X size={18} />
                                    </IconButton>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                {routeResult?.success && (
                    <Button
                        variant="outlined"
                        onClick={onPickLocation}
                        startIcon={<Plus size={16} />}
                    >
                        Add Another
                    </Button>
                )}
                {(routeResult?.success || existingConnections.length > 0) && (
                    <Button variant="contained" onClick={onClose}>
                        Show on Map
                    </Button>
                )}
            </DialogActions>
        </Dialog >
    );
};

// ============================================================================
// RESOLVE DIALOG COMPONENT
// ============================================================================

const ResolveDialog = ({ open, onClose, target, type, onSubmit }) => {
    const [remarks, setRemarks] = useState('');
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!remarks.trim()) {
            alert('Please provide resolution remarks');
            return;
        }
        setSubmitting(true);
        await onSubmit(remarks, files);
        setSubmitting(false);
        setRemarks('');
        setFiles([]);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Resolve {type === 'cluster' ? 'Cluster' : 'Issue'} #{target?.id}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Provide details about how this {type} was resolved. This will be recorded in the official registry.
                </Typography>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Resolution Remarks"
                    fullWidth
                    multiline
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                />
                <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CheckCircle2 size={16} />}
                    sx={{ mt: 2 }}
                >
                    Upload Evidence
                    <input type="file" hidden multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
                </Button>
                {files.length > 0 && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        {files.length} files selected
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="success" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Confirm Resolution'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// ============================================================================
// MAX FLOW ANALYSIS COMPONENT
// ============================================================================

const MaxFlowAnalysisDialog = ({ isOpen, onClose, pipelineData, onResultsFound, pickingMode, setPickingMode }) => {
    const [sourceId, setSourceId] = useState('');
    const [sinkId, setSinkId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // Filter relevant nodes for selection
    const sources = useMemo(() =>
        window.pipelineData?.nodes?.filter(n => n.type === 'reservoir' || n.type === 'esr') || [],
        [window.pipelineData]);

    const availableNodes = pipelineData?.nodes || [];
    const sourceOptions = availableNodes.filter(n => n.type === 'reservoir' || n.type === 'esr' || n.type === 'pump');

    // Handle incoming picks from map
    useEffect(() => {
        if (pickingMode?.pickedNode) {
            if (pickingMode.type === 'source') {
                setSourceId(pickingMode.pickedNode.id);
            } else if (pickingMode.type === 'sink') {
                setSinkId(pickingMode.pickedNode.id);
            }
            // Reset picking mode after selection (handled by parent mostly, but we ack here)
            setPickingMode(null); // Return to dialog focus
        }
    }, [pickingMode, setPickingMode]);


    // Auto-select first source if available
    useEffect(() => {
        if (isOpen && sourceOptions.length > 0 && !sourceId && !pickingMode) {
            setSourceId(sourceOptions[0].id);
        }
    }, [isOpen, sourceOptions]);

    const handleAnalyze = async () => {
        if (!sourceId || !sinkId) return;

        setLoading(true);
        try {
            const res = await axios.get('/api/analysis/max-flow', {
                params: { source: sourceId, sink: sinkId }
            });
            setResult(res.data);
            if (res.data.success) {
                onResultsFound?.(res.data.bottlenecks || []);
            }
        } catch (err) {
            console.error("Max Flow calculation error:", err);
            setResult({ error: err.response?.data?.error || 'Analysis failed' });
        }
        setLoading(false);
    };

    const handleClose = () => {
        setResult(null);
        // We keep the map bottlenecks visible unless specifically cleared?
        // Or clear them on close? Let's clear on close for a clean UI.
        onResultsFound?.([]);
        onClose();
    };

    return (
        <Dialog
            open={isOpen && !pickingMode} // Hide dialog when picking 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            sx={{ visibility: pickingMode ? 'hidden' : 'visible' }} // Keeping it mounted but hidden preserves state
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <Activity size={24} color="#f59e0b" />
                    <Typography variant="h6" fontWeight={700}>
                        Network Capacity Analysis (Max Flow)
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Alert severity="info" sx={{ mb: 3 }}>
                    Identify capacity bottlenecks between a water source and a destination.
                </Alert>

                <Stack spacing={3}>
                    <Box display="flex" gap={1} alignItems="flex-start">
                        <TextField
                            select
                            label="Source Node (WTP/ESR)"
                            value={sourceId}
                            onChange={(e) => setSourceId(e.target.value)}
                            SelectProps={{ native: true }}
                            fullWidth
                        >
                            <option value="">Select Source...</option>
                            {sourceOptions.map(n => (
                                <option key={n.id} value={n.id}>
                                    {n.name} ({n.type.toUpperCase()})
                                </option>
                            ))}
                        </TextField>
                        <Tooltip title="Pick on Map">
                            <IconButton
                                color="primary"
                                sx={{ mt: 1, border: '1px solid', borderColor: 'divider' }}
                                onClick={() => setPickingMode({ type: 'source' })}
                            >
                                <MapPin size={20} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Box display="flex" gap={1} alignItems="flex-start">
                        <TextField
                            label="Target Node ID (Sink)"
                            value={sinkId}
                            onChange={(e) => setSinkId(e.target.value)}
                            placeholder="Enter Node ID (e.g., junction_123)"
                            helperText="Copy ID from map popup or use Pick on Map"
                            fullWidth
                        />
                        <Tooltip title="Pick on Map">
                            <IconButton
                                color="primary"
                                sx={{ mt: 1, border: '1px solid', borderColor: 'divider' }}
                                onClick={() => setPickingMode({ type: 'sink' })}
                            >
                                <MapPin size={20} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleAnalyze}
                        disabled={loading || !sourceId || !sinkId}
                        startIcon={loading ? <CircularProgress size={20} /> : <TrendingUp />}
                    >
                        {loading ? 'Analyzing...' : 'Calculate Max Flow'}
                    </Button>
                </Stack>

                {result && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: result.error ? 'error.50' : 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        {result.error ? (
                            <Typography color="error">{result.error}</Typography>
                        ) : (
                            <>
                                <Typography variant="h5" color="primary.main" fontWeight={800} gutterBottom>
                                    Max Flow: {result.maxFlow} units
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    {result.message}
                                </Typography>
                                <Typography variant="subtitle2" fontWeight={700}>
                                    Bottlenecks Identified ({result.bottlenecks?.length || 0}):
                                </Typography>
                                <List dense>
                                    {result.bottlenecks?.slice(0, 5).map((edge, i) => (
                                        <ListItem key={i}>
                                            <AlertTriangle size={16} color="orange" style={{ marginRight: 8 }} />
                                            <ListItemText
                                                primary={`Pipe Segment: ${edge.id}`}
                                                secondary={`Capacity: ${edge.capacity} | Flow: ${edge.flow}`}
                                            />
                                        </ListItem>
                                    ))}
                                    {result.bottlenecks?.length > 5 && (
                                        <Typography variant="caption" sx={{ pl: 4 }}>
                                            ...and {result.bottlenecks.length - 5} more segments.
                                        </Typography>
                                    )}
                                </List>
                            </>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const WaterIntelligenceDashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [selectedCluster, setSelectedCluster] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [showPipelines, setShowPipelines] = useState(true);
    const [connectionPlannerOpen, setConnectionPlannerOpen] = useState(false);
    const [maxFlowOpen, setMaxFlowOpen] = useState(false);
    const [maxFlowPickingMode, setMaxFlowPickingMode] = useState(null); // { type: 'source'|'sink', pickedNode: null }
    const [pickingMode, setPickingMode] = useState(null); // Generic picking state

    const handleNodePick = (node) => {
        if (maxFlowPickingMode) {
            setMaxFlowPickingMode(prev => ({ ...prev, pickedNode: node }));
        }
    }; // New state for Max Flow
    const [bottlenecks, setBottlenecks] = useState([]); // Bottleneck edges for visualization
    const [plannedConnections, setPlannedConnections] = useState([]); // Array of planned routes
    const [resolveDialog, setResolveDialog] = useState({ open: false, target: null, type: 'cluster' }); // type: 'issue' or 'cluster'

    // Layer visibility controls
    const [layerVisibility, setLayerVisibility] = useState({
        pipelines: true,
        reservoirs: true,
        esrs: true,
        pumps: true,
        junctions: false, // Default back to false for performance, only visible when zoomed in
        valves: true,
        clusters: true,
        complaints: true
    });

    // New Server-Side Data States
    const [pipelineData, setPipelineData] = useState({ nodes: [], edges: [], nodeTypes: {} });
    const [prioritized, setPrioritized] = useState({ critical: [], high: [], medium: [], low: [], all: [] });
    const [clusters, setClusters] = useState([]);
    const [stats, setStats] = useState({ total: 0, critical: 0, correlatedClusters: 0, resolved: 0 });

    // Fetch initial data
    useEffect(() => {
        const fetchPipelineData = async () => {
            try {
                const res = await axios.get('/api/data/pipeline');
                console.log('🔵 Pipeline Data Fetched:', res.data);
                console.log('🔵 Nodes count:', res.data.nodes?.length);
                console.log('🔵 Infrastructure nodes:', res.data.nodes?.filter(n =>
                    n.type === 'esr' || n.type === 'reservoir' || n.type === 'pump'
                ));
                setPipelineData(res.data);
            } catch (err) {
                console.error("❌ Failed to load pipeline data:", err);
            }
        };
        fetchPipelineData();
    }, []);

    // Fetch complaints
    const fetchComplaints = async () => {
        try {
            const response = await axios.get('/api/complaints');
            setComplaints(response.data);
        } catch (err) {
            console.error("Failed to fetch complaints:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    // Analyze complaints (Server-Side)
    useEffect(() => {
        if (complaints.length === 0) return;

        const runAnalysis = async () => {
            try {
                const [corrRes, prioRes] = await Promise.all([
                    axios.post('/api/analysis/correlate', { complaints }), // Sending complaints explicitly or could let backend fetch active
                    axios.post('/api/analysis/prioritize', { complaints })
                ]);

                setClusters(corrRes.data);
                setPrioritized(prioRes.data);

                setStats({
                    total: complaints.filter(c => c.status !== 'resolved').length,
                    critical: prioRes.data.critical.length,
                    correlatedClusters: corrRes.data.filter(c => c.complaints.length > 1).length,
                    resolved: complaints.filter(c => c.status === 'resolved').length,
                });

            } catch (err) {
                console.error("Analysis failed:", err);
            }
        };

        runAnalysis();
    }, [complaints]);


    // Handle connection route planning
    const handlePlanRoute = (result) => {
        if (result?.success && newConnectionTarget) {
            // Add to planned connections list with the target coordinates
            setPlannedConnections(prev => [...prev, { ...result, targetCoords: newConnectionTarget }]);
            setNewConnectionTarget(null); // Clear current target for next pick
        }
    };

    // Delete a planned connection by index
    const handleDeleteConnection = (index) => {
        setPlannedConnections(prev => prev.filter((_, i) => i !== index));
    };


    // Picking location for new connection
    const [isPickingLocation, setIsPickingLocation] = useState(false);
    const [newConnectionTarget, setNewConnectionTarget] = useState(null);

    const handlePickLocation = () => {
        setConnectionPlannerOpen(false);
        setIsPickingLocation(true);
    };

    const handleMapClick = (latlng) => {
        if (isPickingLocation) {
            setNewConnectionTarget([latlng.lat, latlng.lng]);
            setIsPickingLocation(false);
            setConnectionPlannerOpen(true);
        }
    };

    // Handle Resolution
    const handleResolve = (target, type = 'cluster') => {
        setResolveDialog({ open: true, target, type });
    };

    const submitResolution = async (remarks, files) => {
        const { type, target } = resolveDialog;
        const complaintsToResolve = type === 'cluster' ? target.complaints : [target];

        try {
            const formData = new FormData();
            formData.append('remarks', remarks);
            files.forEach(file => formData.append('evidence', file));

            // Run resolutions in parallel
            await Promise.all(complaintsToResolve.map(c =>
                axios.post(`/api/complaints/${c.id}/resolve`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            ));

            alert(`${type === 'cluster' ? 'Cluster' : 'Issue'} resolved successfully!`);
            setResolveDialog(prev => ({ ...prev, open: false }));
            fetchComplaints(); // Refresh the list
        } catch (err) {
            console.error("Resolution failed:", err);
            alert("Failed to resolve. Please try again.");
        }
    };

    // Handle selection logic
    const handleComplaintSelect = (complaint) => {
        setSelectedCluster(null); // Clear cluster selection
        setSelectedComplaint(complaint);
    };

    const handleClusterSelect = (cluster) => {
        setSelectedComplaint(null); // Clear complaint selection
        setSelectedCluster(cluster);
        setActiveTab(2); // Switch to Clusters tab
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ py: 3, minHeight: '100vh', bgcolor: theme.palette.mode === 'dark' ? '#0b1120' : '#f8fafc' }}>
            {/* Resolution Dialog */}
            <ResolveDialog
                open={resolveDialog.open}
                onClose={() => setResolveDialog(prev => ({ ...prev, open: false }))}
                target={resolveDialog.target}
                type={resolveDialog.type}
                onSubmit={submitResolution}
            />

            {/* Location Picking Banner */}
            {isPickingLocation && (
                <Alert
                    severity="info"
                    variant="filled"
                    sx={{
                        position: 'fixed',
                        top: 80,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 2000,
                        width: 'auto',
                        minWidth: 400,
                        boxShadow: 3
                    }}
                    action={
                        <Button color="inherit" size="small" onClick={() => setIsPickingLocation(false)}>
                            Cancel
                        </Button>
                    }
                >
                    <Typography fontWeight={600}>
                        Click anywhere on the map to set the new connection point
                    </Typography>
                </Alert>
            )}

            {/* Max Flow Picking Banner */}
            {maxFlowPickingMode && !maxFlowPickingMode.pickedNode && (
                <Alert
                    severity="info"
                    variant="filled"
                    icon={<MapPin />}
                    sx={{
                        position: 'fixed',
                        top: 80,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 2000,
                        width: 'auto',
                        minWidth: 450,
                        boxShadow: 3,
                        bgcolor: 'secondary.main'
                    }}
                    action={
                        <Button color="inherit" size="small" onClick={() => setMaxFlowPickingMode(null)}>
                            Cancel Picking
                        </Button>
                    }
                >
                    <Typography fontWeight={600}>
                        Select a {maxFlowPickingMode.type === 'source' ? 'SOURCE (Reservoir/ESR)' : 'TARGET (Junction/Valve)'} node on the map
                    </Typography>
                </Alert>
            )}

            <Container maxWidth="xl">
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>
                            PCMC WATER INTELLIGENCE
                        </Typography>
                        <Typography variant="h4" fontWeight={800}>
                            Officer Command Center
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Activity size={18} />}
                            onClick={() => setMaxFlowOpen(true)}
                        >
                            Capacity Analysis
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Plus size={18} />}
                            onClick={() => setConnectionPlannerOpen(true)}
                        >
                            New Connection
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<RefreshCw size={18} />}
                            onClick={fetchComplaints}
                        >
                            Refresh
                        </Button>
                    </Stack>
                </Box>

                {/* Stats Row */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ animation: 'fadeIn 0.5s ease-out 0.1s both' }}>
                        <StatCard
                            title="Active Issues"
                            value={stats.total}
                            icon={AlertTriangle}
                            color="#3b82f6"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ animation: 'fadeIn 0.5s ease-out 0.2s both' }}>
                        <StatCard
                            title="Critical"
                            value={stats.critical}
                            icon={AlertCircle}
                            color="#dc2626"
                            onClick={() => setActiveTab(0)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ animation: 'fadeIn 0.5s ease-out 0.3s both' }}>
                        <StatCard
                            title="Correlated Clusters"
                            value={stats.correlatedClusters}
                            icon={Activity}
                            color="#f59e0b"
                            onClick={() => setActiveTab(2)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ animation: 'fadeIn 0.5s ease-out 0.4s both' }}>
                        <StatCard
                            title="Resolved Today"
                            value={stats.resolved}
                            icon={CheckCircle2}
                            color="#22c55e"
                        />
                    </Grid>
                </Grid>

                {/* Critical Alerts Banner */}
                {prioritized.critical.length > 0 && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            border: '2px solid #dc2626',
                            animation: 'pulse 2s infinite',
                            animationFillMode: 'both'
                        }}
                    >
                        <AlertTitle sx={{ fontWeight: 700 }}>
                            🚨 {prioritized.critical.length} CRITICAL ISSUE{prioritized.critical.length > 1 ? 'S' : ''} REQUIRE IMMEDIATE ATTENTION
                        </AlertTitle>
                        {prioritized.critical.slice(0, 2).map(c => (
                            <Typography key={c.id} variant="body2">
                                • #{c.id}: {c.category} - {c.area || 'Unknown Area'}
                            </Typography>
                        ))}
                    </Alert>
                )}

                {/* Main Content */}
                <Grid container spacing={3}>
                    {/* Left: Map with Layer Controls */}
                    <Grid size={{ xs: 12, lg: (selectedComplaint || selectedCluster) ? 6 : 8 }}>
                        {/* Layer Controls */}
                        <Paper sx={{ p: 1.5, mb: 1, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                                <Typography variant="caption" fontWeight={700} sx={{ mr: 2 }}>
                                    LAYERS:
                                </Typography>
                                <Stack direction="row" spacing={0} flexWrap="wrap">
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={layerVisibility.pipelines}
                                                onChange={(e) => setLayerVisibility(prev => ({ ...prev, pipelines: e.target.checked }))}
                                                sx={{ p: 0.5 }}
                                            />
                                        }
                                        label={<Typography variant="caption">Pipelines</Typography>}
                                        sx={{ mr: 1 }}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={layerVisibility.reservoirs}
                                                onChange={(e) => setLayerVisibility(prev => ({ ...prev, reservoirs: e.target.checked }))}
                                                sx={{ p: 0.5, color: '#0ea5e9', '&.Mui-checked': { color: '#0ea5e9' } }}
                                            />
                                        }
                                        label={<Typography variant="caption">WTP</Typography>}
                                        sx={{ mr: 1 }}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={layerVisibility.esrs}
                                                onChange={(e) => setLayerVisibility(prev => ({ ...prev, esrs: e.target.checked }))}
                                                sx={{ p: 0.5, color: '#6366f1', '&.Mui-checked': { color: '#6366f1' } }}
                                            />
                                        }
                                        label={<Typography variant="caption">ESR</Typography>}
                                        sx={{ mr: 1 }}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={layerVisibility.pumps}
                                                onChange={(e) => setLayerVisibility(prev => ({ ...prev, pumps: e.target.checked }))}
                                                sx={{ p: 0.5, color: '#f59e0b', '&.Mui-checked': { color: '#f59e0b' } }}
                                            />
                                        }
                                        label={<Typography variant="caption">Pumps</Typography>}
                                        sx={{ mr: 1 }}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={layerVisibility.junctions}
                                                onChange={(e) => setLayerVisibility(prev => ({ ...prev, junctions: e.target.checked }))}
                                                sx={{ p: 0.5, color: '#10b981', '&.Mui-checked': { color: '#10b981' } }}
                                            />
                                        }
                                        label={<Typography variant="caption">Junctions</Typography>}
                                        sx={{ mr: 1 }}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={layerVisibility.valves}
                                                onChange={(e) => setLayerVisibility(prev => ({ ...prev, valves: e.target.checked }))}
                                                sx={{ p: 0.5, color: '#ef4444', '&.Mui-checked': { color: '#ef4444' } }}
                                            />
                                        }
                                        label={<Typography variant="caption">Valves</Typography>}
                                        sx={{ mr: 1 }}
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={layerVisibility.complaints}
                                                onChange={(e) => setLayerVisibility(prev => ({ ...prev, complaints: e.target.checked }))}
                                                sx={{ p: 0.5 }}
                                            />
                                        }
                                        label={<Typography variant="caption">Complaints</Typography>}
                                    />
                                </Stack>
                            </Box>
                        </Paper>

                        <Paper
                            sx={{
                                height: '550px',
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            <PipelineMap
                                complaints={prioritized.all}
                                clusters={clusters}
                                selectedComplaint={selectedComplaint}
                                selectedCluster={selectedCluster}
                                onComplaintSelect={handleComplaintSelect}
                                showPipelines={showPipelines}
                                plannedConnections={plannedConnections}
                                pipelineData={pipelineData}
                                bottlenecks={bottlenecks}
                                layerVisibility={layerVisibility}
                                isPickingLocation={isPickingLocation}
                                onMapClick={handleMapClick}
                                newConnectionTarget={newConnectionTarget}
                                // Add handler for cluster selection
                                onClusterSelect={handleClusterSelect}
                                onDeleteConnection={handleDeleteConnection}
                                pickingMode={!!maxFlowPickingMode}
                                onNodePick={handleNodePick}
                            />
                        </Paper>
                    </Grid>

                    {/* Middle: Issue List */}
                    <Grid size={{ xs: 12, lg: (selectedComplaint || selectedCluster) ? 3 : 4 }}>
                        <Paper sx={{ height: '600px', borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs
                                    value={activeTab}
                                    onChange={(e, v) => setActiveTab(v)}
                                    variant="fullWidth"
                                >
                                    <Tab
                                        label={
                                            <Badge badgeContent={prioritized.critical.length} color="error">
                                                Critical
                                            </Badge>
                                        }
                                    />
                                    <Tab label="All Issues" />
                                    <Tab
                                        label={
                                            <Badge badgeContent={clusters.filter(c => c.complaints.length > 1).length} color="warning">
                                                Clusters
                                            </Badge>
                                        }
                                    />
                                </Tabs>
                            </Box>

                            <Box sx={{ height: 'calc(100% - 48px)', overflow: 'auto' }}>
                                {activeTab === 0 && (
                                    // Critical Issues
                                    prioritized.critical.length === 0 ? (
                                        <Box sx={{ p: 3, textAlign: 'center' }}>
                                            <CheckCircle2 size={48} color="#22c55e" />
                                            <Typography variant="body1" sx={{ mt: 2 }}>
                                                No critical issues! 🎉
                                            </Typography>
                                        </Box>
                                    ) : (
                                        prioritized.critical.map(complaint => (
                                            <Box
                                                key={complaint.id}
                                                onClick={() => handleComplaintSelect(complaint)}
                                                sx={{
                                                    p: 2,
                                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                                    cursor: 'pointer',
                                                    bgcolor: selectedComplaint?.id === complaint.id ? 'action.selected' : 'transparent',
                                                    borderLeft: `4px solid ${SEVERITY_COLORS.CRITICAL}`,
                                                    '&:hover': { bgcolor: 'action.hover' },
                                                }}
                                            >
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                                    <Typography variant="caption" fontWeight={700} color="error">
                                                        #{complaint.id} • {complaint.category}
                                                    </Typography>
                                                    <Chip label="CRITICAL" size="small" color="error" sx={{ height: 18, fontSize: '10px' }} />
                                                </Box>
                                                <Typography variant="body2" noWrap>
                                                    {complaint.description?.substring(0, 60)}...
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {complaint.area} • {new Date(complaint.created_at).toLocaleTimeString()}
                                                </Typography>
                                            </Box>
                                        ))
                                    )
                                )}

                                {activeTab === 1 && (
                                    // All Issues (sorted)
                                    prioritized.all.map(complaint => (
                                        <Box
                                            key={complaint.id}
                                            onClick={() => handleComplaintSelect(complaint)}
                                            sx={{
                                                p: 2,
                                                borderBottom: `1px solid ${theme.palette.divider}`,
                                                cursor: 'pointer',
                                                bgcolor: selectedComplaint?.id === complaint.id ? 'action.selected' : 'transparent',
                                                borderLeft: `4px solid ${SEVERITY_COLORS[complaint.severity] || SEVERITY_COLORS.MEDIUM}`,
                                                '&:hover': { bgcolor: 'action.hover' },
                                            }}
                                        >
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                                <Typography variant="caption" fontWeight={700}>
                                                    #{complaint.id} • {complaint.category}
                                                </Typography>
                                                <PriorityBadge severity={complaint.severity} />
                                            </Box>
                                            <Typography variant="body2" noWrap>
                                                {complaint.description?.substring(0, 60)}...
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {complaint.area}
                                            </Typography>
                                        </Box>
                                    ))
                                )}

                                {activeTab === 2 && (
                                    // Correlated Clusters
                                    clusters.filter(c => c.complaints.length > 1).length === 0 ? (
                                        <Box sx={{ p: 3, textAlign: 'center' }}>
                                            <Activity size={48} color="#22c55e" />
                                            <Typography variant="body1" sx={{ mt: 2 }}>
                                                No correlated clusters found
                                            </Typography>
                                        </Box>
                                    ) : (
                                        clusters.filter(c => c.complaints.length > 1).map(cluster => (
                                            <Box
                                                key={cluster.id}
                                                onClick={() => handleClusterSelect(cluster)}
                                                sx={{
                                                    p: 2,
                                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                                    cursor: 'pointer',
                                                    borderLeft: `4px solid ${cluster.correlationType === 'LEAKAGE_CONTAMINATION' ? '#dc2626' :
                                                        cluster.correlationType === 'WIDESPREAD_CONTAMINATION' ? '#f59e0b' : '#3b82f6'
                                                        }`,
                                                    bgcolor: selectedCluster?.id === cluster.id ? 'action.selected' : 'transparent',
                                                    '&:hover': { bgcolor: 'action.hover' },
                                                }}
                                            >
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                        ⚠️ {cluster.title}
                                                    </Typography>
                                                    <Chip
                                                        label={`${cluster.complaints.length} issues`}
                                                        size="small"
                                                        sx={{ height: 18, fontSize: '10px' }}
                                                    />
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    {cluster.recommendation}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                    {Array.from(cluster.categories).map(cat => (
                                                        <Chip
                                                            key={cat}
                                                            label={cat}
                                                            size="small"
                                                            sx={{
                                                                height: 18,
                                                                fontSize: '9px',
                                                                bgcolor: `${CATEGORY_COLORS[cat]}15`,
                                                                color: CATEGORY_COLORS[cat],
                                                                border: `1px solid ${CATEGORY_COLORS[cat]}30`,
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={cluster.riskScore}
                                                    color={cluster.riskScore > 70 ? 'error' : cluster.riskScore > 40 ? 'warning' : 'primary'}
                                                    sx={{ mt: 1, height: 4, borderRadius: 2 }}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    Risk Score: {cluster.riskScore}%
                                                </Typography>
                                            </Box>
                                        ))
                                    )
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Right: Issue or Cluster Details (conditional) */}
                    {(selectedComplaint || selectedCluster) && (
                        <Grid size={{ xs: 12, lg: 3 }}>
                            <Box sx={{ height: '600px' }}>
                                {selectedComplaint && (
                                    <IssueDetailPanel
                                        complaint={selectedComplaint}
                                        onClose={() => setSelectedComplaint(null)}
                                        allComplaints={complaints}
                                        onResolve={handleResolve}
                                    />
                                )}
                                {selectedCluster && (
                                    <ClusterDetailPanel
                                        cluster={selectedCluster}
                                        onClose={() => setSelectedCluster(null)}
                                        onSelectComplaint={handleComplaintSelect}
                                        onResolve={handleResolve}
                                    />
                                )}
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Container>

            {/* New Connection Planner Dialog */}
            <NewConnectionPlanner
                isOpen={connectionPlannerOpen}
                onClose={() => setConnectionPlannerOpen(false)}
                onPlanRoute={handlePlanRoute}
                targetCoords={newConnectionTarget}
                onPickLocation={handlePickLocation}
                existingConnections={plannedConnections}
                onDeleteConnection={handleDeleteConnection}
            />

            {/* Max Flow Analysis Dialog */}
            <MaxFlowAnalysisDialog
                isOpen={maxFlowOpen}
                onClose={() => setMaxFlowOpen(false)}
                pipelineData={pipelineData}
                onResultsFound={(b) => setBottlenecks(b)}
                pickingMode={maxFlowPickingMode}
                setPickingMode={setMaxFlowPickingMode}
            />

            {/* CSS for custom animations */}
            <style>{`
                .custom-marker {
                    background: transparent;
                    border: none;
                }
                
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }

                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
                    70% { transform: scale(1.01); box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </Box>
    );
};

export default WaterIntelligenceDashboard;
