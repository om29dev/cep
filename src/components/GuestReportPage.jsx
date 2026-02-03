import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
    Box,
    Typography,
    Container,
    TextField,
    Button,
    Paper,
    IconButton,
    CircularProgress,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Divider,
    Alert,
    Snackbar,
    useTheme
} from '@mui/material';
import {
    MapPin,
    Map as MapIcon,
    Copy,
    Mail,
    CheckCircle2,
    X,
    FileText,
    User,
    AlertCircle,
    BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Map Click Listener Component
const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position ? <Marker position={position} icon={DefaultIcon} /> : null;
};

const GuestReportPage = () => {
    const theme = useTheme();
    const [issueDescription, setIssueDescription] = useState('');
    const [location, setLocation] = useState('');
    const [area, setArea] = useState('');
    const [ward, setWard] = useState('');
    const [officerInfo, setOfficerInfo] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, locating, loading, generating
    const [locationError, setLocationError] = useState(null);
    const [mapOpen, setMapOpen] = useState(false);
    const [tempPosition, setTempPosition] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [generatedLetter, setGeneratedLetter] = useState(''); // Store AI generated letter

    // Fetch area/ward from coordinates
    const fetchJurisdiction = async (lat, lon) => {
        try {
            console.log(`Fetching jurisdiction for ${lat}, ${lon}`);
            const response = await axios.get(`/api/gis/identify-area?lat=${lat}&lng=${lon}`);
            console.log("Jurisdiction response:", response.data);

            const { area: fetchedArea, ward: fetchedWard } = response.data;
            setArea(fetchedArea || 'Unknown Area');
            setWard(fetchedWard || 'General');
            setLocation(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);

            // Fetch officer for this area
            if (fetchedArea) {
                await fetchOfficerEmail(fetchedArea);
            }
        } catch (error) {
            console.error("Jurisdiction fetch error:", error);
            const errorMessage = error.response ? `Server Error: ${error.response.status}` : error.message;
            setSnackbar({
                open: true,
                message: `Failed to identify area: ${errorMessage}. Using default officer.`,
                severity: 'warning'
            });

            setArea("Unknown Area");
            setWard("General");
            setLocation(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
            // Use fallback officer
            await fetchOfficerEmail("Unknown");
        }
    };

    // Fetch officer email by area
    const fetchOfficerEmail = async (areaName) => {
        try {
            const response = await axios.get(`/api/guest/get-officer-email?area=${encodeURIComponent(areaName)}`);
            setOfficerInfo(response.data);
        } catch (error) {
            console.error("Officer lookup error:", error);
            setOfficerInfo({
                found: false,
                officerName: 'PCMC Water Department (Sarathi Helpline)',
                officerEmail: 'sarathi@pcmcindia.gov.in',
                officerPhone: '8888006666',
                area: areaName,
                message: 'No specific officer assigned to this area. Using official department contact.'
            });
        }
    };

    const handleGetLocation = () => {
        setStatus('locating');
        setLocationError(null);
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            setStatus('idle');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setTempPosition({ lat: latitude, lng: longitude });
                await fetchJurisdiction(latitude, longitude);
                setStatus('idle');
            },
            (error) => {
                setLocationError("Unable to retrieve location. Please use the map to select.");
                setStatus('idle');
            }
        );
    };

    const handleConfirmMapLocation = async () => {
        if (tempPosition) {
            setStatus('loading');
            await fetchJurisdiction(tempPosition.lat, tempPosition.lng);
            setStatus('idle');
        }
        setMapOpen(false);
    };

    // Generate the formal letter using AI
    const handleGenerateLetter = async () => {
        if (!issueDescription || issueDescription.length < 5) return;

        setStatus('generating');
        try {
            const response = await axios.post('/api/guest/generate-letter', {
                issue: issueDescription,
                location: location,
                area: area,
                officerName: officerInfo?.officerName,
                ward: ward
            });

            setGeneratedLetter(response.data.letter);
            setStatus('idle');
        } catch (error) {
            console.error("Letter generation error:", error);
            setSnackbar({ open: true, message: 'Failed to generate letter. Please try again.', severity: 'error' });
            setStatus('idle');
        }
    };

    const handleCopyLetter = async () => {
        try {
            await navigator.clipboard.writeText(generatedLetter);
            setSnackbar({ open: true, message: 'Letter copied to clipboard!', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to copy. Please select and copy manually.', severity: 'error' });
        }
    };

    const handleOpenEmail = () => {
        const subject = encodeURIComponent(`Water Issue Complaint - ${area} (Ward: ${ward})`);
        const body = encodeURIComponent(generatedLetter);
        const mailtoUrl = `mailto:${officerInfo?.officerEmail || 'water.complaints@pcmcindia.gov.in'}?subject=${subject}&body=${body}`;
        window.open(mailtoUrl, '_blank');
    };

    const actionButtonStyle = {
        flex: 1,
        height: 56,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
        color: theme.palette.text.primary,
        textTransform: 'none',
        display: 'flex',
        gap: 1.5,
        transition: 'all 0.3s ease',
        '&:hover': {
            background: 'rgba(0, 210, 255, 0.08)',
            borderColor: '#00D2FF',
            transform: 'translateY(-2px)'
        }
    };

    const inputStyles = {
        '& .MuiOutlinedInput-root': {
            background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            transition: 'all 0.3s ease',
            '& fieldset': { borderColor: theme.palette.divider },
            '&:hover fieldset': { borderColor: 'rgba(0, 210, 255, 0.5)' },
            '&.Mui-focused fieldset': { borderColor: '#00D2FF' },
        },
        '& .MuiInputLabel-root': {
            color: theme.palette.text.secondary,
            '&.Mui-focused': { color: '#00D2FF' }
        },
        '& .MuiOutlinedInput-input': { color: theme.palette.text.primary },
    };

    const isReadyToGenerate = location && issueDescription.trim().length > 10;
    const hasGenerated = generatedLetter && generatedLetter.length > 0;

    return (
        <Box sx={{ py: 12, minHeight: '100vh' }}>
            <Container maxWidth="md">
                {/* Header */}
                <Box sx={{ mb: 6, textAlign: 'center' }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 4, color: '#00D2FF' }}>
                        GUEST COMPLAINT PORTAL
                    </Typography>
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 900,
                            mb: 2,
                            fontSize: { xs: '2rem', md: '3rem' }
                        }}
                    >
                        Report an Issue <span style={{ color: '#00D2FF' }}>Anonymously</span>
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                        Describe your water issue and get a ready-made letter to email the concerned officer. No registration required.
                    </Typography>
                </Box>

                <Paper sx={{
                    p: { xs: 3, md: 5 },
                    borderRadius: 6,
                    background: theme.palette.mode === 'dark' ? 'rgba(17, 34, 64, 0.4)' : 'rgba(255, 255, 255, 0.8)',
                    border: `1px solid ${theme.palette.divider}`,
                    backdropFilter: 'blur(20px)'
                }}>
                    {/* Step 1: Location */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MapPin size={18} color="#00D2FF" /> STEP 1: SELECT YOUR LOCATION
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button sx={actionButtonStyle} onClick={handleGetLocation} disabled={status === 'locating'}>
                                {status === 'locating' ? <CircularProgress size={20} color="inherit" /> : <MapPin size={20} color="#00D2FF" />}
                                Auto-GPS
                            </Button>
                            <Button sx={actionButtonStyle} onClick={() => setMapOpen(true)}>
                                <MapIcon size={20} color="#9D50BB" />
                                Pick on Map
                            </Button>
                        </Stack>

                        <AnimatePresence>
                            {location && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16 }}>
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        <Chip
                                            icon={<CheckCircle2 size={14} />}
                                            label={`Area: ${area} (Ward: ${ward})`}
                                            size="small"
                                            sx={{ borderRadius: '6px', background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', border: '1px solid rgba(76, 175, 80, 0.3)' }}
                                        />
                                        <Chip
                                            label={`GPS: ${location}`}
                                            size="small"
                                            sx={{ borderRadius: '6px', background: 'rgba(0, 210, 255, 0.1)', color: '#00D2FF', border: '1px solid rgba(0, 210, 255, 0.2)' }}
                                        />
                                    </Stack>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {locationError && (
                            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#ff4d4d' }}>
                                {locationError}
                            </Typography>
                        )}
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Step 2: Describe Issue */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AlertCircle size={18} color="#00D2FF" /> STEP 2: DESCRIBE YOUR ISSUE
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Issue Description"
                            value={issueDescription}
                            onChange={(e) => setIssueDescription(e.target.value)}
                            placeholder="Describe the water issue in detail (e.g., 'No water supply for 3 days', 'Contaminated water with bad smell', 'Water leakage from main pipe')..."
                            sx={inputStyles}
                        />
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Officer Info */}
                    {officerInfo && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <User size={18} color="#00D2FF" /> OFFICER DETAILS
                            </Typography>
                            <Paper elevation={0} sx={{
                                p: 2,
                                borderRadius: 3,
                                background: officerInfo.found ? 'rgba(76, 175, 80, 0.05)' : 'rgba(255, 152, 0, 0.05)',
                                border: `1px solid ${officerInfo.found ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)'}`
                            }}>
                                <Typography variant="body1" fontWeight={600}>{officerInfo.officerName}</Typography>
                                <Typography variant="body2" color="primary" sx={{ fontFamily: 'monospace' }}>
                                    {officerInfo.officerEmail}
                                </Typography>
                                {officerInfo.message && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        ℹ️ {officerInfo.message}
                                    </Typography>
                                )}
                            </Paper>
                        </Box>
                    )}

                    <Divider sx={{ my: 3 }} />

                    {/* Step 3: Generated Letter */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FileText size={18} color="#00D2FF" /> STEP 3: YOUR READY-MADE LETTER
                        </Typography>

                        {!isReadyToGenerate ? (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                Please select your location and describe your issue (at least 10 characters) to generate the letter.
                            </Alert>
                        ) : (
                            <>
                                {!hasGenerated ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<BrainCircuit size={20} />}
                                            onClick={handleGenerateLetter}
                                            disabled={status === 'generating'}
                                            sx={{
                                                borderRadius: 3,
                                                background: 'linear-gradient(45deg, #9D50BB 30%, #6E48AA 90%)',
                                                color: '#FFFFFF',
                                                fontWeight: 800,
                                                px: 4,
                                                py: 1.5,
                                                boxShadow: '0 4px 14px 0 rgba(157, 80, 187, 0.5)'
                                            }}
                                        >
                                            {status === 'generating' ? 'Writing Letter...' : 'Generate Letter with AI'}
                                        </Button>
                                        <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                                            Polite & professional format • Ready to send
                                        </Typography>
                                    </Box>
                                ) : (
                                    <TextField
                                        fullWidth
                                        multiline
                                        value={generatedLetter}
                                        onChange={(e) => setGeneratedLetter(e.target.value)}
                                        sx={{
                                            ...inputStyles,
                                            '& .MuiOutlinedInput-root': {
                                                fontFamily: 'Georgia, serif',
                                                fontSize: '0.95rem',
                                                lineHeight: 1.6,
                                                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                            }
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </Box>

                    {/* Action Buttons */}
                    {hasGenerated && (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<Copy size={20} />}
                                onClick={handleCopyLetter}
                                sx={{
                                    flex: 1,
                                    height: 56,
                                    borderRadius: 3,
                                    borderColor: '#00D2FF',
                                    color: '#00D2FF',
                                    fontWeight: 700,
                                    '&:hover': {
                                        borderColor: '#00D2FF',
                                        background: 'rgba(0, 210, 255, 0.1)'
                                    }
                                }}
                            >
                                Copy Letter
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Mail size={20} />}
                                onClick={handleOpenEmail}
                                sx={{
                                    flex: 1,
                                    height: 56,
                                    borderRadius: 3,
                                    background: 'linear-gradient(45deg, #00D2FF 30%, #3A7BD5 90%)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '1rem'
                                }}
                            >
                                Send via Email
                            </Button>
                        </Stack>
                    )}
                </Paper>
            </Container>

            {/* Map Dialog */}
            <Dialog open={mapOpen} onClose={() => setMapOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { background: theme.palette.mode === 'dark' ? '#0a192f' : '#fff', borderRadius: 4 } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={800}>Pick Your Location</Typography>
                    <IconButton onClick={() => setMapOpen(false)}><X /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, height: '400px' }}>
                    <MapContainer center={tempPosition || [18.6261, 73.8122]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url={theme.palette.mode === 'dark'
                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        } />
                        <LocationMarker position={tempPosition} setPosition={setTempPosition} />
                    </MapContainer>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setMapOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleConfirmMapLocation} variant="contained" disabled={!tempPosition} sx={{ background: '#00D2FF', fontWeight: 700 }}>
                        Confirm Location
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default GuestReportPage;
