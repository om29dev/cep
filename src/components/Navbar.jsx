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
    ListItemText,
    useTheme,
    Avatar
} from '@mui/material';
import { Menu as MenuIcon, Droplets, Sun, Moon, LogOut } from 'lucide-react';
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>

                                    {user.role === 'Admin' && (
                                        <Button
                                            component={RouterLink}
                                            to="/admin"
                                            variant="contained"
                                            color="secondary"
                                            size="small"
                                        >
                                            Admin Panel
                                        </Button>
                                    )}

                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '1rem' }}>
                                        {user.username[0].toUpperCase()}
                                    </Avatar>
                                    <IconButton onClick={handleLogout} color="error" title="Logout">
                                        <LogOut size={20} />
                                    </IconButton>
                                </Box>
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
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240, background: theme.palette.background.paper },
                }}
            >
                <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontFamily: 'Outfit', fontWeight: 800 }}>
                        UIIS
                    </Typography>
                    <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

                        <ListItem disablePadding sx={{ justifyContent: 'center', mt: 2 }}>
                            <IconButton onClick={colorMode.toggleColorMode} color="inherit">
                                {theme.palette.mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </IconButton>
                        </ListItem>

                        {user ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 1 }}>
                                <Box
                                    component={RouterLink}
                                    to="/profile"
                                    sx={{ textDecoration: 'none', cursor: 'pointer' }}
                                >
                                    <Avatar sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: 'primary.main',
                                        fontSize: '1rem',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'scale(1.1)' }
                                    }}>
                                        {user.username[0].toUpperCase()}
                                    </Avatar>
                                </Box>

                                <IconButton onClick={handleLogout} color="error" title="Logout">
                                    <LogOut size={20} />
                                </IconButton>
                            </Box>
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