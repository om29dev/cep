import React from 'react';
import { Box, Typography, Container, Stepper, Step, StepLabel, StepContent, useTheme } from '@mui/material';
import { TextCursorInput, Database, Map as MapIcon, Send } from 'lucide-react';

const steps = [
    {
        label: 'Citizen Submission',
        description: `Citizens report water issues via the online portal with location, photos, and detailed descriptions. 
    We capture category (supply, quality, infrastructure, drainage), GPS coordinates, and timestamp.`,
        icon: <TextCursorInput size={24} />
    },
    {
        label: 'Intelligence Engine',
        description: `Our backend cleans, normalizes, and clusters similar water complaints to detect 
    strong recurring patterns, contamination zones, and infrastructure failure hotspots.`,
        icon: <Database size={24} />
    },
    {
        label: 'Visualization & Analysis',
        description: `Live heatmaps showing water scarcity zones, contamination clusters, and leak locations 
    are generated to visualize crisis severity and geographic spread.`,
        icon: <MapIcon size={24} />
    },
    {
        label: 'Data-Backed Action',
        description: `Structured water crisis reports are automatically forwarded to municipal water departments 
    and official channels, ensuring collective community impact and rapid response.`,
        icon: <Send size={24} />
    }
];

const HowItWorks = () => {
    const theme = useTheme();
    const [activeStep, setActiveStep] = React.useState(0);

    return (
        <Box sx={{ py: 12 }}>
            <Container maxWidth="md">
                <Typography
                    variant="h2"
                    align="center"
                    gutterBottom
                    sx={{
                        fontWeight: 800,
                        mb: 6,
                        fontSize: { xs: '2rem', md: '3.75rem' }
                    }}
                >
                    The UIIS Solution
                </Typography>

                <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                        <Step key={step.label} active={true}>
                            <StepLabel
                                onClick={() => setActiveStep(index)}
                                StepIconComponent={() => (
                                    <Box sx={{
                                        p: 1.5,
                                        background: index === activeStep
                                            ? 'linear-gradient(45deg, #00D2FF, #3A7BD5)'
                                            : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: index === activeStep ? 'white' : 'text.secondary'
                                    }}>
                                        {step.icon}
                                    </Box>
                                )}
                            >
                                <Typography variant="h5" sx={{
                                    fontWeight: 700,
                                    ml: 2,
                                    color: index === activeStep ? 'primary.main' : 'text.primary'
                                }}>
                                    {step.label}
                                </Typography>
                            </StepLabel>
                            <StepContent>
                                <Typography sx={{ mb: 2, color: 'text.secondary', ml: 2, fontSize: '1.1rem' }}>
                                    {step.description}
                                </Typography>
                            </StepContent>
                        </Step>
                    ))}
                </Stepper>
            </Container>
        </Box>
    );
};

export default HowItWorks;
