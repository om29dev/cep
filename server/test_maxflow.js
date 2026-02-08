/**
 * Test Script for Max-Flow Min-Cut Algorithm (Async/DB Version)
 */

const MaxFlowMinCut = require('./utils/maxFlowMinCut');
const { pool } = require('./db');
const { PCMC_AREAS, findNearestNode } = require('./data/pcmcPipelineData');

async function runTest() {
    console.log("Initializing Max-Flow Min-Cut Analysis...");

    // We need real IDs from the DB now, not hardcoded strings from the old file.
    // Let's find a source node (near a WTP) and sink node (in an area like Pimpri) dynamically.

    // 1. Find Source: Near Pawana WTP location (approx)
    // Pawana WTP coords: [18.6530, 73.7695]
    const sourceSearch = await findNearestNode(18.6530, 73.7695);
    const sourceId = sourceSearch.node ? sourceSearch.node.id : null;

    // 2. Find Sink: Near Pimpri center
    // Pimpri center: [18.6261, 73.8122]
    const sinkSearch = await findNearestNode(18.6261, 73.8122);
    const sinkId = sinkSearch.node ? sinkSearch.node.id : null;

    if (!sourceId || !sinkId) {
        console.error("Could not find suitable Source or Sink nodes in the DB.");
        pool.end();
        return;
    }

    console.log(`Source Node: ${sourceId} (Dist: ${sourceSearch.distance.toFixed(3)}km)`);
    console.log(`Sink Node: ${sinkId} (Dist: ${sinkSearch.distance.toFixed(3)}km)`);

    const solver = new MaxFlowMinCut();

    // Initialize (fetches graph from DB)
    await solver.init();

    console.log(`Analyzing flow from ${sourceId} to ${sinkId}...`);

    const result = await solver.calculateMaxFlow(sourceId, sinkId);

    if (result.error) {
        console.error("Error:", result.error);
        pool.end();
        return;
    }

    console.log(`\nMax Flow Capacity: ${result.maxFlow} units`);

    // Find Bottlenecks
    // Note: getMinCut scans ALL edges, so it might take a moment
    const minCut = await solver.getMinCut(sourceId, sinkId);

    console.log(`\nMin-Cut (Bottleneck) Analysis:`);
    console.log(`Total Bottleneck Pipes: ${minCut.count}`);

    console.log("Bottleneck Edges (Saturated Pipes - First 10):");
    minCut.minCutEdges.slice(0, 10).forEach(edge => {
        console.log(` - ID: ${edge.id} | From: ${edge.from} -> To: ${edge.to} | Diameter: ${edge.diameter}mm`);
    });

    console.log("\nInterpretation:");
    if (minCut.minCutEdges.length > 0) {
        console.log("These pipes are fully saturated at max flow. Upgrading them would increase total system capacity.");
    } else {
        console.log("No specific cut found or flow is 0.");
    }

    pool.end();
}

runTest().catch(err => {
    console.error("Test failed:", err);
    pool.end();
});
