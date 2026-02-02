/**
 * PCMC (Pimpri-Chinchwad Municipal Corporation) Water Pipeline Network Data
 * 
 * Server-side version (CommonJS)
 */

// ============================================================================
// PCMC AREAS AND WARDS
// ============================================================================

const PCMC_AREAS = [
    {
        id: 'pimpri',
        name: 'Pimpri',
        center: [18.6261, 73.8122],
        wards: ['A1', 'A2', 'A3'],
        population: 195000,
        waterDemand: 45, // MLD
    },
    {
        id: 'chinchwad',
        name: 'Chinchwad',
        center: [18.6276, 73.7809],
        wards: ['B1', 'B2', 'B3'],
        population: 220000,
        waterDemand: 52,
    },
    {
        id: 'akurdi',
        name: 'Akurdi',
        center: [18.6509, 73.7785],
        wards: ['C1', 'C2'],
        population: 85000,
        waterDemand: 20,
    },
    {
        id: 'nigdi',
        name: 'Nigdi',
        center: [18.6517, 73.7684],
        wards: ['D1', 'D2', 'D3'],
        population: 145000,
        waterDemand: 35,
    },
    {
        id: 'bhosari',
        name: 'Bhosari',
        center: [18.6282, 73.8515],
        wards: ['E1', 'E2', 'E3'],
        population: 180000,
        waterDemand: 42,
    },
    {
        id: 'dighi',
        name: 'Dighi',
        center: [18.6165, 73.8522],
        wards: ['F1', 'F2'],
        population: 65000,
        waterDemand: 15,
    },
    {
        id: 'talawade',
        name: 'Talawade',
        center: [18.6946, 73.7681],
        wards: ['G1', 'G2'],
        population: 45000,
        waterDemand: 12,
    },
    {
        id: 'wakad',
        name: 'Wakad',
        center: [18.5993, 73.7625],
        wards: ['H1', 'H2', 'H3'],
        population: 175000,
        waterDemand: 40,
    },
    {
        id: 'thergaon',
        name: 'Thergaon',
        center: [18.6050, 73.7697],
        wards: ['I1', 'I2'],
        population: 95000,
        waterDemand: 22,
    },
    {
        id: 'kalewadi',
        name: 'Kalewadi',
        center: [18.6282, 73.7858],
        wards: ['J1', 'J2'],
        population: 70000,
        waterDemand: 18,
    },
];

// ============================================================================
// PIPELINE NODES (Junctions, Valves, Reservoirs, Connections)
// ============================================================================

const NODE_TYPES = {
    RESERVOIR: 'reservoir',       // Water Treatment Plant / Storage
    ESR: 'esr',                   // Elevated Storage Reservoir
    JUNCTION: 'junction',         // Pipe Junction
    VALVE: 'valve',               // Control Valve
    CONNECTION: 'connection',     // End-user connection point
    PUMP: 'pump',                 // Pumping Station
};

