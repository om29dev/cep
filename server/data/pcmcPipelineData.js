/**
 * PCMC (Pimpri-Chinchwad Municipal Corporation) Water Pipeline Network Data
 * 
 * Server-side version (CommonJS)
 * HIGH DENSITY NETWORK - Realistic Urban Distribution
 */

// ============================================================================
// PCMC AREAS AND WARDS
// ============================================================================

const PCMC_AREAS = [
    { id: 'pimpri', name: 'Pimpri', center: [18.6261, 73.8122], wards: ['A1', 'A2', 'A3'], population: 195000, waterDemand: 45 },
    { id: 'chinchwad', name: 'Chinchwad', center: [18.6276, 73.7809], wards: ['B1', 'B2', 'B3'], population: 220000, waterDemand: 52 },
    { id: 'akurdi', name: 'Akurdi', center: [18.6509, 73.7785], wards: ['C1', 'C2'], population: 85000, waterDemand: 20 },
    { id: 'nigdi', name: 'Nigdi', center: [18.6517, 73.7684], wards: ['D1', 'D2', 'D3'], population: 145000, waterDemand: 35 },
    { id: 'bhosari', name: 'Bhosari', center: [18.6282, 73.8515], wards: ['E1', 'E2', 'E3'], population: 180000, waterDemand: 42 },
    { id: 'dighi', name: 'Dighi', center: [18.6165, 73.8522], wards: ['F1', 'F2'], population: 65000, waterDemand: 15 },
    { id: 'talawade', name: 'Talawade', center: [18.6946, 73.7681], wards: ['G1', 'G2'], population: 45000, waterDemand: 12 },
    { id: 'wakad', name: 'Wakad', center: [18.5993, 73.7625], wards: ['H1', 'H2', 'H3'], population: 175000, waterDemand: 40 },
    { id: 'thergaon', name: 'Thergaon', center: [18.6050, 73.7697], wards: ['I1', 'I2'], population: 95000, waterDemand: 22 },
    { id: 'kalewadi', name: 'Kalewadi', center: [18.6282, 73.7858], wards: ['J1', 'J2'], population: 70000, waterDemand: 18 },
    { id: 'sangvi', name: 'Sangvi', center: [18.5746, 73.8182], wards: ['K1', 'K2'], population: 95000, waterDemand: 22 },
    { id: 'moshi', name: 'Moshi', center: [18.6729, 73.8473], wards: ['L1', 'L2'], population: 60000, waterDemand: 15 },
];

/**
 * Official PCMC Water Department Contact (Government Sourced)
 */
const DEPARTMENT_CONTACT = {
    name: 'PCMC Water Department (Sarathi Helpline)',
    phone: '8888006666',
    email: 'sarathi@pcmcindia.gov.in',
    website: 'https://www.pcmcindia.gov.in'
};

const NODE_TYPES = {
    RESERVOIR: 'reservoir',
    ESR: 'esr',
    JUNCTION: 'junction',
    VALVE: 'valve',
    PUMP: 'pump',
};

// ============================================================================
// PIPELINE NODES - HIGH DENSITY
// ============================================================================

