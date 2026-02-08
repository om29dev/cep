const { buildPipelineGraph } = require('./data/pcmcPipelineData');
const { pool } = require('./db');

async function debugPath() {
    try {
        const graph = await buildPipelineGraph();

        const sourceId = 'inf_13382599924';
        const targetId = '2215898773';

        const source = graph[sourceId];
        const target = graph[targetId];

        console.log(`Source (${sourceId}):`, source ? `Found, Neighbors: ${source.neighbors.length}` : 'Not Found');
        if (source) {
            console.log("Source Neighbors:", source.neighbors.map(n => n.nodeId));
        }

        console.log(`Target (${targetId}):`, target ? `Found, Neighbors: ${target.neighbors.length}` : 'Not Found');
        if (target) {
            console.log("Target Neighbors:", target.neighbors.map(n => n.nodeId));
        }

        // Check if target is reachable from source using BFS
        if (source && target) {
            console.log("Checking reachability...");
            const visited = new Set();
            const queue = [sourceId];
            visited.add(sourceId);
            let reachable = false;
            let nodesCount = 0;

            while (queue.length > 0) {
                const currId = queue.shift();
                nodesCount++;
                if (currId === targetId) {
                    reachable = true;
                    break;
                }
                const node = graph[currId];
                if (node && node.neighbors) {
                    for (const n of node.neighbors) {
                        if (!visited.has(n.nodeId)) {
                            visited.add(n.nodeId);
                            queue.push(n.nodeId);
                        }
                    }
                }
            }
            console.log(`Reachable: ${reachable}`);
            console.log(`Total nodes reachable from source: ${nodesCount}`);
        }

    } catch (e) {
        console.error("Debug failed:", e);
    } finally {
        pool.end();
    }
}

debugPath();
