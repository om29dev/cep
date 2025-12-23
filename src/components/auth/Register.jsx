import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, Link, Alert, MenuItem } from '@mui/material';
import { useAuth } from '../../AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'citizen',
        aadharNo: ''
    });
    const [aadharPhoto, setAadharPhoto] = useState(null);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setAadharPhoto(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!aadharPhoto) {
            setError('Please upload Aadhar card photo');
            return;
        }

        try {
            const data = new FormData();
            data.append('username', formData.username);
            data.append('email', formData.email);
            data.append('password', formData.password);
            data.append('role', formData.role);
            data.append('aadharNo', formData.aadharNo);
            data.append('aadharPhoto', aadharPhoto);

            const user = await register(data);
            if (user.role === 'officer') {
                navigate('/dashboard');
            } else {
                navigate('/report');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 4, bgcolor: 'background.paper', backdropFilter: 'blur(10px)' }}>
                    <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
                        Register
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Username"
                            name="username"
                            autoFocus
                            value={formData.username}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Aadhar Number"
                            name="aadharNo"
                            value={formData.aadharNo}
                            onChange={handleChange}
                            inputProps={{ maxLength: 12 }}
                        />

                        <Box sx={{ mt: 2, mb: 1 }}>
                            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600 }}>
                                Aadhar Card Photo *
                            </Typography>
                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                sx={{
                                    py: 1.5,
                                    borderStyle: 'dashed',
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    color: aadharPhoto ? 'success.main' : 'primary.main',
                                    borderColor: aadharPhoto ? 'success.main' : 'primary.main',
                                }}
                            >
                                {aadharPhoto ? `Selected: ${aadharPhoto.name}` : 'Upload Aadhar Photo'}
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </Button>
                        </Box>

                        <TextField
                            select
                            margin="normal"
                            required
                            fullWidth
                            label="Role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                        >
                            <MenuItem value="citizen">Citizen</MenuItem>
                            <MenuItem value="officer">Officer</MenuItem>
                        </TextField>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
                        >
                            Register
                        </Button>
                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                            Already have an account?{' '}
                            <Link component={RouterLink} to="/login" sx={{ fontWeight: 'bold' }}>
                                Login
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};


export default Register;
