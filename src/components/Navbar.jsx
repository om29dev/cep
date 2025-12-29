import React, { useState, useContext } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Container,
    IconButton,
    Drawer,
    List,
    ListItem,
    useTheme,
    Avatar
} from '@mui/material';
import { Menu as MenuIcon, Droplets, Sun, Moon, LogOut, ListChecks, LayoutDashboard, PlusCircle } from 'lucide-react';
import { ColorModeContext } from '../ColorModeContext';
import { useAuth } from '../AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            <AppBar position="sticky" elevation={0} sx={{
                background: theme.palette.mode === 'dark' ? 'rgba(10, 25, 47, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: `1px solid ${theme.palette.divider}`,
                zIndex: theme.zIndex.drawer + 1
            }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ height: 80 }}>
                        <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, textDecoration: 'none' }}>
                            <Droplets size={32} color="#00D2FF" style={{ marginRight: 12 }} />
                            <Typography
                                variant="h6"
                                component="div"
                                sx={{
                                    fontFamily: 'Outfit',
                                    fontWeight: 800,
                                    background: 'linear-gradient(45deg, #00D2FF 30%, #9D50BB 90%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontSize: '1.5rem'
                                }}
                            >
                                UIIS
                            </Typography>
                        </Box>

                        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
                            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                                {theme.palette.mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </IconButton>

                            {user ? (
                                <>
                                    {/* ROLE BASED NAVIGATION */}

                                    {/* 1. Officer sees Dashboard */}
                                    {user.role === 'officer' && (
                                        <Button
                                            component={RouterLink}
                                            to="/dashboard"
                                            startIcon={<LayoutDashboard size={18} />}
                                            color="inherit"
                                            sx={{ textTransform: 'none', fontWeight: 600 }}
                                        >
                                            Officer Dashboard
                                        </Button>
                                    )}

                                    {/* 2. Citizen sees "My Issues" and "Report" */}
                                    {user.role === 'citizen' && (
                                        <>
                                            <Button
                                                component={RouterLink}
                                                to="/my-complaints"
                                                startIcon={<ListChecks size={18} />}
                                                color="inherit"
                                                sx={{ textTransform: 'none', fontWeight: 600 }}
                                            >
                                                My Issues
                                            </Button>

                                            <Button
                                                component={RouterLink}
                                                to="/report"
                                                variant="contained"
                                                startIcon={<PlusCircle size={18} />}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: 2,
                                                    fontWeight: 700,
                                                    background: 'linear-gradient(45deg, #00D2FF 30%, #3A7BD5 90%)',
                                                }}
                                            >
                                                Report Issue
                                            </Button>
                                        </>
                                    )}

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, borderLeft: `1px solid ${theme.palette.divider}`, pl: 2 }}>
                                        <Box
                                            component={RouterLink}
                                            to="/profile"
                                            sx={{ textDecoration: 'none' }}
                                        >
                                            <Avatar
                                                sx={{
                                                    width: 36,
                                                    height: 36,
                                                    bgcolor: 'primary.main',
                                                    fontSize: '1rem',
                                                    cursor: 'pointer',
                                                    border: `2px solid ${theme.palette.background.paper}`
                                                }}
                                            >
                                                {user.username[0].toUpperCase()}
                                            </Avatar>
                                        </Box>
                                        <IconButton onClick={handleLogout} color="error" size="small" title="Logout">
                                            <LogOut size={20} />
                                        </IconButton>
                                    </Box>
                                </>
                            ) : (
                                <Box sx={{ display: 'flex', gap: 1, ml: 1 }}>
                                    <Button component={RouterLink} to="/login" variant="outlined" sx={{ borderRadius: 2 }}>
                                        Login
                                    </Button>
                                    <Button component={RouterLink} to="/register" variant="contained" sx={{ borderRadius: 2 }}>
                                        Register
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ display: { md: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                    </Toolbar>
                </Container>
            </AppBar>

            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280, background: theme.palette.background.paper },
                }}
            >
                <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontFamily: 'Outfit', fontWeight: 800 }}>
                        UIIS
                    </Typography>
                    <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <ListItem disablePadding sx={{ justifyContent: 'center', mb: 2 }}>
                            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                                {theme.palette.mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </IconButton>
                        </ListItem>

                        {user ? (
                            <>
                                {user.role === 'officer' && (
                                    <ListItem disablePadding>
                                        <Button
                                            fullWidth
                                            component={RouterLink}
                                            to="/dashboard"
                                            onClick={handleDrawerToggle}
                                            startIcon={<LayoutDashboard size={18} />}
                                            sx={{ justifyContent: 'flex-start', px: 2, py: 1.5 }}
                                        >
                                            Officer Dashboard
                                        </Button>
                                    </ListItem>
                                )}

                                {user.role === 'citizen' && (
                                    <>
                                        <ListItem disablePadding>
                                            <Button
                                                fullWidth
                                                component={RouterLink}
                                                to="/my-complaints"
                                                onClick={handleDrawerToggle}
                                                startIcon={<ListChecks size={18} />}
                                                sx={{ justifyContent: 'flex-start', px: 2, py: 1.5 }}
                                            >
                                                My Issues
                                            </Button>
                                        </ListItem>
                                        <ListItem disablePadding>
                                            <Button
                                                fullWidth
                                                component={RouterLink}
                                                to="/report"
                                                onClick={handleDrawerToggle}
                                                startIcon={<PlusCircle size={18} />}
                                                sx={{ justifyContent: 'flex-start', px: 2, py: 1.5, color: theme.palette.primary.main }}
                                            >
                                                Report Issue
                                            </Button>
                                        </ListItem>
                                    </>
                                )}

                                <ListItem disablePadding>
                                    <Button
                                        fullWidth
                                        component={RouterLink}
                                        to="/profile"
                                        onClick={handleDrawerToggle}
                                        sx={{ justifyContent: 'flex-start', px: 2, py: 1.5 }}
                                    >
                                        My Profile
                                    </Button>
                                </ListItem>
                                <ListItem disablePadding sx={{ mt: 2 }}>
                                    <Button
                                        fullWidth
                                        onClick={() => { handleLogout(); handleDrawerToggle(); }}
                                        color="error"
                                        variant="outlined"
                                    >
                                        Logout
                                    </Button>
                                </ListItem>
                            </>
                        ) : (
                            <>
                                <ListItem disablePadding sx={{ mt: 2 }}>
                                    <Button fullWidth component={RouterLink} to="/login" onClick={handleDrawerToggle} variant="outlined">
                                        Login
                                    </Button>
                                </ListItem>
                                <ListItem disablePadding>
                                    <Button fullWidth component={RouterLink} to="/register" onClick={handleDrawerToggle} variant="contained">
                                        Register
                                    </Button>
                                </ListItem>
                            </>
                        )}
                    </List>
                </Box>
            </Drawer>
        </>
    );
};

export default Navbar;