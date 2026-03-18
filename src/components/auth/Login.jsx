import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, Link, Alert } from '@mui/material';
import { useAuth } from '../../AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState(''); // Changed from email
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Passing username instead of email
            const user = await login(username, password);

            // Fix: Normalize role to lowercase for comparison
            const role = user.role.toLowerCase();

            if (role === 'officer') {
                navigate('/dashboard');
            } else if (role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/my-complaints');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 4, bgcolor: 'background.paper', backdropFilter: 'blur(10px)' }}>
                    <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
                        Login
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Username" // Label Changed
                            name="username"  // Name Changed
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                        >
                            Sign In
                        </Button>
                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                            Don't have an account?{' '}
                            <Link component={RouterLink} to="/register" sx={{ fontWeight: 'bold' }}>
                                Register
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;