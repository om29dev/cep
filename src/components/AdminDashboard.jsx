import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    IconButton,
    Chip,
    Stack,
    CircularProgress,
    InputAdornment,
    Grid
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { UserPlus, Trash2, Shield, User, Search, TrendingUp, Lock, Unlock } from 'lucide-react';
import { useTheme } from '@mui/material/styles';

const AdminDashboard = () => {
    const theme = useTheme();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);


    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formData, setFormData] = useState({ username: '', fullName: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filter Logic
    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete the user and all their complaints.")) return;
        try {
            await axios.delete(`/api/admin/users/${id}`);
            setUsers(prev => prev.filter(u => u.id !== id));
            setSuccessMsg('User deleted successfully');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert(err.response?.data?.error || "Delete failed");
        }
    };

    const handleBlockToggle = async (id, currentStatus) => {
        const action = currentStatus ? "unblock" : "block";
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            const res = await axios.put(`/api/admin/users/${id}/block`, { blocked: !currentStatus });
            setUsers(prev => prev.map(u => u.id === id ? { ...u, is_blocked: res.data.is_blocked } : u));
            setSuccessMsg(`User ${action}ed successfully`);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            alert(err.response?.data?.error || "Update failed");
        }
    };

    const handleCreateOfficer = async () => {
        setError('');
        try {
            const res = await axios.post('/api/admin/officers', formData);
            setUsers([...users, res.data]);
            setOpenDialog(false);
            setFormData({ username: '', fullName: '', email: '', password: '' });
            setSuccessMsg(`Officer ${res.data.username} appointed successfully!`);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to create officer");
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        {
            field: 'username',
            headerName: 'Username',
            width: 150,
            renderCell: (params) => (
                <Stack direction="row" alignItems="center" gap={1}>
                    {params.row.role.toLowerCase() === 'admin' ? <Shield size={16} color="#d32f2f" /> : <User size={16} />}
                    {params.value}
                </Stack>
            )
        },
        {
            field: 'full_name',
            headerName: 'Full Name',
            width: 180,
            renderCell: (params) => (
                <Typography variant="body2">{params.value || '-'}</Typography>
            )
        },
        { field: 'email', headerName: 'Email', width: 250 },
        {
            field: 'role',
            headerName: 'Role',
            width: 130,
            renderCell: (params) => (
                <Chip
                    label={params.value.toUpperCase()}
                    color={params.value.toLowerCase() === 'officer' ? "secondary" : params.value.toLowerCase() === 'admin' ? "error" : "primary"}
                    size="small"
                    variant={params.value.toLowerCase() === 'citizen' ? "outlined" : "filled"}
                    sx={{ fontWeight: 'bold', borderRadius: 0.5 }}
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            renderCell: (params) => {
                if (params.row.role.toLowerCase() === 'admin') return null;

                if (params.row.role.toLowerCase() === 'officer') {
                    return (
                        <IconButton onClick={() => handleDelete(params.row.id)} color="error" size="small" title="Delete Officer">
                            <Trash2 size={18} />
                        </IconButton>
                    );
                }

                // Default for citizens: Block/Unblock
                return (
                    <IconButton
                        onClick={() => handleBlockToggle(params.row.id, params.row.is_blocked)}
                        color={params.row.is_blocked ? "success" : "warning"}
                        size="small"
                        title={params.row.is_blocked ? "Unblock User" : "Block User"}
                    >
                        {params.row.is_blocked ? <Unlock size={18} /> : <Lock size={18} />}
                    </IconButton>
                );
            }
        }
    ];

    return (
        <Box sx={{ py: 8, minHeight: '80vh', background: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc' }}>
            <Container maxWidth="lg">
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} gutterBottom>
                            Admin Portal
                        </Typography>
                        <Typography color="text.secondary">
                            Manage System Access & Officers
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<UserPlus />}
                        onClick={() => setOpenDialog(true)}
                        sx={{ fontWeight: 'bold', px: 3 }}
                    >
                        Appoint Officer
                    </Button>
                </Box>

                {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}

                {/* SEARCH BAR SECTION */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        background: theme.palette.background.paper
                    }}
                >
                    <TextField
                        fullWidth
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={20} color={theme.palette.text.secondary} />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 0.5 }
                        }}
                        variant="outlined"
                        size="small"
                    />
                </Paper>

                {/* BLOCKCHAIN SYSTEM INTEGRITY SECTION */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 4,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`,
                        background: 'linear-gradient(135deg, rgba(157, 80, 187, 0.05) 0%, rgba(0, 210, 255, 0.05) 100%)',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        gap: 2
                    }}
                >
                    <Box>
                        <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Shield size={20} color="#9D50BB" /> System Integrity Monitor
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Verify the mathematical validity of all immutable records on the blockchain layer.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="caption" color="success.main" fontWeight={700} sx={{ display: 'block' }}>
                                CHAIN STATUS: OPERATIONAL
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Algorithms: SHA-256 + ECDSA
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={async () => {
                                try {
                                    const res = await axios.get('/api/blockchain/verify');
                                    if (res.data.isValid) {
                                        alert(`Chain Integrity Verified! Verified ${res.data.totalRecords} records across the distributed ledger.`);
                                    } else {
                                        alert("CRITICAL WARNING: Chain Integrity Compromised! Discrepancy detected in record hashes.");
                                    }
                                } catch (e) {
                                    alert("Verification failed: " + e.message);
                                }
                            }}
                            sx={{
                                fontWeight: 800,
                                borderRadius: 0.5,
                                borderColor: 'rgba(0, 210, 255, 0.5)',
                                color: '#00D2FF'
                            }}
                        >
                            Run Integrity Check
                        </Button>
                    </Box>
                </Paper>

                {/* PATTERN PROOF (CLUSTER LOGIC) SECTION */}


                <Paper elevation={3} sx={{ height: 500, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                            <CircularProgress />
                        </Box>
                    ) : (
                        <DataGrid
                            rows={filteredUsers} // Using filtered data here
                            columns={columns}
                            pageSize={10}
                            rowsPerPageOptions={[10]}
                            disableSelectionOnClick
                            sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: theme.palette.action.hover } }}
                        />
                    )}
                </Paper>

                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
                    <DialogTitle fontWeight={700}>Appoint New Officer</DialogTitle>
                    <DialogContent>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label="Username"
                                fullWidth
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                            <TextField
                                label="Full Name"
                                fullWidth
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                            <TextField
                                label="Email Address"
                                type="email"
                                fullWidth
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <TextField
                                label="Password"
                                type="password"
                                fullWidth
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button variant="contained" onClick={handleCreateOfficer} disabled={!formData.email || !formData.password || !formData.username || !formData.fullName}>
                            Create Account
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box >
    );
};

export default AdminDashboard;