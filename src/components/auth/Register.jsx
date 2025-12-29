import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, Link, Alert, MenuItem, InputAdornment } from '@mui/material';
import { useAuth } from '../../AuthContext';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'citizen'
    });
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOTP = async () => {
        if (!formData.email) {
            setOtpError('Please enter an email address first');
            return;
        }
        try {
            setOtpError('');
            await axios.post('http://localhost:5000/api/auth/send-otp', { email: formData.email });
            setOtpSent(true);
            setOtpError('');
            alert('OTP sent to your email!');
        } catch (err) {
            setOtpError(err.response?.data?.error || 'Failed to send OTP');
        }
    };

    const handleVerifyOTP = async () => {
        try {
            setOtpError('');
            await axios.post('http://localhost:5000/api/auth/verify-otp', { email: formData.email, otp });
            setOtpVerified(true);
            setOtpError('');
            alert('OTP Verified Successfully!');
        } catch (err) {
            setOtpError(err.response?.data?.error || 'Invalid OTP');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!otpVerified) {
            setError('Please verify your email with OTP first');
            return;
        }

        try {
            const user = await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });

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
                            disabled={otpVerified}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {!otpVerified && (
                                            <Button
                                                onClick={handleSendOTP}
                                                disabled={otpSent || !formData.email}
                                                size="small"
                                            >
                                                {otpSent ? 'Sent' : 'Send OTP'}
                                            </Button>
                                        )}
                                        {otpVerified && <Typography variant="caption" color="success.main">Verified</Typography>}
                                    </InputAdornment>
                                ),
                            }}
                        />
                        {otpSent && !otpVerified && (
                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="Enter OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleVerifyOTP}
                                    sx={{ mt: 2, mb: 1 }}
                                >
                                    Verify
                                </Button>
                            </Box>
                        )}
                        {(otpError) && <Typography color="error" variant="caption">{otpError}</Typography>}
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
