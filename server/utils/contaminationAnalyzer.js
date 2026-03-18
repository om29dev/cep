/**
 * Contamination Analysis Engine
 * Server-side version (CommonJS)
 */

const { getHaversineDistance, findNearestNode } = require('../data/pcmcPipelineData');
const { traceDownstream, dijkstra } = require('./dijkstra');

// ============================================================================
// CONSTANTS
// ============================================================================

const CORRELATION_RADIUS_KM = 1.0;
const HIGH_RISK_CATEGORIES = ['Contaminated Water', 'Water Leakage'];
const CRITICAL_CATEGORIES = ['No Water Supply', 'Contaminated Water'];

const URGENCY_WEIGHTS = {
    'Emergency': 100,
    'High': 75,
    'Medium': 50,
    'Low': 25,
    'Unknown': 30,
};

const CATEGORY_SEVERITY = {
    'Contaminated Water': 95,
    'No Water Supply': 90,
    'Water Leakage': 80,
    'Low Water Pressure': 60,
    'Drainage & Sewage': 70,
    'Illegal Connection': 50,
    'Other Water Issue': 40,
};

// ============================================================================
// COMPLAINT CORRELATION
// ============================================================================

function correlateComplaints(complaints, radiusKm = CORRELATION_RADIUS_KM) {
    const clusters = [];
    const processed = new Set();

    const validComplaints = complaints.filter(c =>
        c.location && c.status !== 'resolved' && c.category !== 'Non-Water Related'
    );

    validComplaints.forEach(complaint => {
        if (processed.has(complaint.id)) return;

        const coords = parseCoords(complaint.location);
        if (!coords) return;

        const cluster = {
            id: `cluster_${clusters.length + 1}`,
            center: coords,
            complaints: [complaint],
            categories: new Set([complaint.category]),
            hasLeakage: complaint.category === 'Water Leakage',
            hasContamination: complaint.category === 'Contaminated Water',
            hasNoSupply: complaint.category === 'No Water Supply',
            riskScore: 0,
            correlationType: null,
        };

        processed.add(complaint.id);

        validComplaints.forEach(other => {
            if (processed.has(other.id)) return;

            const otherCoords = parseCoords(other.location);
            if (!otherCoords) return;

            const distance = getHaversineDistance(
                coords[0], coords[1],
                otherCoords[0], otherCoords[1]
            );

            if (distance <= radiusKm) {
                cluster.complaints.push(other);
                cluster.categories.add(other.category);
                processed.add(other.id);

                if (other.category === 'Water Leakage') cluster.hasLeakage = true;
                if (other.category === 'Contaminated Water') cluster.hasContamination = true;
                if (other.category === 'No Water Supply') cluster.hasNoSupply = true;

                cluster.center = calculateCentroid([...cluster.complaints.map(c => parseCoords(c.location))]);
            }
        });

        const clusterNumber = clusters.length + 1;

        if (cluster.hasLeakage && cluster.hasContamination) {
            cluster.correlationType = 'LEAKAGE_CONTAMINATION';
            cluster.title = `Cluster ${clusterNumber}: Leakage Contamination`;
            cluster.recommendation = 'Inspect leakage point for sewage ingress. Priority: CRITICAL';
        } else if (cluster.hasLeakage && cluster.hasNoSupply) {
            cluster.correlationType = 'LEAKAGE_DISRUPTION';
            cluster.title = `Cluster ${clusterNumber}: Major Pipeline Break`;
            cluster.recommendation = 'Major leak disrupting supply. Deploy repair team immediately.';
        } else if (cluster.hasContamination && cluster.complaints.length > 1) {
            cluster.correlationType = 'WIDESPREAD_CONTAMINATION';
            cluster.title = `Cluster ${clusterNumber}: Widespread Contamination`;
            cluster.recommendation = 'Multiple contamination reports. Check ESR/source for issue.';
        } else if (cluster.complaints.length > 1) {
            cluster.correlationType = 'HOTSPOT';
            cluster.title = `Cluster ${clusterNumber}: Weak Hotspot`;
            cluster.recommendation = 'Multiple issues in area. Schedule comprehensive inspection.';
        } else {
            cluster.correlationType = 'ISOLATED';
            cluster.title = 'Isolated Issue';
            cluster.recommendation = 'Handle as individual complaint.';
        }

        cluster.riskScore = calculateClusterRisk(cluster);
        clusters.push(cluster);
    });

    return clusters.sort((a, b) => b.riskScore - a.riskScore);
}