const PIPELINE_NODES = [
    // Water Treatment Plants (Primary Sources) - Updated with actual locations
    {
        id: 'wtp_pawana',
        type: NODE_TYPES.RESERVOIR,
        name: 'Pawana Water Treatment Plant', // Sector 23, Nigdi
        coords: [18.6530, 73.7695],
        capacity: 250, // MLD
        area: null,
        status: 'active',
    },
    {
        id: 'wtp_bhama',
        type: NODE_TYPES.RESERVOIR,
        name: 'Bhama-Askhed WTP', // Kuruli, Pune
        coords: [18.7212, 73.8468],
        capacity: 150, // MLD
        area: null,
        status: 'active',
    },

    // Elevated Storage Reservoirs (ESRs) - Centered near respective areas
    {
        id: 'esr_pimpri',
        type: NODE_TYPES.ESR,
        name: 'Pimpri ESR',
        coords: [18.6265, 73.8125],
        capacity: 5, // ML
        area: 'pimpri',
        status: 'active',
    },
    {
        id: 'esr_chinchwad',
        type: NODE_TYPES.ESR,
        name: 'Chinchwad ESR',
        coords: [18.6280, 73.7815],
        capacity: 6, // ML
        area: 'chinchwad',
        status: 'active',
    },
    {
        id: 'esr_nigdi',
        type: NODE_TYPES.ESR,
        name: 'Nigdi ESR',
        coords: [18.6525, 73.7690],
        capacity: 4, // ML
        area: 'nigdi',
        status: 'active',
    },
    {
        id: 'esr_bhosari',
        type: NODE_TYPES.ESR,
        name: 'Bhosari ESR',
        coords: [18.6290, 73.8520],
        capacity: 5, // ML
        area: 'bhosari',
        status: 'active',
    },
    {
        id: 'esr_wakad',
        type: NODE_TYPES.ESR,
        name: 'Wakad ESR',
        coords: [18.6000, 73.7630],
        capacity: 4.5, // ML
        area: 'wakad',
        status: 'active',
    },

    // Major Junctions - Adjusted for new geography
    {
        id: 'jn_pimpri_main',
        type: NODE_TYPES.JUNCTION,
        name: 'Pimpri Main Junction',
        coords: [18.6260, 73.8120],
        area: 'pimpri',
        status: 'active',
    },
    {
        id: 'jn_chinchwad_main',
        type: NODE_TYPES.JUNCTION,
        name: 'Chinchwad Main Junction',
        coords: [18.6275, 73.7805],
        area: 'chinchwad',
        status: 'active',
    },
    {
        id: 'jn_akurdi',
        type: NODE_TYPES.JUNCTION,
        name: 'Akurdi Junction',
        coords: [18.6500, 73.7780],
        area: 'akurdi',
        status: 'active',
    },
    {
        id: 'jn_nigdi_central',
        type: NODE_TYPES.JUNCTION,
        name: 'Nigdi Central Junction',
        coords: [18.6515, 73.7680],
        area: 'nigdi',
        status: 'active',
    },
    {
        id: 'jn_bhosari_main',
        type: NODE_TYPES.JUNCTION,
        name: 'Bhosari Main Junction',
        coords: [18.6280, 73.8510],
        area: 'bhosari',
        status: 'active',
    },
    {
        id: 'jn_wakad_main',
        type: NODE_TYPES.JUNCTION,
        name: 'Wakad Main Junction',
        coords: [18.5990, 73.7620],
        area: 'wakad',
        status: 'active',
    },
    {
        id: 'jn_thergaon',
        type: NODE_TYPES.JUNCTION,
        name: 'Thergaon Junction',
        coords: [18.6055, 73.7695],
        area: 'thergaon',
        status: 'active',
    },
    {
        id: 'jn_talawade',
        type: NODE_TYPES.JUNCTION,
        name: 'Talawade Junction',
        coords: [18.6940, 73.7680],
        area: 'talawade',
        status: 'active',
    },
    {
        id: 'jn_dighi',
        type: NODE_TYPES.JUNCTION,
        name: 'Dighi Junction',
        coords: [18.6170, 73.8520],
        area: 'dighi',
        status: 'active',
    },
    {
        id: 'jn_kalewadi',
        type: NODE_TYPES.JUNCTION,
        name: 'Kalewadi Junction',
        coords: [18.6280, 73.7860],
        area: 'kalewadi',
        status: 'active',
    },

    // Secondary Junctions for denser network
    {
        id: 'jn_pimpri_east',
        type: NODE_TYPES.JUNCTION,
        name: 'Pimpri East Junction',
        coords: [18.6270, 73.8150],
        area: 'pimpri',
        status: 'active',
    },
    {
        id: 'jn_pimpri_west',
        type: NODE_TYPES.JUNCTION,
        name: 'Pimpri West Junction',
        coords: [18.6255, 73.8090],
        area: 'pimpri',
        status: 'active',
    },
    {
        id: 'jn_chinchwad_north',
        type: NODE_TYPES.JUNCTION,
        name: 'Chinchwad North Junction',
        coords: [18.6300, 73.7810],
        area: 'chinchwad',
        status: 'active',
    },
    {
        id: 'jn_bhosari_east',
        type: NODE_TYPES.JUNCTION,
        name: 'Bhosari East Junction',
        coords: [18.6290, 73.8560],
        area: 'bhosari',
        status: 'active',
    },
    {
        id: 'jn_nigdi_south',
        type: NODE_TYPES.JUNCTION,
        name: 'Nigdi South Junction',
        coords: [18.6490, 73.7685],
        area: 'nigdi',
        status: 'active',
    },

    // Pumping Stations
    {
        id: 'pump_main',
        type: NODE_TYPES.PUMP,
        name: 'Main Pumping Station',
        coords: [18.6520, 73.7690], // Near Nigdi WTP
        capacity: 200, // MLD
        area: null,
        status: 'active',
    },
    {
        id: 'pump_bhosari',
        type: NODE_TYPES.PUMP,
        name: 'Bhosari Booster Station',
        coords: [18.6285, 73.8510],
        capacity: 50, // MLD
        area: 'bhosari',
        status: 'active',
    },

    // Control Valves
    {
        id: 'valve_pimpri_1',
        type: NODE_TYPES.VALVE,
        name: 'Pimpri Control Valve 1',
        coords: [18.6262, 73.8123],
        area: 'pimpri',
        status: 'active',
    },
    {
        id: 'valve_chinchwad_1',
        type: NODE_TYPES.VALVE,
        name: 'Chinchwad Control Valve 1',
        coords: [18.6278, 73.7810],
        area: 'chinchwad',
        status: 'active',
    },
    {
        id: 'valve_bhosari_1',
        type: NODE_TYPES.VALVE,
        name: 'Bhosari Control Valve 1',
        coords: [18.6280, 73.8512],
        area: 'bhosari',
        status: 'active',
    },
];

