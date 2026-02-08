const { buildPipelineGraph } = require('./data/pcmcPipelineData');
const { pool } = require('./db');

async function verifyConnectivity() {
    try {
        console.log("Building Graph...");
        const graph = await buildPipelineGraph();
        const nodes = Object.values(graph);
        console.log(`Graph built. Total Nodes: ${nodes.length}`);

        const esrs = nodes.filter(n => n.type === 'esr');
        console.log(`Found ${esrs.length} ESRs.`);

        for (const esr of esrs) {
            // BFS to count reachable nodes
            const visited = new Set();
            const queue = [esr.id];
            visited.add(esr.id);

            while (queue.length > 0) {
                const currentId = queue.shift();
                const node = graph[currentId];

                if (node && node.neighbors) {
                    for (const neighbor of node.neighbors) {
                        if (!visited.has(neighbor.nodeId)) {
                            visited.add(neighbor.nodeId);
                            queue.push(neighbor.nodeId);
                        }
                    }
                }
            }

            console.log(`ESR ${esr.name} (${esr.id}) can reach ${visited.size} nodes.`);
        }

    } catch (e) {
        console.error("Verification failed:", e);
    } finally {
        pool.end();
    }
}

verifyConnectivity();
