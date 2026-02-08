/**
 * Export Pipeline Data from DB to JSON
 * Usage: node server/scripts/export_db_to_json.js
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

const OUTPUT_FILE = path.join(__dirname, '../data/pcmc_pipeline_graph.json');

async function exportData() {
    const client = await pool.connect();
    try {
        console.log("Fetching data from DB...");

        // 1. Fetch Nodes
        const nodesRes = await client.query('SELECT * FROM pipeline_nodes');
        const nodes = nodesRes.rows;
        console.log(`Fetched ${nodes.length} nodes.`);

        // 2. Fetch Edges
        const edgesRes = await client.query('SELECT * FROM pipeline_edges');
        const edges = edgesRes.rows;
        console.log(`Fetched ${edges.length} edges.`);

        // 3. Build Graph Structure (preserves relationships)
        const graph = {};

        // Initialize Nodes
        nodes.forEach(row => {
            const lat = parseFloat(row.lat);
            const lon = parseFloat(row.lon);

            if (isNaN(lat) || isNaN(lon)) {
                // console.warn(`Skipping invalid node ${row.id}: ${row.lat}, ${row.lon}`);
                return;
            }

            graph[row.id] = {
                id: row.id,
                type: row.type,
                name: row.name,
                coords: [lat, lon],
                capacity: row.capacity,
                status: row.status,
                area: row.area,
                neighbors: []
            };
        });

        // Add Edges
        edges.forEach(edge => {
            const fromNode = graph[edge.source_id];
            const toNode = graph[edge.target_id];

            if (fromNode && toNode) {
                const distance = parseFloat(edge.distance) || 0;

                // Add Neighbor to Source
                fromNode.neighbors.push({
                    nodeId: edge.target_id,
                    edgeId: edge.id,
                    diameter: edge.diameter,
                    distance
                });

                // Add Neighbor to Target (Undirected Graph)
                toNode.neighbors.push({
                    nodeId: edge.source_id,
                    edgeId: edge.id,
                    diameter: edge.diameter,
                    distance
                });
            }
        });

        // 4. Save to File
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(graph, null, 2));
        console.log(`Successfully exported graph to ${OUTPUT_FILE}`);
        console.log(`Exported Graph Nodes: ${Object.keys(graph).length}`);

    } catch (e) {
        console.error("Export failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

exportData();