// ============================================================================
// PIPELINE EDGES (Pipe Segments connecting nodes)
// ============================================================================

const PIPE_MATERIALS = {
    DI: 'Ductile Iron',
    CI: 'Cast Iron',
    HDPE: 'High-Density Polyethylene',
    PVC: 'PVC',
    MS: 'Mild Steel',
};

const PIPELINE_EDGES = [
    // Main Transmission Lines from WTPs
    {
        id: 'pipe_001',
        from: 'wtp_pawana',
        to: 'pump_main',
        distance: 5.2, // km
        diameter: 900, // mm
        material: 'DI',
        yearInstalled: 2010,
        status: 'active',
    },
    {
        id: 'pipe_002',
        from: 'pump_main',
        to: 'esr_chinchwad',
        distance: 3.5,
        diameter: 700,
        material: 'DI',
        yearInstalled: 2010,
        status: 'active',
    },
    {
        id: 'pipe_003',
        from: 'pump_main',
        to: 'jn_chinchwad_main',
        distance: 2.8,
        diameter: 600,
        material: 'DI',
        yearInstalled: 2012,
        status: 'active',
    },
    {
        id: 'pipe_004',
        from: 'wtp_bhama',
        to: 'esr_bhosari',
        distance: 6.5,
        diameter: 600,
        material: 'DI',
        yearInstalled: 2015,
        status: 'active',
    },

    // Distribution from ESRs
    {
        id: 'pipe_005',
        from: 'esr_pimpri',
        to: 'jn_pimpri_main',
        distance: 0.8,
        diameter: 450,
        material: 'DI',
        yearInstalled: 2008,
        status: 'active',
    },
    {
        id: 'pipe_006',
        from: 'esr_chinchwad',
        to: 'jn_chinchwad_main',
        distance: 0.6,
        diameter: 450,
        material: 'DI',
        yearInstalled: 2010,
        status: 'active',
    },
    {
        id: 'pipe_007',
        from: 'esr_nigdi',
        to: 'jn_nigdi_central',
        distance: 0.5,
        diameter: 400,
        material: 'DI',
        yearInstalled: 2012,
        status: 'active',
    },
    {
        id: 'pipe_008',
        from: 'esr_bhosari',
        to: 'jn_bhosari_main',
        distance: 0.7,
        diameter: 450,
        material: 'DI',
        yearInstalled: 2015,
        status: 'active',
    },
    {
        id: 'pipe_009',
        from: 'esr_wakad',
        to: 'jn_wakad_main',
        distance: 0.4,
        diameter: 400,
        material: 'DI',
        yearInstalled: 2018,
        status: 'active',
    },

    // Inter-ESR connections (Ring Main)
    {
        id: 'pipe_010',
        from: 'jn_chinchwad_main',
        to: 'jn_pimpri_main',
        distance: 2.2,
        diameter: 500,
        material: 'DI',
        yearInstalled: 2010,
        status: 'active',
    },
    {
        id: 'pipe_011',
        from: 'jn_chinchwad_main',
        to: 'jn_akurdi',
        distance: 1.2,
        diameter: 400,
        material: 'DI',
        yearInstalled: 2012,
        status: 'active',
    },
    {
        id: 'pipe_012',
        from: 'jn_chinchwad_main',
        to: 'jn_nigdi_central',
        distance: 1.8,
        diameter: 450,
        material: 'DI',
        yearInstalled: 2012,
        status: 'active',
    },
    {
        id: 'pipe_013',
        from: 'jn_nigdi_central',
        to: 'jn_talawade',
        distance: 1.5,
        diameter: 350,
        material: 'HDPE',
        yearInstalled: 2018,
        status: 'active',
    },
    {
        id: 'pipe_014',
        from: 'jn_pimpri_main',
        to: 'jn_bhosari_main',
        distance: 5.5,
        diameter: 400,
        material: 'DI',
        yearInstalled: 2014,
        status: 'active',
    },

    // Secondary Distribution Lines
    {
        id: 'pipe_015',
        from: 'jn_pimpri_main',
        to: 'jn_pimpri_east',
        distance: 1.2,
        diameter: 300,
        material: 'DI',
        yearInstalled: 2010,
        status: 'active',
    },
    {
        id: 'pipe_016',
        from: 'jn_pimpri_main',
        to: 'jn_pimpri_west',
        distance: 0.9,
        diameter: 300,
        material: 'DI',
        yearInstalled: 2010,
        status: 'active',
    },
    {
        id: 'pipe_017',
        from: 'jn_pimpri_west',
        to: 'jn_kalewadi',
        distance: 0.7,
        diameter: 250,
        material: 'HDPE',
        yearInstalled: 2016,
        status: 'active',
    },
    {
        id: 'pipe_018',
        from: 'jn_chinchwad_main',
        to: 'jn_chinchwad_north',
        distance: 0.8,
        diameter: 350,
        material: 'DI',
        yearInstalled: 2012,
        status: 'active',
    },
    {
        id: 'pipe_019',
        from: 'jn_nigdi_central',
        to: 'jn_nigdi_south',
        distance: 0.6,
        diameter: 300,
        material: 'HDPE',
        yearInstalled: 2018,
        status: 'active',
    },
    {
        id: 'pipe_020',
        from: 'jn_bhosari_main',
        to: 'jn_bhosari_east',
        distance: 0.9,
        diameter: 300,
        material: 'DI',
        yearInstalled: 2015,
        status: 'active',
    },
    {
        id: 'pipe_021',
        from: 'jn_bhosari_main',
        to: 'jn_dighi',
        distance: 1.3,
        diameter: 300,
        material: 'DI',
        yearInstalled: 2015,
        status: 'active',
    },
    {
        id: 'pipe_022',
        from: 'jn_chinchwad_main',
        to: 'jn_thergaon',
        distance: 1.5,
        diameter: 350,
        material: 'DI',
        yearInstalled: 2014,
        status: 'active',
    },
    {
        id: 'pipe_023',
        from: 'jn_thergaon',
        to: 'jn_wakad_main',
        distance: 1.0,
        diameter: 350,
        material: 'DI',
        yearInstalled: 2016,
        status: 'active',
    },
    {
        id: 'pipe_024',
        from: 'pump_main',
        to: 'esr_pimpri',
        distance: 4.0,
        diameter: 600,
        material: 'DI',
        yearInstalled: 2008,
        status: 'active',
    },
    {
        id: 'pipe_025',
        from: 'pump_bhosari',
        to: 'jn_bhosari_main',
        distance: 0.8,
        diameter: 400,
        material: 'DI',
        yearInstalled: 2015,
        status: 'active',
    },

    // Valve connections
    {
        id: 'pipe_026',
        from: 'jn_pimpri_main',
        to: 'valve_pimpri_1',
        distance: 0.2,
        diameter: 300,
        material: 'DI',
        yearInstalled: 2010,
        status: 'active',
    },
    {
        id: 'pipe_027',
        from: 'jn_chinchwad_main',
        to: 'valve_chinchwad_1',
        distance: 0.15,
        diameter: 350,
        material: 'DI',
        yearInstalled: 2012,
        status: 'active',
    },
    {
        id: 'pipe_028',
        from: 'jn_bhosari_main',
        to: 'valve_bhosari_1',
        distance: 0.2,
        diameter: 300,
        material: 'DI',
        yearInstalled: 2015,
        status: 'active',
    },

    // Additional ring connections for redundancy
    {
        id: 'pipe_029',
        from: 'jn_akurdi',
        to: 'jn_nigdi_south',
        distance: 1.4,
        diameter: 300,
        material: 'HDPE',
        yearInstalled: 2019,
        status: 'active',
    },
    {
        id: 'pipe_030',
        from: 'jn_kalewadi',
        to: 'jn_thergaon',
        distance: 1.0,
        diameter: 250,
        material: 'HDPE',
        yearInstalled: 2017,
        status: 'active',
    },
    {
        id: 'pipe_031',
        from: 'pump_main',
        to: 'esr_nigdi',
        distance: 5.5,
        diameter: 500,
        material: 'DI',
        yearInstalled: 2012,
        status: 'active',
    },
    {
        id: 'pipe_032',
        from: 'pump_main',
        to: 'esr_wakad',
        distance: 6.0,
        diameter: 450,
        material: 'DI',
        yearInstalled: 2018,
        status: 'active',
    },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Build adjacency list from pipeline edges
 */
function buildPipelineGraph() {
    const graph = {};

    // Initialize all nodes
    PIPELINE_NODES.forEach(node => {
        graph[node.id] = {
            ...node,
            neighbors: [],
        };
    });

    // Add edges
    PIPELINE_EDGES.forEach(edge => {
        if (graph[edge.from] && graph[edge.to]) {
            graph[edge.from].neighbors.push({
                nodeId: edge.to,
                edgeId: edge.id,
                distance: edge.distance,
                diameter: edge.diameter,
            });
            // Bidirectional for water flow modeling
            graph[edge.to].neighbors.push({
                nodeId: edge.from,
                edgeId: edge.id,
                distance: edge.distance,
                diameter: edge.diameter,
            });
        }
    });

    return graph;
}

/**
 * Find the nearest pipeline node to given coordinates
 */
function findNearestNode(lat, lng, nodeTypes = null) {
    let minDistance = Infinity;
    let nearestNode = null;

    const nodesToSearch = nodeTypes
        ? PIPELINE_NODES.filter(n => nodeTypes.includes(n.type))
        : PIPELINE_NODES;

    nodesToSearch.forEach(node => {
        const distance = getHaversineDistance(lat, lng, node.coords[0], node.coords[1]);
        if (distance < minDistance) {
            minDistance = distance;
            nearestNode = node;
        }
    });

    return { node: nearestNode, distance: minDistance };
}

/**
 * Calculate Haversine distance in km
 */
function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Get area info by ID
 */
function getAreaById(areaId) {
    return PCMC_AREAS.find(a => a.id === areaId) || null;
}

/**
 * Get node by ID
 */
function getNodeById(nodeId) {
    return PIPELINE_NODES.find(n => n.id === nodeId) || null;
}

/**
 * Get edge by ID
 */
function getEdgeById(edgeId) {
    return PIPELINE_EDGES.find(e => e.id === edgeId) || null;
}

/**
 * Get all nodes of a specific type
 */
function getNodesByType(type) {
    return PIPELINE_NODES.filter(n => n.type === type);
}

/**
 * Get all pipelines in an area
 */
function getPipelinesByArea(areaId) {
    const areaNodes = PIPELINE_NODES.filter(n => n.area === areaId).map(n => n.id);
    return PIPELINE_EDGES.filter(e =>
        areaNodes.includes(e.from) || areaNodes.includes(e.to)
    );
}

// ============================================================================
// SPATIAL UTILITIES
// ============================================================================

function findNearestArea(lat, lng) {
    let nearest = null;
    let minDistance = Infinity;

    PCMC_AREAS.forEach(area => {
        const dist = getHaversineDistance(lat, lng, area.center[0], area.center[1]);
        if (dist < minDistance) {
            minDistance = dist;
            nearest = area;
        }
    });

    if (!nearest) return { area: 'Unknown', ward: 'General' };

    // Simulate Ward assignment (since we don't have ward polygons)
    // Deterministic hash based on coords to pick a ward from the area's list
    const coordSum = Math.abs(lat + lng) * 10000;
    const wardIndex = Math.floor(coordSum) % nearest.wards.length;

    return {
        area: nearest.name,
        ward: nearest.wards[wardIndex]
    };
}

module.exports = {
    PCMC_AREAS,
    PIPELINE_NODES,
    PIPELINE_EDGES,
    NODE_TYPES,
    PIPE_MATERIALS,
    buildPipelineGraph,
    findNearestNode,
    findNearestArea,
    getHaversineDistance,
    getAreaById,
    getNodeById,
    getEdgeById,
    getNodesByType,
    getPipelinesByArea,
};