const PIPELINE_NODES = [
    // === WATER TREATMENT PLANTS ===
    { id: 'wtp_pawana', type: 'reservoir', name: 'Pawana WTP', coords: [18.6530, 73.7695], capacity: 250, status: 'active' },
    { id: 'wtp_bhama', type: 'reservoir', name: 'Bhama-Askhed WTP', coords: [18.7050, 73.8350], capacity: 150, status: 'active' },

    // === PUMPING STATIONS ===
    { id: 'pump_nigdi', type: 'pump', name: 'Nigdi Main Pump', coords: [18.6540, 73.7680], capacity: 200, status: 'active' },
    { id: 'pump_bhosari', type: 'pump', name: 'Bhosari Pump', coords: [18.6350, 73.8400], capacity: 80, status: 'active' },
    { id: 'pump_chinchwad', type: 'pump', name: 'Chinchwad Pump', coords: [18.6300, 73.7900], capacity: 100, status: 'active' },

    // === ESRs (Elevated Storage Reservoirs) ===
    { id: 'esr_pimpri', type: 'esr', name: 'Pimpri ESR', coords: [18.6270, 73.8100], capacity: 5, area: 'pimpri', status: 'active' },
    { id: 'esr_chinchwad', type: 'esr', name: 'Chinchwad ESR', coords: [18.6290, 73.7820], capacity: 6, area: 'chinchwad', status: 'active' },
    { id: 'esr_nigdi', type: 'esr', name: 'Nigdi ESR', coords: [18.6500, 73.7700], capacity: 4, area: 'nigdi', status: 'active' },
    { id: 'esr_bhosari', type: 'esr', name: 'Bhosari ESR', coords: [18.6320, 73.8480], capacity: 5, area: 'bhosari', status: 'active' },
    { id: 'esr_wakad', type: 'esr', name: 'Wakad ESR', coords: [18.6000, 73.7620], capacity: 4, area: 'wakad', status: 'active' },
    { id: 'esr_akurdi', type: 'esr', name: 'Akurdi ESR', coords: [18.6480, 73.7780], capacity: 3, area: 'akurdi', status: 'active' },

    // === PIMPRI ZONE (HIGH DENSITY - 15 nodes) ===
    { id: 'jn_p01', type: 'junction', name: 'Pimpri Chowk', coords: [18.6261, 73.8122], area: 'pimpri' },
    { id: 'jn_p02', type: 'junction', name: 'Kasarwadi', coords: [18.6220, 73.8180], area: 'pimpri' },
    { id: 'jn_p03', type: 'junction', name: 'Finolex Chowk', coords: [18.6300, 73.8150], area: 'pimpri' },
    { id: 'jn_p04', type: 'junction', name: 'Landewadi', coords: [18.6340, 73.8100], area: 'pimpri' },
    { id: 'jn_p05', type: 'junction', name: 'Walhekarwadi', coords: [18.6200, 73.8050], area: 'pimpri' },
    { id: 'jn_p06', type: 'junction', name: 'Shagun Chowk', coords: [18.6240, 73.8100], area: 'pimpri' },
    { id: 'jn_p07', type: 'junction', name: 'Dapodi Bridge', coords: [18.6180, 73.8220], area: 'pimpri' },
    { id: 'jn_p08', type: 'junction', name: 'PCMC Building', coords: [18.6280, 73.8080], area: 'pimpri' },
    { id: 'v_p01', type: 'valve', name: 'Pimpri Valve 1', coords: [18.6255, 73.8130], area: 'pimpri' },
    { id: 'v_p02', type: 'valve', name: 'Pimpri Valve 2', coords: [18.6230, 73.8160], area: 'pimpri' },

    // === CHINCHWAD ZONE (HIGH DENSITY - 12 nodes) ===
    { id: 'jn_c01', type: 'junction', name: 'Chinchwad Station', coords: [18.6350, 73.7950], area: 'chinchwad' },
    { id: 'jn_c02', type: 'junction', name: 'Chaphekar Chowk', coords: [18.6280, 73.7850], area: 'chinchwad' },
    { id: 'jn_c03', type: 'junction', name: 'Morya Gosavi', coords: [18.6220, 73.7800], area: 'chinchwad' },
    { id: 'jn_c04', type: 'junction', name: 'Bijlinagar', coords: [18.6380, 73.7880], area: 'chinchwad' },
    { id: 'jn_c05', type: 'junction', name: 'Auto Cluster', coords: [18.6320, 73.8000], area: 'chinchwad' },
    { id: 'jn_c06', type: 'junction', name: 'Sant Tukaramnagar', coords: [18.6250, 73.7780], area: 'chinchwad' },
    { id: 'jn_c07', type: 'junction', name: 'Empire Estate', coords: [18.6360, 73.7820], area: 'chinchwad' },
    { id: 'v_c01', type: 'valve', name: 'Chinchwad Valve 1', coords: [18.6310, 73.7900], area: 'chinchwad' },

    // === AKURDI-NIGDI ZONE (MEDIUM DENSITY - 10 nodes) ===
    { id: 'jn_a01', type: 'junction', name: 'Akurdi Station', coords: [18.6480, 73.7760], area: 'akurdi' },
    { id: 'jn_a02', type: 'junction', name: 'Pradhikaran', coords: [18.6550, 73.7720], area: 'akurdi' },
    { id: 'jn_n01', type: 'junction', name: 'Bhakti Shakti', coords: [18.6580, 73.7650], area: 'nigdi' },
    { id: 'jn_n02', type: 'junction', name: 'Sector 23', coords: [18.6520, 73.7620], area: 'nigdi' },
    { id: 'jn_n03', type: 'junction', name: 'Yamuna Nagar', coords: [18.6620, 73.7700], area: 'nigdi' },
    { id: 'jn_n04', type: 'junction', name: 'Transport Nagar', coords: [18.6650, 73.7600], area: 'nigdi' },
    { id: 'v_n01', type: 'valve', name: 'Nigdi Valve', coords: [18.6560, 73.7680], area: 'nigdi' },

    // === BHOSARI-DIGHI ZONE (MEDIUM DENSITY - 8 nodes) ===
    { id: 'jn_b01', type: 'junction', name: 'Bhosari MIDC', coords: [18.6300, 73.8500], area: 'bhosari' },
    { id: 'jn_b02', type: 'junction', name: 'Alandi Road', coords: [18.6380, 73.8550], area: 'bhosari' },
    { id: 'jn_b03', type: 'junction', name: 'Dighi Gaon', coords: [18.6150, 73.8520], area: 'dighi' },
    { id: 'jn_b04', type: 'junction', name: 'Telco Road', coords: [18.6250, 73.8450], area: 'bhosari' },
    { id: 'v_b01', type: 'valve', name: 'Bhosari Valve', coords: [18.6280, 73.8480], area: 'bhosari' },

    // === WAKAD-THERGAON ZONE (MEDIUM DENSITY - 8 nodes) ===
    { id: 'jn_w01', type: 'junction', name: 'Wakad Bridge', coords: [18.5980, 73.7600], area: 'wakad' },
    { id: 'jn_w02', type: 'junction', name: 'Kaspate Wasti', coords: [18.5940, 73.7680], area: 'wakad' },
    { id: 'jn_w03', type: 'junction', name: 'Datta Mandir', coords: [18.6020, 73.7550], area: 'wakad' },
    { id: 'jn_t01', type: 'junction', name: 'Dange Chowk', coords: [18.6080, 73.7720], area: 'thergaon' },
    { id: 'jn_t02', type: 'junction', name: 'Thergaon Gaon', coords: [18.6050, 73.7780], area: 'thergaon' },
    { id: 'v_w01', type: 'valve', name: 'Wakad Valve', coords: [18.6000, 73.7640], area: 'wakad' },

    // === KALEWADI-RAHATNI (MEDIUM - 4 nodes) ===
    { id: 'jn_k01', type: 'junction', name: 'Kalewadi Phata', coords: [18.6280, 73.7860], area: 'kalewadi' },
    { id: 'jn_k02', type: 'junction', name: 'Rahatni', coords: [18.6120, 73.7900], area: 'kalewadi' },

    // === SANGVI (MEDIUM - 4 nodes) ===
    { id: 'jn_s01', type: 'junction', name: 'Sangvi Phata', coords: [18.5750, 73.8150], area: 'sangvi' },
    { id: 'jn_s02', type: 'junction', name: 'Pimple Gurav', coords: [18.5850, 73.8220], area: 'sangvi' },

    // === MOSHI-TALAWADE (LOW DENSITY - 4 nodes) ===
    { id: 'jn_m01', type: 'junction', name: 'Moshi Toll', coords: [18.6750, 73.8500], area: 'moshi' },
    { id: 'jn_m02', type: 'junction', name: 'Chikhali', coords: [18.6850, 73.8300], area: 'moshi' },
    { id: 'jn_tl01', type: 'junction', name: 'Talawade IT Park', coords: [18.6900, 73.7700], area: 'talawade' },
];

