import React from 'react';
import { Box, Container, Paper, Typography, Avatar, Grid, Button, Divider, useTheme } from '@mui/material';
import { useAuth } from '../AuthContext';
import { User, Mail, Shield } from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();
    const theme = useTheme();

    if (!user) return null;

    return (
        <Box sx={{ py: 8, minHeight: '80vh' }}>
            <Container maxWidth="sm">
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 4,
                        border: `1px solid ${theme.palette.divider}`,
                        background: theme.palette.mode === 'dark' ? 'rgba(17, 34, 64, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(20px)'
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                        <Avatar
                            sx={{
                                width: 100,
                                height: 100,
                                bgcolor: 'primary.main',
                                fontSize: '2.5rem',
                                mb: 2,
                                border: '4px solid',
                                borderColor: 'background.paper',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                            }}
                        >
                            {user.username[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="h4" fontWeight={800} gutterBottom>
                            {user.username}
                        </Typography>
                        <Box sx={{
                            px: 2,
                            py: 0.5,
                            borderRadius: 10,
                            bgcolor: user.role === 'officer' ? 'secondary.main' : 'primary.main',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textTransform: 'capitalize'
                        }}>
                            {user.role} Account
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                                    <User size={24} color={theme.palette.primary.main} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Username</Typography>
                                    <Typography variant="body1" fontWeight={500}>{user.username}</Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                                    <Mail size={24} color={theme.palette.primary.main} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Email Address</Typography>
                                    <Typography variant="body1" fontWeight={500}>{user.email}</Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                                    <Shield size={24} color={theme.palette.primary.main} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Role</Typography>
                                    <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>{user.role}</Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </Box>
    );
};

export default Profile;