const fs = require('fs');
const path = require('path');

const GRAPH_FILE = path.join(__dirname, '..', 'data', 'pcmc_pipeline_graph.json');

function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadGraph() {
    if (!fs.existsSync(GRAPH_FILE)) {
        console.error('Graph file not found:', GRAPH_FILE);
        process.exit(1);
    }
    const raw = fs.readFileSync(GRAPH_FILE, 'utf8');
    return JSON.parse(raw);
}

function findNearestForEsr(graph, esrNode, maxCandidates = 10) {
    const esrLat = esrNode.coords[0];
    const esrLon = esrNode.coords[1];

    // Mirror emergency_connect filter: exclude types 'esr', 'pump', 'valve', 'reservoir'
    const exclude = new Set(['esr', 'pump', 'valve', 'reservoir']);

    const candidates = Object.values(graph)
        .filter(n => !exclude.has(n.type) && n.id !== esrNode.id && Array.isArray(n.coords))
        .map(n => ({ node: n, distKm: getDistanceKm(esrLat, esrLon, n.coords[0], n.coords[1]) }))
        .sort((a, b) => a.distKm - b.distKm);

    return candidates.slice(0, maxCandidates);
}

function main() {
    const graph = loadGraph();
    const nodes = Object.values(graph);
    const esrs = nodes.filter(n => n.type === 'esr');

    if (esrs.length === 0) {
        console.log('No ESR nodes found in graph.');
        return;
    }

    console.log(`Found ${esrs.length} ESR(s). Showing nearest candidates for up to first 10 ESRs.`);

    for (let i = 0; i < Math.min(10, esrs.length); i++) {
        const esr = esrs[i];
        console.log('\n=== ESR:', esr.id, esr.name || '', `coords=${esr.coords.join(',')}`);
        const candidates = findNearestForEsr(graph, esr, 8);
        if (candidates.length === 0) {
            console.log('  No network candidates found (graph may be filtered).');
            continue;
        }

        candidates.forEach((c, idx) => {
            console.log(`  ${idx + 1}. node=${c.node.id} type=${c.node.type} name=${c.node.name || ''} dist_km=${c.distKm.toFixed(4)}`);
        });

        const chosen = candidates.find(c => c.distKm > 0) || candidates[0];
        console.log('  -> chosen (first non-zero dist):', chosen.node.id, `(${chosen.distKm.toFixed(3)} km)`);
    }
}

main();