const { buildPipelineGraph } = require('../data/pcmcPipelineData');

async function analyzeContaminationSource(complaint, allComplaints) {
    const graph = await buildPipelineGraph();
    const PIPELINE_NODES = Object.values(graph);

    const coords = parseCoords(complaint.location);
    if (!coords) return null;

    const { node: nearestNode, distance } = await findNearestNode(coords[0], coords[1]);

    // 1. Check for nearby Leakage Complaints (Existing logic)
    const leakageComplaints = allComplaints.filter(c => {
        if (c.category !== 'Water Leakage' || c.status === 'resolved') return false;
        const otherCoords = parseCoords(c.location);
        if (!otherCoords) return false;

        const dist = getHaversineDistance(coords[0], coords[1], otherCoords[0], otherCoords[1]);
        return dist <= CORRELATION_RADIUS_KM;
    });

    const upstreamNodes = nearestNode ? await findUpstreamNodes(nearestNode.id, graph) : [];

    const potentialSources = [];

    // Add Leakage Complaints as sources
    for (const leak of leakageComplaints) {
        const leakCoords = parseCoords(leak.location);
        const { node: leakNode } = await findNearestNode(leakCoords[0], leakCoords[1]);

        potentialSources.push({
            type: 'COMPLAINT',
            id: leak.id,
            description: `Leaking pipe reported at ${leak.district}`,
            distance: getHaversineDistance(coords[0], coords[1], leakCoords[0], leakCoords[1]),
            likelySource: upstreamNodes.some(n => n.id === leakNode?.id),
            coordinates: leakCoords
        });
    }

    // 2. Check for Infrastructure Hazards (New Logic)
    // Find nearby valves or junctions that might be points of failure
    const nearbyInfrastructure = PIPELINE_NODES.filter(node =>
        (node.type === 'valve' || node.type === 'junction') &&
        getHaversineDistance(coords[0], coords[1], node.coords[0], node.coords[1]) < 0.3 // 300m radius
    );

    nearbyInfrastructure.forEach(node => {
        potentialSources.push({
            type: 'INFRASTRUCTURE',
            id: node.id,
            description: `${node.name || node.type} nearby`,
            distance: getHaversineDistance(coords[0], coords[1], node.coords[0], node.coords[1]),
            likelySource: true, // Asset failure is always a potential source
            coordinates: node.coords
        });
    });

    return {
        contaminationPoint: { coords, nearestNode, distanceToNode: distance },
        potentialSources: potentialSources.sort((a, b) => a.distance - b.distance),
        upstreamPath: upstreamNodes,
        risk: calculateContaminationRisk(complaint, potentialSources),
        recommendation: generateContaminationRecommendation(complaint, potentialSources),
    };
}

function findAffectedDownstream(complaint, maxHops = 5) {
    const coords = parseCoords(complaint.location);
    if (!coords) return null;

    const { node: nearestNode } = findNearestNode(coords[0], coords[1]);
    if (!nearestNode) return null;

    const downstream = traceDownstream(nearestNode.id, maxHops);

    if (!downstream.success) return null;

    const affectedAreas = new Set();
    downstream.affectedNodes.forEach(node => {
        if (node.area) affectedAreas.add(node.area);
    });

    return {
        sourceNode: nearestNode,
        affectedNodes: downstream.affectedNodes,
        affectedEdges: downstream.affectedEdges,
        affectedAreas: Array.from(affectedAreas),
        severity: downstream.affectedNodes.length > 5 ? 'HIGH' :
            downstream.affectedNodes.length > 2 ? 'MEDIUM' : 'LOW',
    };
}

