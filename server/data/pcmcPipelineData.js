/**
 * PCMC Water Pipeline Network Data Provider
 * Fetches data from PostgreSQL Database
 */

const { pool } = require('../db');

// ============================================================================
// STATIC REFERENCE DATA (Areas/Wards)
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
// DATA FETCHING FUNCTIONS (Async from DB)
// ============================================================================

/**
 * Builds the graph from the database.
 * Returns an object map where keys are Node IDs.
 */
const fs = require('fs');
const path = require('path');

const GRAPH_FILE = path.join(__dirname, 'pcmc_pipeline_graph.json');
let cachedGraph = null;

/**
 * Builds the graph from the local JSON file.
 * Returns an object map where keys are Node IDs.
 */
async function buildPipelineGraph() {
    if (cachedGraph) return cachedGraph;

    if (!fs.existsSync(GRAPH_FILE)) {
        console.error(`Graph file not found: ${GRAPH_FILE}`);
        return {};
    }

    try {
        const data = fs.readFileSync(GRAPH_FILE, 'utf8');
        cachedGraph = JSON.parse(data);
        console.log(`[PIPELINE] Loaded ${Object.keys(cachedGraph).length} nodes from local JSON.`);
        return cachedGraph;
    } catch (e) {
        console.error("Error reading pipeline graph from JSON:", e);
        return {};
    }
}

/**
 * Helpers (now async or requiring graph pass-in)
 */
function getHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findNearestNode(lat, lng, nodeTypes = null) {
    const graph = await buildPipelineGraph(); // This assumes checking entire graph
    let minDistance = Infinity;
    let nearestNode = null;

    Object.values(graph).forEach(node => {
        if (!nodeTypes || nodeTypes.includes(node.type)) {
            const distance = getHaversineDistance(lat, lng, node.coords[0], node.coords[1]);
            if (distance < minDistance) { minDistance = distance; nearestNode = node; }
        }
    });

    return { node: nearestNode, distance: minDistance };
}

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
        return {
            area: nearestArea.name,
            areaId: nearestArea.id,
            ward: nearestArea.wards[0],
            distance: minDistance,
            center: nearestArea.center
        };
    }

    return { area: 'Unknown', areaId: null, ward: 'General', distance: null, center: null };
}

module.exports = {
    PCMC_AREAS, NODE_TYPES, DEPARTMENT_CONTACT,
    buildPipelineGraph, findNearestNode, findNearestArea, getHaversineDistance
};
