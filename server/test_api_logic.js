const { buildPipelineGraph } = require('./data/pcmcPipelineData');
const { pool } = require('./db');

async function testApiLogic() {
    try {
        console.log("Fetching graph...");
        const graph = await buildPipelineGraph();
        console.log("Graph fetched. Nodes:", Object.keys(graph).length);

        const allNodes = Object.values(graph);

        const infrastructureNodes = allNodes.filter(n =>
            n.type === 'reservoir' ||
            n.type === 'esr' ||
            n.type === 'pump' ||
            n.type === 'valve'
        );

        const typeCounts = {};
        infrastructureNodes.forEach(n => { typeCounts[n.type] = (typeCounts[n.type] || 0) + 1; });
        console.log("Infrastructure Nodes:", typeCounts);

        // Check if any sample node has correct coords
        const pump = infrastructureNodes.find(n => n.type === 'pump');
        if (pump) console.log("Sample Pump:", pump);

        const valve = infrastructureNodes.find(n => n.type === 'valve');
        if (valve) console.log("Sample Valve:", valve);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        pool.end();
    }
}

testApiLogic();