function prioritizeComplaints(complaints) {
    const scored = complaints
        .filter(c => c.status !== 'resolved')
        .map(c => ({
            ...c,
            priorityScore: calculatePriorityScore(c),
            severity: getSeverityLevel(c),
        }))
        .sort((a, b) => b.priorityScore - a.priorityScore);

    return {
        critical: scored.filter(c => c.severity === 'CRITICAL'),
        high: scored.filter(c => c.severity === 'HIGH'),
        medium: scored.filter(c => c.severity === 'MEDIUM'),
        low: scored.filter(c => c.severity === 'LOW'),
        all: scored,
    };
}

function calculatePriorityScore(complaint) {
    let score = 0;

    // 1. Base Category Score (Weights: 40-95)
    score += CATEGORY_SEVERITY[complaint.category] || 30;

    // 2. AI Urgency Score (Weights: 25-100)
    score += URGENCY_WEIGHTS[complaint.ai_urgency] || URGENCY_WEIGHTS['Unknown'];

    // 3. Time Factor (Conservative Growth)
    // +0.5 points per hour to ensure High Severity always stays on top of Low Severity
    // Cap at 24 points (48 hours)
    if (complaint.created_at) {
        const ageHours = (Date.now() - new Date(complaint.created_at)) / (1000 * 60 * 60);
        const timeBonus = Math.min(Math.round(ageHours * 0.5), 24);
        score += timeBonus;
    }

    return score;
}

function getSeverityLevel(complaint) {
    const score = complaint.priorityScore || calculatePriorityScore(complaint);

    if (score >= 160 || complaint.ai_urgency === 'Emergency') return 'CRITICAL';
    if (score >= 120 || complaint.ai_urgency === 'High') return 'HIGH';
    if (score >= 80) return 'MEDIUM';
    return 'LOW';
}

function generateRecommendations(complaint, correlatedComplaints = []) {
    const recommendations = [];
    const category = complaint.category;

    switch (category) {
        case 'Water Leakage':
            recommendations.push({
                action: 'DISPATCH_REPAIR',
                title: 'Dispatch Repair Team',
                description: 'Send pipeline repair team to fix the leak',
                priority: 'HIGH',
                estimatedTime: '2-4 hours',
            });
            recommendations.push({
                action: 'ISOLATE_VALVE',
                title: 'Consider Valve Isolation',
                description: 'If leak is major, isolate the section using nearest control valve',
                priority: 'MEDIUM',
                estimatedTime: '30 mins',
            });
            break;

        case 'Contaminated Water':
            recommendations.push({
                action: 'WATER_TESTING',
                title: 'Immediate Water Testing',
                description: 'Collect samples for lab testing to identify contaminants',
                priority: 'CRITICAL',
                estimatedTime: '1-2 hours',
            });
            recommendations.push({
                action: 'ADVISORY',
                title: 'Issue Public Advisory',
                description: 'Warn residents to avoid using water until cleared',
                priority: 'CRITICAL',
                estimatedTime: 'Immediate',
            });
            if (correlatedComplaints.some(c => c.category === 'Water Leakage')) {
                recommendations.push({
                    action: 'FIX_SOURCE',
                    title: 'Fix Correlated Leakage',
                    description: 'Nearby leakage may be source of contamination - fix first',
                    priority: 'CRITICAL',
                    estimatedTime: '2-4 hours',
                });
            }
            break;

        case 'No Water Supply':
            recommendations.push({
                action: 'CHECK_UPSTREAM',
                title: 'Check Upstream Infrastructure',
                description: 'Verify ESR levels, pump status, and valve positions',
                priority: 'HIGH',
                estimatedTime: '30 mins',
            });
            recommendations.push({
                action: 'TANKER_DISPATCH',
                title: 'Arrange Water Tanker',
                description: 'Dispatch emergency water tanker to affected area',
                priority: 'HIGH',
                estimatedTime: '1-2 hours',
            });
            break;

        case 'Low Water Pressure':
            recommendations.push({
                action: 'PRESSURE_CHECK',
                title: 'Pressure Survey',
                description: 'Measure pressure at multiple points in the network',
                priority: 'MEDIUM',
                estimatedTime: '2 hours',
            });
            recommendations.push({
                action: 'LEAK_CHECK',
                title: 'Check for Hidden Leaks',
                description: 'Low pressure may indicate leak - inspect pipeline',
                priority: 'MEDIUM',
                estimatedTime: '3-4 hours',
            });
            break;

        case 'Drainage & Sewage':
            recommendations.push({
                action: 'DRAINAGE_CLEAR',
                title: 'Clear Blockage',
                description: 'Deploy drainage team to clear blockage',
                priority: 'HIGH',
                estimatedTime: '2-3 hours',
            });
            recommendations.push({
                action: 'PROXIMITY_CHECK',
                title: 'Check Water Line Proximity',
                description: 'Ensure sewage isn\'t contaminating nearby water pipes',
                priority: 'HIGH',
                estimatedTime: '1 hour',
            });
            break;

        default:
            recommendations.push({
                action: 'INSPECT',
                title: 'General Inspection',
                description: 'Send field team for on-site assessment',
                priority: 'MEDIUM',
                estimatedTime: '2-3 hours',
            });
    }

    return recommendations;
}

