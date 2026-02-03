import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import {
    Box,
    Container,
    Typography,
    Paper,
    useTheme,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Stack,
    Divider,
    ImageList,
    ImageListItem,
    IconButton,
    InputAdornment,
    TextField,
    Grid,
    Skeleton,
    CircularProgress
} from '@mui/material';
import { DataGrid, GridToolbar, GridActionsCellItem } from '@mui/x-data-grid';
import {
    CheckCircle2,
    Clock,
    AlertTriangle,
    Eye,
    Search,
    MapPin,
    Filter,
    Download, // Import Download icon
    Sparkles,
    Bot,
    Send,
    MessageSquare,
    X
} from 'lucide-react';

// ... (LocationResolver component remains unchanged)
// Internal component to handle reverse geocoding
// LocationResolver component removed as we now use explicit Area/Ward fields

import IssueDetailDialog from './shared/IssueDetailDialog';

const OfficerComplaints = () => {
    const theme = useTheme();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const response = await axios.get('/api/complaints');
            setComplaints(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch complaints:", err);
            setLoading(false);
        }
    };

    const handleUpdate = (updatedComplaint) => {
        setComplaints(prev => prev.map(c => c.id === updatedComplaint.id ? updatedComplaint : c));
        setSelectedComplaint(updatedComplaint);
    };

    const handleExport = () => {
        if (!filteredComplaints.length) {
            alert("No data to export");
            return;
        }

        const headers = ["ID", "Category", "Description", "Location", "Area", "Ward", "Status", "Reported At"];
        const rows = filteredComplaints.map(c => [
            c.id,
            `"${c.category}"`, // Quote strings to handle commas
            `"${c.description.replace(/"/g, '""')}"`, // Escape quotes
            `"${c.location}"`,
            `"${c.area || 'Unknown'}"`,
            `"${c.ward || 'General'}"`,
            c.status,
            new Date(c.created_at).toLocaleString()
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `complaints_registry_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const columns = [
        { field: 'id', headerName: 'ID', width: 50 },
        {
            field: 'category',
            headerName: 'Category',
            width: 140,
            renderCell: (params) => (
                <Chip
                    label={params.value.toUpperCase()}
                    size="small"
                    color={params.value.includes('Contaminated') ? 'error' : 'primary'}
                    sx={{ fontWeight: 700, borderRadius: 1 }}
                />
            )
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 1,
            minWidth: 200,
        },
        {
            field: 'area',
            headerName: 'Area',
            width: 120,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
                    <Typography variant="body2" fontWeight={600} noWrap>{params.value || 'Unknown'}</Typography>
                </Box>
            )
        },
        {
            field: 'ward',
            headerName: 'Ward',
            width: 80,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
                    <Typography variant="body2" color="text.secondary" noWrap>{params.value || '-'}</Typography>
                </Box>
            )
        },

        {
            field: 'status',
            headerName: 'Status',
            width: 110,
            renderCell: (params) => {
                const statusLabel = params.value.toUpperCase();
                const statusColor = params.value === 'resolved' ? 'success' : 'warning';

                return (
                    <Chip
                        label={statusLabel}
                        size="small"
                        icon={params.value === 'resolved' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        sx={{
                            bgcolor: params.value === 'resolved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                            color: params.value === 'resolved' ? '#22c55e' : '#eab308',
                            fontWeight: 800,
                            border: '1px solid',
                            borderColor: params.value === 'resolved' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)'
                        }}
                    />
                )
            }
        },
        {
            field: 'ai_urgency',
            headerName: 'Severity',
            width: 120,
            renderCell: (params) => {
                const priority = params.value || 'Low';
                const isCritical = priority === 'Critical';
                const isHigh = priority === 'High';

                let color = 'success';
                if (isCritical) color = 'error';
                else if (isHigh) color = 'error';
                else if (priority === 'Medium') color = 'warning';
                else color = 'info';

                return (
                    <Chip
                        label={priority.toUpperCase()}
                        size="small"
                        color={color}
                        variant={isCritical ? "filled" : "outlined"}
                        sx={{
                            fontWeight: 800,
                            borderRadius: 1,
                            ...(isCritical && { boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' })
                        }}
                    />
                );
            }
        },
        {
            field: 'created_at',
            headerName: 'Reported',
            width: 160,
            valueFormatter: (value) => new Date(value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
        },

    ];

    // Priority order for sorting (Critical > High > Medium > Low)
    const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };

    const filteredComplaints = complaints
        .filter((c) =>
            c.description.toLowerCase().includes(searchText.toLowerCase()) ||
            c.category.toLowerCase().includes(searchText.toLowerCase()) ||
            c.id.toString().includes(searchText)
        )
        .sort((a, b) => {
            // Sort by priority (Critical first), then by created_at (newest first)
            const priorityA = priorityOrder[a.ai_urgency] ?? 4;
            const priorityB = priorityOrder[b.ai_urgency] ?? 4;
            if (priorityA !== priorityB) return priorityA - priorityB;
            return new Date(b.created_at) - new Date(a.created_at);
        });

    return (
        <Box sx={{
            py: 4,
            minHeight: '100vh',
            bgcolor: theme.palette.mode === 'dark' ? '#0b1120' : '#f0f2f5'
        }}>
            <Container maxWidth="xl">
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={1.5}>
                            OFFICER PORTAL
                        </Typography>
                        <Typography variant="h3" fontWeight={800} sx={{
                            background: 'linear-gradient(45deg, #fff 30%, #a5b4fc 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: theme.palette.mode === 'dark' ? 'transparent' : 'inherit'
                        }}>
                            Issue Registry
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <TextField
                            placeholder="Search complaints..."
                            variant="outlined"
                            size="small"
                            onChange={(e) => setSearchText(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={20} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 3, bgcolor: theme.palette.background.paper }
                            }}
                        />
                        <Button
                            variant="outlined"
                            startIcon={<Download size={18} />}
                            onClick={handleExport}
                            sx={{
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                bgcolor: theme.palette.background.paper
                            }}
                        >
                            Export CSV
                        </Button>
                    </Stack>
                </Box>

                <Paper sx={{
                    height: 700,
                    width: '100%',
                    borderRadius: 0,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden'
                }}>
                    <DataGrid
                        rows={filteredComplaints}
                        columns={columns}
                        pageSize={10}
                        rowsPerPageOptions={[10, 20, 50]}
                        checkboxSelection
                        disableSelectionOnClick
                        loading={loading}
                        onRowClick={(params) => setSelectedComplaint(params.row)}
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-cell': {
                                borderBottom: `1px solid ${theme.palette.divider}`
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: theme.palette.action.hover,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                fontSize: '0.75rem'
                            }
                        }}
                    />
                </Paper>

                <IssueDetailDialog
                    open={!!selectedComplaint}
                    complaint={selectedComplaint}
                    onClose={() => setSelectedComplaint(null)}
                    onUpdate={handleUpdate}
                />


            </Container>
        </Box >
    );
};

export default OfficerComplaints;
