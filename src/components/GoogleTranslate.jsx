import React, { useEffect, useState } from 'react';
import { Box, Button, Menu, MenuItem, Typography, TextField, InputAdornment, Divider } from '@mui/material';
import { Languages, Search } from 'lucide-react';

// All 22 official Indian languages + English
const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
    { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
    { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
    { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
    { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
    { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर' },
    { code: 'doi', name: 'Dogri', nativeName: 'डोगरी' },
    { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी' },
    { code: 'mni-Mtei', name: 'Manipuri', nativeName: 'মৈতৈলোন্' },
    { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
    { code: 'bo', name: 'Bodo', nativeName: 'बड़ो' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
];

const GoogleTranslate = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [currentLang, setCurrentLang] = useState('en');
    const [searchQuery, setSearchQuery] = useState('');
    const open = Boolean(anchorEl);

    useEffect(() => {
        // Build the language codes string for Google Translate
        const langCodes = languages.map(l => l.code).join(',');
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 2000; // 2 seconds

        // Load Google Translate script with retry logic
        const addScript = () => {
            window.googleTranslateElementInit = () => {
                try {
                    new window.google.translate.TranslateElement(
                        {
                            pageLanguage: 'en',
                            includedLanguages: langCodes,
                            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                            autoDisplay: false,
                        },
                        'google_translate_element_hidden'
                    );
                } catch (error) {
                    console.warn('Google Translate initialization failed:', error);
                }
            };

            const existingScript = document.querySelector('script[src*="translate.google.com"]');
            if (!existingScript) {
                const script = document.createElement('script');
                script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
                script.async = true;

                // Error handling with retry logic
                script.onerror = () => {
                    console.warn(`Google Translate script failed to load (attempt ${retryCount + 1}/${maxRetries})`);
                    if (retryCount < maxRetries) {
                        retryCount++;
                        // Remove failed script
                        script.remove();
                        // Retry after delay
                        setTimeout(() => {
                            addScript();
                        }, retryDelay);
                    } else {
                        console.error('Google Translate failed to load after multiple attempts. Translation may not work.');
                    }
                };

                script.onload = () => {
                    console.log('Google Translate script loaded successfully');
                };

                document.body.appendChild(script);
            } else if (window.google && window.google.translate) {
                window.googleTranslateElementInit();
            }
        };

        addScript();

        // Check for saved language preference
        const savedLang = getCookie('googtrans');
        if (savedLang) {
            const lang = savedLang.split('/').pop();
            if (lang && lang !== 'en') {
                setCurrentLang(lang);
            }
        }
    }, []);

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        setSearchQuery('');
    };

    const handleClose = () => {
        setAnchorEl(null);
        setSearchQuery('');
    };

    const changeLanguage = (langCode) => {
        setCurrentLang(langCode);
        handleClose();

        // Set cookies for Google Translate
        const domain = window.location.hostname;

        // Clear existing cookies first
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;

        if (langCode === 'en') {
            // For English, just reload without translation
            window.location.reload();
            return;
        }

        // Set new cookies
        document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`;
        document.cookie = `googtrans=/en/${langCode}; path=/`;

        // Reload to apply translation
        window.location.reload();
    };

    const getCurrentLanguage = () => {
        const lang = languages.find(l => l.code === currentLang);
        return lang ? lang.nativeName : 'English';
    };

    const filteredLanguages = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            {/* Hidden Google Translate element */}
            <Box
                id="google_translate_element_hidden"
                sx={{
                    position: 'absolute',
                    top: '-9999px',
                    left: '-9999px',
                    visibility: 'hidden',
                }}
            />

            {/* Custom Language Selector Button */}
            <Button
                onClick={handleClick}
                startIcon={<Languages size={18} />}
                sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: 'inherit',
                    borderRadius: 2,
                    border: '1px solid rgba(0, 210, 255, 0.5)',
                    px: 2,
                    py: 0.75,
                    minWidth: 'auto',
                    '&:hover': {
                        borderColor: '#00D2FF',
                        backgroundColor: 'rgba(0, 210, 255, 0.1)',
                    },
                }}
            >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {getCurrentLanguage()}
                </Typography>
            </Button>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        borderRadius: 2,
                        minWidth: 220,
                        maxHeight: 400,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    }
                }}
            >
                {/* Search Box */}
                <Box sx={{ px: 2, py: 1.5, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                    <TextField
                        size="small"
                        placeholder="Search language..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={16} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                fontSize: '0.875rem',
                            }
                        }}
                    />
                </Box>
                <Divider />

                {/* Language List */}
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    {filteredLanguages.length > 0 ? (
                        filteredLanguages.map((lang) => (
                            <MenuItem
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                selected={currentLang === lang.code}
                                sx={{
                                    py: 1.5,
                                    px: 2,
                                    '&.Mui-selected': {
                                        backgroundColor: 'rgba(0, 210, 255, 0.1)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(0, 210, 255, 0.2)',
                                        }
                                    }
                                }}
                            >
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                        {lang.nativeName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {lang.name}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))
                    ) : (
                        <MenuItem disabled>
                            <Typography variant="body2" color="text.secondary">
                                No language found
                            </Typography>
                        </MenuItem>
                    )}
                </Box>
            </Menu>
        </>
    );
};

export default GoogleTranslate;