function parseCoords(locationString) {
    if (!locationString) return null;
    try {
        const cleaned = locationString.replace(/[()]/g, '');
        const [lat, lng] = cleaned.split(',').map(s => parseFloat(s.trim()));
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    } catch (e) { }
    return null;
}

function calculateCentroid(coords) {
    const valid = coords.filter(c => c !== null);
    if (valid.length === 0) return null;

    const sum = valid.reduce(
        (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
        [0, 0]
    );

    return [sum[0] / valid.length, sum[1] / valid.length];
}

function calculateClusterRisk(cluster) {
    let risk = 0;

    risk += cluster.complaints.length * 15;

    if (cluster.hasLeakage && cluster.hasContamination) risk += 50;
    if (cluster.hasLeakage && cluster.hasNoSupply) risk += 40;
    if (cluster.hasContamination) risk += 30;

    cluster.complaints.forEach(c => {
        risk += (CATEGORY_SEVERITY[c.category] || 30) / 4;
    });

    cluster.complaints.forEach(c => {
        risk += (URGENCY_WEIGHTS[c.ai_urgency] || 30) / 4;
    });

    return Math.min(Math.round(risk), 100);
}

function calculateContaminationRisk(complaint, sources) {
    let risk = CATEGORY_SEVERITY['Contaminated Water'];

    if (sources.length > 0) {
        risk += 20;
    }

    if (complaint.ai_urgency === 'Emergency') risk += 30;

    return Math.min(risk, 100);
}

function generateContaminationRecommendation(complaint, sources) {
    if (sources.length > 0) {
        return `Found ${sources.length} potential source(s) of contamination from nearby leakages. ` +
            `Priority: Fix leakage at nearest point, then flush lines and retest water quality.`;
    }
    return 'No obvious source found. Check ESR/storage tank for contamination. ' +
        'Collect samples for laboratory analysis.';
}

async function findUpstreamNodes(nodeId, graph) {
    const upstream = [];
    const sources = Object.values(graph).filter(n => n.type === 'reservoir' || n.type === 'esr');

    for (const source of sources) {
        // Pass graph to avoid rebuilding it
        const path = await dijkstra(source.id, nodeId, {}, graph);
        if (path.success) {
            // dijkstra returns .path (array of IDs) or something?
            // Checking dijkstra.js again: returns { success, path, edges, totalDistance, nodeCount }
            // path is array of IDs.
            // But code below tries `path.pathNodes`.
            // dijkstra.js (Step 178) does NOT return `pathNodes`. It returns `path` (IDs).
            // So we need to map IDs to nodes using the graph.
            const nodes = path.path.map(id => graph[id]).filter(n => n);
            upstream.push(...nodes);
        }
    }

    // Return unique nodes by ID
    return [...new Map(upstream.map(n => [n.id, n])).values()];
}

module.exports = {
    correlateComplaints,
    analyzeContaminationSource,
    findAffectedDownstream,
    prioritizeComplaints,
    generateRecommendations,
    URGENCY_WEIGHTS,
    CATEGORY_SEVERITY,
};
