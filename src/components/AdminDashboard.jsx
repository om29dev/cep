import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, IconButton, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert
} from '@mui/material';
import { Trash2, UserPlus, Shield, User } from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    const handleCreateOfficer = async () => {
        try {
            setError('');
            await axios.post('http://localhost:5000/api/admin/create-officer', formData);
            setMessage('Officer created successfully');
            setOpenDialog(false);
            setFormData({ username: '', email: '', password: '' });
            fetchUsers(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create officer');
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await axios.delete(`http://localhost:5000/api/admin/users/${id}`);
                setUsers(users.filter(user => user.id !== id));
            } catch (err) {
                alert(err.response?.data?.error || 'Failed to delete user');
            }
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Admin Dashboard</Typography>
                <Button
                    variant="contained"
                    startIcon={<UserPlus size={20} />}
                    onClick={() => setOpenDialog(true)}
                >
                    Create Officer
                </Button>
            </Box>

            {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}

            <TableContainer component={Paper} elevation={3}>
                <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Joined Date</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.id}</TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Chip
                                        icon={user.role === 'Admin' || user.role === 'officer' ? <Shield size={16} /> : <User size={16} />}
                                        label={user.role}
                                        color={user.role === 'Admin' ? 'error' : user.role === 'officer' ? 'primary' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                <TableCell align="right">
                                    {user.role !== 'Admin' && (
                                        <IconButton color="error" onClick={() => handleDeleteUser(user.id)}>
                                            <Trash2 size={20} />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Officer Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Create New Officer</DialogTitle>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Username"
                        fullWidth
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Email Address"
                        type="email"
                        fullWidth
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Password"
                        type="password"
                        fullWidth
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateOfficer} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminDashboard;