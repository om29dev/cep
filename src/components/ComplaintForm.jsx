import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
    Box,
    Typography,
    Container,
    TextField,
    Button,
    MenuItem,
    Grid,
    Paper,
    IconButton,
    CircularProgress,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    useTheme,
    Chip
} from '@mui/material';
import { Send, MapPin, Camera, X, CheckCircle2, Map as MapIcon, ImagePlus } from 'lucide-react';
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

const ComplaintForm = () => {
    const theme = useTheme();
    const [formData, setFormData] = useState({
        location: '',
        description: '',
        images: [],
        district: ''
    });
    const [status, setStatus] = useState('idle'); // idle, locating, submitting, success
    const [locationError, setLocationError] = useState(null);
    const [mapOpen, setMapOpen] = useState(false);
    const [tempPosition, setTempPosition] = useState(null);
    const fileInputRef = useRef(null);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const fetchJurisdiction = async (lat, lon) => {
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
                { withCredentials: false }
            );
            const address = response.data.address;

            // Strict Area/District Extraction
            const areaName = address.city_district || address.district || address.city || address.town || address.county || 'Unknown Area';

            setFormData(prev => ({
                ...prev,
                location: `${lat}, ${lon}`,
                // Store the name in 'district' just for UI display as "Area"
                district: areaName
            }));
        } catch (error) {
            console.error("Jurisdiction fetch error:", error);
            setFormData(prev => ({
                ...prev,
                location: `${lat}, ${lon}`,
                district: "Unknown Area"
            }));
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
                // Save Lat/Long to DB, not text
                const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                setFormData(prev => ({ ...prev, location: coords }));
                setTempPosition({ lat: latitude, lng: longitude });

                await fetchJurisdiction(latitude, longitude);
                setStatus('idle');
            },
            (error) => {
                setLocationError("Unable to retrieve location automatically.");
                setStatus('idle');
            }
        );
    };

    const handleConfirmMapLocation = async () => {
        if (tempPosition) {
            const coords = `${tempPosition.lat.toFixed(6)}, ${tempPosition.lng.toFixed(6)}`;
            setFormData(prev => ({ ...prev, location: coords }));
            await fetchJurisdiction(tempPosition.lat, tempPosition.lng);
        }
        setMapOpen(false);
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, { preview: reader.result, file: file }]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.location) {
            setLocationError("Please select a location using GPS or Map.");
            return;
        }
        setStatus('submitting');

        try {
            const data = new FormData();
            data.append('location', formData.location);
            data.append('description', formData.description);
            data.append('district', formData.district);
            formData.images.forEach(img => {
                data.append('images', img.file);
            });

            const response = await axios.post('/api/complaints', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 201) {
                setStatus('success');
                setFormData({
                    location: '',
                    description: '',
                    images: [],
                    district: ''
                });
                setTempPosition(null);
            } else {
                setStatus('idle');
                alert('Submission failed. Please check if the server is running.');
            }
        } catch (err) {
            console.error(err);
            setStatus('idle');
            alert(err.response?.data?.error || 'Error connecting to server.');
        }
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
        '& .MuiSelect-icon': { color: theme.palette.text.secondary },
    };

    return (
        <Box id="report-issue" sx={{ py: 12, position: 'relative' }}>
            <Container maxWidth="md">
                <Box sx={{ mb: 6, textAlign: 'center' }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: 4, color: '#00D2FF' }}>
                        SECURE CITIZEN PORTAL
                    </Typography>
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 900,
                            mb: 2,
                            fontSize: { xs: '2.5rem', md: '3.75rem' }
                        }}
                    >
                        Log A Crisis <span style={{ color: '#00D2FF' }}>Report</span>
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Immutable intelligence for rapid municipal response.
                    </Typography>
                </Box>

                <Paper sx={{
                    p: { xs: 3, md: 6 },
                    borderRadius: 6,
                    background: theme.palette.mode === 'dark' ? 'rgba(17, 34, 64, 0.4)' : 'rgba(255, 255, 255, 0.8)',
                    border: `1px solid ${theme.palette.divider}`,
                    backdropFilter: 'blur(20px)'
                }}>
                    <AnimatePresence mode="wait">
                        {status === 'success' ? (
                            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', py: 5 }}>
                                <CheckCircle2 size={80} color="#4caf50" style={{ marginBottom: 20 }} />
                                <Typography variant="h4" fontWeight={800} gutterBottom>Report Verified</Typography>
                                <Typography color="text.secondary" mb={4}>Your report has been successfully added to the blockchain grid.</Typography>
                                <Button variant="outlined" onClick={() => setStatus('idle')}>Submit New Report</Button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <Grid container spacing={4}>
                                    {/* Row 1: AI Analysis Indicator (Replacing Manual Category) */}
                                    <Grid size={{ xs: 12 }}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                borderRadius: 3,
                                                background: 'rgba(0, 210, 255, 0.05)',
                                                border: '1px solid rgba(0, 210, 255, 0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2
                                            }}
                                        >
                                            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <CircularProgress
                                                    variant="determinate"
                                                    value={100}
                                                    size={40}
                                                    thickness={4}
                                                    sx={{ color: 'rgba(0, 210, 255, 0.2)' }}
                                                />
                                                <CircularProgress
                                                    variant="indeterminate"
                                                    disableShrink
                                                    size={40}
                                                    thickness={4}
                                                    sx={{ color: '#00D2FF', position: 'absolute', left: 0, animationDuration: '3s' }}
                                                />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#00D2FF' }}>
                                                    AUTOMATION & BLOCKCHAIN ACTIVE
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Our secure system will automatically analyze your description to categorize the issue. Records are hashed and immutable.
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    {/* Row 2: Location and Photo Actions */}
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
                                            DATA ACQUISITION
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
                                            <Button sx={actionButtonStyle} onClick={() => fileInputRef.current?.click()}>
                                                <ImagePlus size={20} color="#00D2FF" />
                                                Add Evidence
                                            </Button>
                                        </Stack>

                                        {/* Jurisdiction Dashboard Chips */}
                                        <AnimatePresence>
                                            {formData.location && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    style={{ marginTop: 16 }}
                                                >
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                                                        <Chip
                                                            label={`Area: ${formData.district || 'Detecting...'}`}
                                                            size="small"
                                                            sx={{ borderRadius: '6px', background: 'rgba(0, 210, 255, 0.1)', color: '#00D2FF', border: '1px solid rgba(0, 210, 255, 0.2)' }}
                                                        />
                                                    </Stack>
                                                    <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: '#4caf50', fontWeight: 600 }}>
                                                        <CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                                        GPS LOCK: {formData.location}
                                                    </Typography>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        {locationError && (
                                            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#ff4d4d' }}>
                                                {locationError}
                                            </Typography>
                                        )}
                                    </Grid>

                                    {/* Row 3: Description */}
                                    <Grid size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={4}
                                            label="Incident Description"
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="Describe the issue in detail (e.g., 'No water supply in Ward 4 for 3 days'). The system will categorize this automatically."
                                            required
                                            sx={inputStyles}
                                        />
                                    </Grid>

                                    {/* Image List (Evidence) */}
                                    {formData.images.length > 0 && (
                                        <Grid size={{ xs: 12 }}>
                                            <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                                                {formData.images.map((img, index) => (
                                                    <Box key={index} sx={{ position: 'relative', flexShrink: 0 }}>
                                                        <Box sx={{ width: 80, height: 80, borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                                                            <img src={img.preview} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </Box>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => removeImage(index)}
                                                            sx={{ position: 'absolute', top: -8, right: -8, background: '#ff4d4d', color: 'white', '&:hover': { background: '#ff1a1a' }, width: 20, height: 20 }}
                                                        >
                                                            <X size={12} />
                                                        </IconButton>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Grid>
                                    )}

                                    <Grid size={{ xs: 12 }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            fullWidth
                                            size="large"
                                            startIcon={status === 'submitting' ? <CircularProgress size={20} color="inherit" /> : <Send />}
                                            sx={{
                                                height: 60,
                                                borderRadius: 3,
                                                background: 'linear-gradient(45deg, #00D2FF 30%, #3A7BD5 90%)',
                                                color: '#FFFFFF', // Ensure white text
                                                fontWeight: 800,
                                                fontSize: '1.1rem'
                                            }}
                                        >
                                            {status === 'submitting' ? 'HASHING & SUBMITTING...' : 'SECURELY SUBMIT REPORT'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </form>
                        )}
                    </AnimatePresence>
                </Paper>
            </Container>

            <Dialog open={mapOpen} onClose={() => setMapOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { background: '#0a192f', borderRadius: 4 } }}>
                <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={800}>Pick Issue Location</Typography>
                    <IconButton onClick={() => setMapOpen(false)} sx={{ color: 'white' }}><X /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, height: '400px' }}>
                    <MapContainer center={tempPosition || [19.0760, 72.8777]} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url={theme.palette.mode === 'dark'
                            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        } />
                        <LocationMarker position={tempPosition} setPosition={setTempPosition} />
                    </MapContainer>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setMapOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleConfirmMapLocation} variant="contained" disabled={!tempPosition} sx={{ background: '#00D2FF', fontWeight: 700 }}>Confirm</Button>
                </DialogActions>
            </Dialog>

            <input type="file" ref={fileInputRef} hidden accept="image/*" multiple onChange={handleImageUpload} />
        </Box >
    );
};

export default ComplaintForm;