// ============================================================================
// PIPELINE EDGES - FULLY CONNECTED NETWORK
// ============================================================================

const PIPELINE_EDGES = [
    // === MAIN TRANSMISSION (WTP -> Pumps -> ESRs) ===
    { id: 'tx_01', from: 'wtp_pawana', to: 'pump_nigdi', diameter: 1200, material: 'MS', status: 'active' },
    { id: 'tx_02', from: 'pump_nigdi', to: 'esr_nigdi', diameter: 900, material: 'DI', status: 'active' },
    { id: 'tx_03', from: 'pump_nigdi', to: 'esr_akurdi', diameter: 800, material: 'DI', status: 'active' },
    { id: 'tx_04', from: 'pump_nigdi', to: 'pump_chinchwad', diameter: 1000, material: 'MS', status: 'active' },
    { id: 'tx_05', from: 'pump_chinchwad', to: 'esr_chinchwad', diameter: 700, material: 'DI', status: 'active' },
    { id: 'tx_06', from: 'pump_chinchwad', to: 'esr_pimpri', diameter: 800, material: 'DI', status: 'active' },
    { id: 'tx_07', from: 'pump_chinchwad', to: 'esr_wakad', diameter: 700, material: 'DI', status: 'active' },
    { id: 'tx_08', from: 'wtp_bhama', to: 'pump_bhosari', diameter: 1000, material: 'MS', status: 'active' },
    { id: 'tx_09', from: 'pump_bhosari', to: 'esr_bhosari', diameter: 700, material: 'DI', status: 'active' },

    // === ESR TO LOCAL DISTRIBUTION ===
    { id: 'ds_01', from: 'esr_pimpri', to: 'jn_p01', diameter: 500, status: 'active' },
    { id: 'ds_02', from: 'esr_chinchwad', to: 'jn_c02', diameter: 500, status: 'active' },
    { id: 'ds_03', from: 'esr_nigdi', to: 'jn_n01', diameter: 500, status: 'active' },
    { id: 'ds_04', from: 'esr_akurdi', to: 'jn_a01', diameter: 450, status: 'active' },
    { id: 'ds_05', from: 'esr_bhosari', to: 'jn_b01', diameter: 500, status: 'active' },
    { id: 'ds_06', from: 'esr_wakad', to: 'jn_w01', diameter: 450, status: 'active' },

    // === PIMPRI LOCAL GRID (Dense) ===
    { id: 'lp_01', from: 'jn_p01', to: 'jn_p02', diameter: 300 },
    { id: 'lp_02', from: 'jn_p01', to: 'jn_p03', diameter: 300 },
    { id: 'lp_03', from: 'jn_p01', to: 'jn_p06', diameter: 350 },
    { id: 'lp_04', from: 'jn_p02', to: 'jn_p07', diameter: 250 },
    { id: 'lp_05', from: 'jn_p03', to: 'jn_p04', diameter: 300 },
    { id: 'lp_06', from: 'jn_p04', to: 'jn_p08', diameter: 300 },
    { id: 'lp_07', from: 'jn_p05', to: 'jn_p06', diameter: 300 },
    { id: 'lp_08', from: 'jn_p05', to: 'jn_p08', diameter: 250 },
    { id: 'lp_09', from: 'jn_p06', to: 'jn_p08', diameter: 350 },
    { id: 'lp_10', from: 'jn_p01', to: 'v_p01', diameter: 300 },
    { id: 'lp_11', from: 'jn_p02', to: 'v_p02', diameter: 250 },
    { id: 'lp_12', from: 'v_p01', to: 'v_p02', diameter: 250 },
    { id: 'lp_13', from: 'jn_p03', to: 'jn_p02', diameter: 250 },
    { id: 'lp_14', from: 'jn_p07', to: 'jn_b03', diameter: 300 },

    // === CHINCHWAD LOCAL GRID (Dense) ===
    { id: 'lc_01', from: 'jn_c02', to: 'jn_c01', diameter: 400 },
    { id: 'lc_02', from: 'jn_c02', to: 'jn_c03', diameter: 300 },
    { id: 'lc_03', from: 'jn_c02', to: 'jn_c06', diameter: 300 },
    { id: 'lc_04', from: 'jn_c01', to: 'jn_c04', diameter: 350 },
    { id: 'lc_05', from: 'jn_c01', to: 'jn_c05', diameter: 350 },
    { id: 'lc_06', from: 'jn_c04', to: 'jn_c07', diameter: 300 },
    { id: 'lc_07', from: 'jn_c05', to: 'jn_c04', diameter: 300 },
    { id: 'lc_08', from: 'jn_c03', to: 'jn_c06', diameter: 250 },
    { id: 'lc_09', from: 'jn_c01', to: 'v_c01', diameter: 350 },
    { id: 'lc_10', from: 'jn_c07', to: 'jn_c02', diameter: 300 },

    // === AKURDI-NIGDI GRID ===
    { id: 'ln_01', from: 'jn_a01', to: 'jn_a02', diameter: 350 },
    { id: 'ln_02', from: 'jn_a01', to: 'jn_n01', diameter: 400 },
    { id: 'ln_03', from: 'jn_a02', to: 'jn_n03', diameter: 300 },
    { id: 'ln_04', from: 'jn_n01', to: 'jn_n02', diameter: 350 },
    { id: 'ln_05', from: 'jn_n01', to: 'jn_n03', diameter: 300 },
    { id: 'ln_06', from: 'jn_n02', to: 'jn_n04', diameter: 300 },
    { id: 'ln_07', from: 'jn_n03', to: 'jn_n04', diameter: 250 },
    { id: 'ln_08', from: 'jn_n01', to: 'v_n01', diameter: 300 },

    // === BHOSARI-DIGHI GRID ===
    { id: 'lb_01', from: 'jn_b01', to: 'jn_b02', diameter: 350 },
    { id: 'lb_02', from: 'jn_b01', to: 'jn_b03', diameter: 300 },
    { id: 'lb_03', from: 'jn_b01', to: 'jn_b04', diameter: 350 },
    { id: 'lb_04', from: 'jn_b02', to: 'jn_m01', diameter: 300 },
    { id: 'lb_05', from: 'jn_b01', to: 'v_b01', diameter: 300 },
    { id: 'lb_06', from: 'jn_b04', to: 'jn_p04', diameter: 350 },

    // === WAKAD-THERGAON GRID ===
    { id: 'lw_01', from: 'jn_w01', to: 'jn_w02', diameter: 300 },
    { id: 'lw_02', from: 'jn_w01', to: 'jn_w03', diameter: 300 },
    { id: 'lw_03', from: 'jn_w02', to: 'jn_t01', diameter: 350 },
    { id: 'lw_04', from: 'jn_t01', to: 'jn_t02', diameter: 300 },
    { id: 'lw_05', from: 'jn_w01', to: 'v_w01', diameter: 300 },
    { id: 'lw_06', from: 'jn_t02', to: 'jn_k01', diameter: 300 },

    // === KALEWADI-RAHATNI ===
    { id: 'lk_01', from: 'jn_k01', to: 'jn_k02', diameter: 300 },
    { id: 'lk_02', from: 'jn_k01', to: 'jn_c07', diameter: 350 },

    // === SANGVI ===
    { id: 'ls_01', from: 'jn_s01', to: 'jn_s02', diameter: 300 },
    { id: 'ls_02', from: 'jn_s02', to: 'jn_t02', diameter: 300 },
    { id: 'ls_03', from: 'jn_w02', to: 'jn_s01', diameter: 350 },

    // === MOSHI-TALAWADE (Sparse) ===
    { id: 'lm_01', from: 'jn_m01', to: 'jn_m02', diameter: 250 },
    { id: 'lm_02', from: 'jn_m02', to: 'jn_tl01', diameter: 200 },
    { id: 'lm_03', from: 'jn_tl01', to: 'jn_n04', diameter: 250 },

    // === CROSS-REGION CONNECTORS (Ring Main) ===
    { id: 'xr_01', from: 'jn_p05', to: 'jn_c03', diameter: 400 },
    { id: 'xr_02', from: 'jn_c05', to: 'jn_p03', diameter: 400 },
    { id: 'xr_03', from: 'jn_c04', to: 'jn_a01', diameter: 400 },
    { id: 'xr_04', from: 'jn_b04', to: 'jn_c05', diameter: 350 },
    { id: 'xr_05', from: 'jn_n02', to: 'jn_tl01', diameter: 300 },
    { id: 'xr_06', from: 'jn_k02', to: 'jn_w02', diameter: 300 },
    { id: 'xr_07', from: 'jn_t01', to: 'jn_c07', diameter: 350 },
    { id: 'xr_08', from: 'jn_s02', to: 'jn_p07', diameter: 300 },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function buildPipelineGraph() {
    const graph = {};
    PIPELINE_NODES.forEach(node => {
        graph[node.id] = { ...node, neighbors: [] };
    });
    PIPELINE_EDGES.forEach(edge => {
        const fromNode = graph[edge.from];
        const toNode = graph[edge.to];
        if (fromNode && toNode) {
            // Calculate actual distance between nodes using Haversine formula
            const distance = getHaversineDistance(
                fromNode.coords[0], fromNode.coords[1],
                toNode.coords[0], toNode.coords[1]
            );

            // Attach distance to the edge object itself for Dijkstra total calculation
            edge.distance = distance;

            fromNode.neighbors.push({ nodeId: edge.to, edgeId: edge.id, diameter: edge.diameter, distance });
            toNode.neighbors.push({ nodeId: edge.from, edgeId: edge.id, diameter: edge.diameter, distance });
        }
    });
    return graph;
}

function findNearestNode(lat, lng, nodeTypes = null) {
    let minDistance = Infinity;
    let nearestNode = null;
    const nodes = nodeTypes ? PIPELINE_NODES.filter(n => nodeTypes.includes(n.type)) : PIPELINE_NODES;
    nodes.forEach(node => {
        const distance = getHaversineDistance(lat, lng, node.coords[0], node.coords[1]);
        if (distance < minDistance) { minDistance = distance; nearestNode = node; }
    });
    return { node: nearestNode, distance: minDistance };
}

function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getAreaById(areaId) { return PCMC_AREAS.find(a => a.id === areaId) || null; }
function getNodeById(nodeId) { return PIPELINE_NODES.find(n => n.id === nodeId) || null; }
function getEdgeById(edgeId) { return PIPELINE_EDGES.find(e => e.id === edgeId) || null; }
function getNodesByType(type) { return PIPELINE_NODES.filter(n => n.type === type); }

/**
 * Find the nearest PCMC area based on lat/lng coordinates
 * Returns area name and ward for GIS lookup
 */
function findNearestArea(lat, lng) {
    let minDistance = Infinity;
    let nearestArea = null;

    PCMC_AREAS.forEach(area => {
        const distance = getHaversineDistance(lat, lng, area.center[0], area.center[1]);
        if (distance < minDistance) {
            minDistance = distance;
            nearestArea = area;
        }
    });

    if (nearestArea) {
        // Assign to first ward of the area
        const ward = nearestArea.wards && nearestArea.wards.length > 0 ? nearestArea.wards[0] : 'General';
        return {
            area: nearestArea.name,
            areaId: nearestArea.id,
            ward: ward,
            distance: minDistance,
            center: nearestArea.center
        };
    }

    return {
        area: 'Unknown Area',
        areaId: null,
        ward: 'General',
        distance: null,
        center: null
    };
}

module.exports = {
    PCMC_AREAS, PIPELINE_NODES, PIPELINE_EDGES, NODE_TYPES, DEPARTMENT_CONTACT,
    buildPipelineGraph, findNearestNode, findNearestArea, getHaversineDistance,
    getAreaById, getNodeById, getEdgeById, getNodesByType
};
