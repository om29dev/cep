import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Avatar, Grid, Button, useTheme, TextField, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../AuthContext';
import { User, Mail, Shield, BadgeCheck, Phone, MapPin, CreditCard, Save, X, Edit2 } from 'lucide-react';
import axios from 'axios';

// Moved outside to prevent re-creation on every render (fixes focus loss issue)
const ProfileField = ({ icon: Icon, label, value, name, isEditable, isEditing, formData, handleChange, theme, isDark }) => (
    <Box
        sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Box
                sx={{
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: `${theme.palette.primary.main}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Icon size={20} color={theme.palette.primary.main} />
            </Box>
            <Typography
                variant="body2"
                sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                }}
            >
                {label}
            </Typography>
        </Box>

        {isEditing && isEditable ? (
            <TextField
                fullWidth
                size="medium"
                name={name}
                value={formData[name]}
                onChange={handleChange}
                variant="outlined"
                placeholder={`Enter ${label.toLowerCase()}`}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                    }
                }}
            />
        ) : (
            <Typography
                variant="h6"
                sx={{
                    fontWeight: 600,
                    color: value ? theme.palette.text.primary : theme.palette.text.disabled,
                    pl: 0.5
                }}
            >
                {value || 'Not Provided'}
            </Typography>
        )}
    </Box>
);

const Profile = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        user_ward: '',
        user_area: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.full_name || '',
                phone: user.phone || '',
                user_ward: user.user_ward || '',
                user_area: user.user_area || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        setMsg(null);
        try {
            await axios.put('/api/profile', formData);
            window.location.reload();
        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Box sx={{ py: 6, minHeight: '100vh' }}>
            <Container maxWidth="md">

                {/* Header Card */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 4,
                        background: isDark
                            ? 'linear-gradient(135deg, rgba(0,210,255,0.1) 0%, rgba(157,80,187,0.1) 100%)'
                            : 'linear-gradient(135deg, rgba(0,210,255,0.15) 0%, rgba(157,80,187,0.1) 100%)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'center', sm: 'flex-start' },
                        gap: 3
                    }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: 'center',
                            gap: 3,
                            textAlign: { xs: 'center', sm: 'left' }
                        }}>
                            <Avatar
                                sx={{
                                    width: 90,
                                    height: 90,
                                    fontSize: '2.25rem',
                                    fontWeight: 700,
                                    bgcolor: theme.palette.primary.main,
                                    color: '#FFFFFF',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                                }}
                            >
                                {user.username[0].toUpperCase()}
                            </Avatar>

                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                                    {user.full_name || user.username}
                                </Typography>

                                <Box
                                    sx={{
                                        display: 'inline-block',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: 2,
                                        bgcolor: user.role === 'officer' ? theme.palette.secondary.main : theme.palette.primary.main,
                                        color: '#FFFFFF',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Account
                                </Box>
                            </Box>
                        </Box>

                        {!isEditing ? (
                            <Button
                                variant="contained"
                                startIcon={<Edit2 size={18} />}
                                onClick={() => setIsEditing(true)}
                                sx={{ flexShrink: 0 }}
                            >
                                Edit Profile
                            </Button>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<X size={18} />}
                                    onClick={() => setIsEditing(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
                                    onClick={handleSave}
                                    disabled={loading}
                                >
                                    Save
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Paper>

                {msg && (
                    <Alert severity={msg.type} sx={{ mb: 4, borderRadius: 3 }}>
                        {msg.text}
                    </Alert>
                )}

                {/* Personal Information Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 4,
                        bgcolor: isDark ? 'rgba(17, 34, 64, 0.6)' : '#FFFFFF',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            mb: 4,
                            color: theme.palette.primary.main
                        }}
                    >
                        Personal Information
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <ProfileField
                                icon={BadgeCheck}
                                label="Full Name"
                                value={isEditing ? formData.fullName : user.full_name}
                                name="fullName"
                                isEditable={true}
                                isEditing={isEditing}
                                formData={formData}
                                handleChange={handleChange}
                                theme={theme}
                                isDark={isDark}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <ProfileField
                                icon={Phone}
                                label="Phone Number"
                                value={isEditing ? formData.phone : user.phone}
                                name="phone"
                                isEditable={true}
                                isEditing={isEditing}
                                formData={formData}
                                handleChange={handleChange}
                                theme={theme}
                                isDark={isDark}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Location Details Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        mb: 4,
                        borderRadius: 4,
                        bgcolor: isDark ? 'rgba(17, 34, 64, 0.6)' : '#FFFFFF',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            mb: 4,
                            color: theme.palette.primary.main
                        }}
                    >
                        Location Details
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <ProfileField
                                icon={MapPin}
                                label="Ward"
                                value={isEditing ? formData.user_ward : user.user_ward}
                                name="user_ward"
                                isEditable={true}
                                isEditing={isEditing}
                                formData={formData}
                                handleChange={handleChange}
                                theme={theme}
                                isDark={isDark}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <ProfileField
                                icon={MapPin}
                                label="Area / Locality"
                                value={isEditing ? formData.user_area : user.user_area}
                                name="user_area"
                                isEditable={true}
                                isEditing={isEditing}
                                formData={formData}
                                handleChange={handleChange}
                                theme={theme}
                                isDark={isDark}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Account Details Section */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 4,
                        bgcolor: isDark ? 'rgba(17, 34, 64, 0.6)' : '#FFFFFF',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    }}
                >
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            mb: 4,
                            color: theme.palette.primary.main
                        }}
                    >
                        Account Details
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: `${theme.palette.text.secondary}15` }}>
                                        <User size={20} color={theme.palette.text.secondary} />
                                    </Box>
                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                                        Username
                                    </Typography>
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.secondary, pl: 0.5 }}>
                                    @{user.username}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: `${theme.palette.text.secondary}15` }}>
                                        <Mail size={20} color={theme.palette.text.secondary} />
                                    </Box>
                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                                        Email Address
                                    </Typography>
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.secondary, pl: 0.5, wordBreak: 'break-all' }}>
                                    {user.email}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: `${theme.palette.text.secondary}15` }}>
                                        <Shield size={20} color={theme.palette.text.secondary} />
                                    </Box>
                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                                        Role
                                    </Typography>
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.secondary, pl: 0.5, textTransform: 'capitalize' }}>
                                    {user.role}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

            </Container>
        </Box>
    );
};

export default Profile;