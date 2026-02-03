import React, { useState } from 'react';
import {
    Box,
    Typography,
    Container,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    useTheme
} from '@mui/material';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const FAQSection = () => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState('panel1');

    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const faqs = [
        {
            id: 'panel1',
            question: 'What is UIIS and how does it work?',
            answer: '<span className="notranslate">UIIS (Urban Issue Intelligence System)</span> is a community-driven platform for reporting and tracking urban issues, currently focused on water management like shortages, contamination, leaks, and drainage problems. Citizens submit complaints with location and photos, which are then processed by our AI system to prioritize issues and route them to the appropriate water officers for resolution.'
        },
        {
            id: 'panel2',
            question: 'How is my complaint secured with blockchain?',
            answer: 'When you submit a complaint, our system creates a unique cryptographic hash (digital fingerprint) of your complaint data. This hash is stored on a blockchain ledger, creating an immutable record. This ensures that your complaint cannot be tampered with, deleted, or modified after submission, providing complete transparency and trust.'
        },
        {
            id: 'panel3',
            question: 'What types of water issues can I report?',
            answer: 'You can report four main categories: 1) Supply Issues - water shortages, low pressure, irregular timing; 2) Quality Issues - contamination, discoloration, odor, taste problems; 3) Infrastructure Issues - pipeline leaks, burst pipes, faulty meters; 4) Drainage Issues - blocked drains, waterlogging, sewage overflow.'
        },
        {
            id: 'panel4',
            question: 'How long does it take for my complaint to be resolved?',
            answer: 'Resolution time depends on the severity and type of issue. Our AI system prioritizes urgent issues like contamination. Typically, high-priority issues are addressed within 24-48 hours, while standard issues may take 3-7 working days. You can track your complaint status in real-time through your dashboard.'
        },
        {
            id: 'panel5',
            question: 'Who can see my complaint details?',
            answer: 'Your complaint is visible to: 1) You - full access to your submission and status; 2) Water Officers - assigned officers can view and respond to your complaint; 3) Administrators - for oversight and quality control. Personal contact information is never publicly shared. The blockchain only stores a hash, not your actual data.'
        },
        {
            id: 'panel6',
            question: 'What is the Water Intelligence Dashboard?',
            answer: 'The Water Intelligence Dashboard is an advanced analytics tool for officers and administrators. It displays: interactive heatmaps showing complaint hotspots, pipeline network visualization, AI-generated insights and recommendations, trend analysis, and priority-sorted issue queues to help officers respond more efficiently.'
        },
        {
            id: 'panel7',
            question: 'Can I report issues anonymously?',
            answer: 'All complaints require user registration to ensure accountability and enable status tracking. However, your personal information is protected and only visible to authorized personnel. The public-facing heatmaps and statistics never reveal individual reporter identities.'
        },
        {
            id: 'panel8',
            question: 'How does the AI analysis work?',
            answer: 'Our AI system analyzes complaint text and metadata to: 1) Automatically categorize and tag issues; 2) Detect patterns across multiple complaints; 3) Identify recurring problems in specific areas; 4) Generate priority scores based on severity and impact; 5) Provide officers with actionable recommendations for faster resolution.'
        }
    ];

    return (
        <Box sx={{
            py: 12,
            background: theme.palette.mode === 'dark'
                ? 'rgba(0,0,0,0.3)'
                : 'rgba(0,0,0,0.02)'
        }}>
            <Container maxWidth="md">
                {/* Centered Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <Box sx={{ textAlign: 'center', mb: 6 }}>
                        <Box sx={{
                            p: 2,
                            background: 'rgba(0,210,255,0.1)',
                            borderRadius: 3,
                            display: 'inline-flex',
                            mb: 3
                        }}>
                            <HelpCircle size={32} color="#00D2FF" />
                        </Box>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 800,
                                mb: 2,
                                fontSize: { xs: '2rem', md: '2.5rem' }
                            }}
                        >
                            Frequently Asked Questions
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                            Everything you need to know about <span className="notranslate">UIIS — Urban Issue Intelligence System</span>.
                        </Typography>
                    </Box>
                </motion.div>

                {/* FAQ Accordions */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    {faqs.map((faq, index) => (
                        <Accordion
                            key={faq.id}
                            expanded={expanded === faq.id}
                            onChange={handleChange(faq.id)}
                            sx={{
                                mb: 2,
                                background: theme.palette.mode === 'dark'
                                    ? 'rgba(17, 34, 64, 0.6)'
                                    : 'rgba(255, 255, 255, 0.95)',
                                border: `1px solid ${expanded === faq.id ? '#00D2FF' : theme.palette.divider}`,
                                borderRadius: '16px !important',
                                overflow: 'hidden',
                                '&:before': { display: 'none' },
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: '#00D2FF50'
                                }
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ChevronDown color={expanded === faq.id ? '#00D2FF' : undefined} />}
                                sx={{
                                    py: 1,
                                    '& .MuiAccordionSummary-content': {
                                        my: 2
                                    }
                                }}
                            >
                                <Typography variant="h6" sx={{
                                    fontWeight: 600,
                                    color: expanded === faq.id ? 'primary.main' : 'text.primary'
                                }}>
                                    {faq.question}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pb: 3 }}>
                                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                    {faq.answer}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </motion.div>
            </Container>
        </Box>
    );
};

export default FAQSection;
