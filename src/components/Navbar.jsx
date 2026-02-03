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

    Avatar,
    Badge,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import axios from 'axios';
import { Menu as MenuIcon, Droplets, Sun, Moon, LogOut, ListChecks, LayoutDashboard, PlusCircle, Shield, BrainCircuit, MessageSquarePlus, Bell } from 'lucide-react';
import { ColorModeContext } from '../ColorModeContext';
import { useAuth } from '../AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import GoogleTranslate from './GoogleTranslate';

const Navbar = () => {
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [lastNotifiedId, setLastNotifiedId] = useState(0); // Track latest notification
    const openNotifications = Boolean(anchorEl);

    React.useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll for notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);

            // Request permission on mount (User might need to interact first in some browsers)
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }

            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/notifications');
            const data = res.data;
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);

            // Browser Notification Logic
            if (data.length > 0) {
                const latest = data[0]; // Assuming sorted by created_at DESC
                // Check if this is a new notification we haven't alerted about yet
                // And insure we don't alert for old ones on page refresh (simple check: must be unread)
                if (latest.id > lastNotifiedId && !latest.is_read) {
                    setLastNotifiedId(latest.id);

                    if (Notification.permission === 'granted') {
                        new Notification(latest.title, {
                            body: latest.message,
                            icon: '/favicon.ico' // Assuming standard favicon location
                        });
                    }
                } else if (lastNotifiedId === 0) {
                    // First load, just sync the ID without alerting to prevent spamming old notifs
                    setLastNotifiedId(latest.id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const handleNotificationClick = (event) => {
        setAnchorEl(event.currentTarget);
        // Retry permission request if not granted yet
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    };

    const handleNotificationClose = () => {
        setAnchorEl(null);
    };

    const handleMarkAsRead = async (notification) => {
        if (!notification.is_read) {
            try {
                await axios.put(`/api/notifications/${notification.id}/read`);
                // Update local state
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (err) {
                console.error("Error marking as read", err);
            }
        }
        // Additional Logic: Navigate to complaint if needed
        handleNotificationClose();
        if (notification.type === 'complaint_resolved' && user.role === 'citizen') {
            navigate('/my-complaints');
        }
    };


    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Helper to check role safely
    const hasRole = (roleName) => user?.role?.toLowerCase() === roleName.toLowerCase();

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
                            <Box className="notranslate">
                                <Typography
                                    variant="h6"
                                    component="div"
                                    sx={{
                                        fontFamily: 'Outfit',
                                        fontWeight: 800,
                                        background: 'linear-gradient(45deg, #00D2FF 30%, #9D50BB 90%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        fontSize: '1.25rem',
                                        lineHeight: 1.1
                                    }}
                                >
                                    UIIS
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'text.secondary',
                                        fontSize: '0.65rem',
                                        letterSpacing: 0.5,
                                        display: { xs: 'none', sm: 'block' },
                                        fontWeight: 700
                                    }}
                                >
                                    Urban Issue Intelligence System
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
                            {user && (
                                <IconButton
                                    color="inherit"
                                    onClick={handleNotificationClick}
                                    sx={{ mr: 1 }}
                                >
                                    <Badge badgeContent={unreadCount} color="error">
                                        <Bell size={20} />
                                    </Badge>
                                </IconButton>
                            )}
                            {/* Notification Menu */}
                            <Menu
                                anchorEl={anchorEl}
                                open={openNotifications}
                                onClose={handleNotificationClose}
                                PaperProps={{
                                    elevation: 0,
                                    sx: {
                                        overflow: 'visible',
                                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                        mt: 1.5,
                                        width: 320,
                                        maxHeight: 400,
                                        '& .MuiAvatar-root': {
                                            width: 32,
                                            height: 32,
                                            ml: -0.5,
                                            mr: 1,
                                        },
                                        '&:before': {
                                            content: '""',
                                            display: 'block',
                                            position: 'absolute',
                                            top: 0,
                                            right: 14,
                                            width: 10,
                                            height: 10,
                                            bgcolor: 'background.paper',
                                            transform: 'translateY(-50%) rotate(45deg)',
                                            zIndex: 0,
                                        },
                                    },
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                                    <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
                                </Box>
                                {notifications.length === 0 ? (
                                    <Box sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">No new notifications</Typography>
                                    </Box>
                                ) : (
                                    <List sx={{ p: 0 }}>
                                        {notifications.map((notification) => (
                                            <MenuItem
                                                key={notification.id}
                                                onClick={() => handleMarkAsRead(notification)}
                                                sx={{
                                                    alignItems: 'flex-start',
                                                    py: 1.5,
                                                    bgcolor: notification.is_read ? 'transparent' : 'action.hover'
                                                }}
                                            >
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: notification.is_read ? 400 : 700, fontSize: '0.9rem' }}>
                                                        {notification.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4, mb: 0.5 }}>
                                                        {notification.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="primary" sx={{ fontSize: '0.7rem' }}>
                                                        {new Date(notification.created_at).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                                {!notification.is_read && (
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', mt: 1 }} />
                                                )}
                                            </MenuItem>
                                        ))}
                                    </List>
                                )}
                            </Menu>

                            <GoogleTranslate />
                            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                                {theme.palette.mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </IconButton>

                            {user ? (
                                <>
                                    {hasRole('admin') && (
                                        <Button
                                            component={RouterLink}
                                            to="/admin"
                                            startIcon={<Shield size={18} />}
                                            color="inherit"
                                            sx={{ textTransform: 'none', fontWeight: 600 }}
                                        >
                                            Admin Portal
                                        </Button>
                                    )}

                                    {hasRole('officer') && (
                                        <>
                                            <Button
                                                component={RouterLink}
                                                to="/dashboard"
                                                startIcon={<LayoutDashboard size={18} />}
                                                color="inherit"
                                                sx={{ textTransform: 'none', fontWeight: 600 }}
                                            >
                                                Officer Dashboard
                                            </Button>
                                            <Button
                                                component={RouterLink}
                                                to="/officer-complaints"
                                                startIcon={<ListChecks size={18} />}
                                                color="inherit"
                                                sx={{ textTransform: 'none', fontWeight: 600 }}
                                            >
                                                Issues List
                                            </Button>
                                            <Button
                                                component={RouterLink}
                                                to="/water-intelligence"
                                                startIcon={<BrainCircuit size={18} />}
                                                color="inherit"
                                                sx={{
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    background: 'linear-gradient(45deg, #00D2FF 30%, #3A7BD5 90%)',
                                                    color: 'white',
                                                    borderRadius: 2,
                                                    px: 2,
                                                    '&:hover': {
                                                        background: 'linear-gradient(45deg, #00D2FF 50%, #3A7BD5 100%)',
                                                    }
                                                }}
                                            >
                                                Water Intelligence
                                            </Button>

                                        </>
                                    )}

                                    {hasRole('citizen') && (
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
                                        <Box component={RouterLink} to="/profile" sx={{ textDecoration: 'none' }}>
                                            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '1rem', cursor: 'pointer', border: `2px solid ${theme.palette.background.paper}` }}>
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
                                    <Button
                                        component={RouterLink}
                                        to="/guest-report"
                                        startIcon={<MessageSquarePlus size={18} />}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2,
                                            borderColor: '#00D2FF',
                                            color: '#00D2FF',
                                            fontWeight: 600,
                                            textTransform: 'none',
                                            '&:hover': {
                                                borderColor: '#00D2FF',
                                                background: 'rgba(0, 210, 255, 0.1)'
                                            }
                                        }}
                                    >
                                        Guest Report
                                    </Button>
                                    <Button component={RouterLink} to="/login" variant="outlined" sx={{ borderRadius: 2 }}>Login</Button>
                                    <Button component={RouterLink} to="/register" variant="contained" sx={{ borderRadius: 2 }}>Register</Button>
                                </Box>
                            )}
                        </Box>

                        <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ display: { md: 'none' } }}>
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
                    <Box className="notranslate" sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ fontFamily: 'Outfit', fontWeight: 800 }}>UIIS</Typography>
                        <Typography variant="caption" color="text.secondary">Urban Issue Intelligence System</Typography>
                    </Box>
                    <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <ListItem disablePadding sx={{ justifyContent: 'center', mb: 1 }}>
                            <GoogleTranslate />
                        </ListItem>
                        <ListItem disablePadding sx={{ justifyContent: 'center', mb: 2 }}>
                            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                                {theme.palette.mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </IconButton>
                        </ListItem>

                        {user ? (
                            <>
                                {hasRole('admin') && (
                                    <ListItem disablePadding>
                                        <Button fullWidth component={RouterLink} to="/admin" onClick={handleDrawerToggle} startIcon={<Shield size={18} />} sx={{ justifyContent: 'flex-start', px: 2, py: 1.5 }}>
                                            Admin Portal
                                        </Button>
                                    </ListItem>
                                )}

                                {hasRole('officer') && (
                                    <>
                                        <ListItem disablePadding>
                                            <Button fullWidth component={RouterLink} to="/dashboard" onClick={handleDrawerToggle} startIcon={<LayoutDashboard size={18} />} sx={{ justifyContent: 'flex-start', px: 2, py: 1.5 }}>
                                                Officer Dashboard
                                            </Button>
                                        </ListItem>
                                        <ListItem disablePadding>
                                            <Button fullWidth component={RouterLink} to="/officer-complaints" onClick={handleDrawerToggle} startIcon={<ListChecks size={18} />} sx={{ justifyContent: 'flex-start', px: 2, py: 1.5 }}>
                                                Issues List
                                            </Button>
                                        </ListItem>
                                        <ListItem disablePadding>
                                            <Button fullWidth component={RouterLink} to="/water-intelligence" onClick={handleDrawerToggle} startIcon={<BrainCircuit size={18} />} sx={{ justifyContent: 'flex-start', px: 2, py: 1.5, color: 'primary.main', fontWeight: 700 }}>
                                                Water Intelligence
                                            </Button>
                                        </ListItem>

                                    </>
                                )}

                                {hasRole('citizen') && (
                                    <>
                                        <ListItem disablePadding>
                                            <Button fullWidth component={RouterLink} to="/my-complaints" onClick={handleDrawerToggle} startIcon={<ListChecks size={18} />} sx={{ justifyContent: 'flex-start', px: 2, py: 1.5 }}>
                                                My Issues
                                            </Button>
                                        </ListItem>
                                        <ListItem disablePadding>
                                            <Button fullWidth component={RouterLink} to="/report" onClick={handleDrawerToggle} startIcon={<PlusCircle size={18} />} sx={{ justifyContent: 'flex-start', px: 2, py: 1.5, color: theme.palette.primary.main }}>
                                                Report Issue
                                            </Button>
                                        </ListItem>
                                    </>
                                )}

                                <ListItem disablePadding>
                                    <Button fullWidth component={RouterLink} to="/profile" onClick={handleDrawerToggle} sx={{ justifyContent: 'flex-start', px: 2, py: 1.5 }}>
                                        My Profile
                                    </Button>
                                </ListItem>
                                <ListItem disablePadding sx={{ mt: 2 }}>
                                    <Button fullWidth onClick={() => { handleLogout(); handleDrawerToggle(); }} color="error" variant="outlined">
                                        Logout
                                    </Button>
                                </ListItem>
                            </>
                        ) : (
                            <>
                                <ListItem disablePadding>
                                    <Button
                                        fullWidth
                                        component={RouterLink}
                                        to="/guest-report"
                                        onClick={handleDrawerToggle}
                                        startIcon={<MessageSquarePlus size={18} />}
                                        sx={{
                                            justifyContent: 'flex-start',
                                            px: 2,
                                            py: 1.5,
                                            color: '#00D2FF',
                                            fontWeight: 600
                                        }}
                                    >
                                        Guest Report
                                    </Button>
                                </ListItem>
                                <ListItem disablePadding sx={{ mt: 2 }}>
                                    <Button fullWidth component={RouterLink} to="/login" onClick={handleDrawerToggle} variant="outlined">Login</Button>
                                </ListItem>
                                <ListItem disablePadding>
                                    <Button fullWidth component={RouterLink} to="/register" onClick={handleDrawerToggle} variant="contained">Register</Button>
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