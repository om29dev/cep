/**
 * OSM to Pipeline Database Importer
 * 
 * Reads raw OpenStreetMap JSON data and imports it into the PostgreSQL database.
 * - Truncates existing `pipeline_nodes` and `pipeline_edges` tables.
 * - Converts OSM Nodes/Ways to Pipeline Nodes/Edges.
 * - Performs batch INSERTs for performance.
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../db');
const { getHaversineDistance } = require('../data/pcmcPipelineData');

const RAW_DATA_FILE = path.join(__dirname, '../data/pcmc_osm_raw.json');

// Pipeline Standards based on Road Hierarchy
const DIAMETER_MAPPING = {
    'trunk': 1200,
    'primary': 1000,
    'secondary': 600,
    'tertiary': 400,
    'residential': 200,
    'service': 150,
    'default': 200
};

async function importOsmToDb() {
    if (!fs.existsSync(RAW_DATA_FILE)) {
        console.error("Raw OSM data file not found. Run 'node server/scripts/fetch_osm_data.js' first.");
        return;
    }

    const client = await pool.connect();

    try {
        console.log("Reading raw OSM data...");
        const rawData = JSON.parse(fs.readFileSync(RAW_DATA_FILE, 'utf8'));

        console.log("Indexing OSM data...");
        const nodes = {};
        const ways = [];

        rawData.elements.forEach(el => {
            if (el.type === 'node') {
                nodes[el.id] = { id: el.id.toString(), lat: el.lat, lon: el.lon, tags: el.tags || {} };
            } else if (el.type === 'way') {
                ways.push(el);
            }
        });

        const pipelineNodes = [];
        const pipelineEdges = [];
        const processedNodeIds = new Set();

        // --- 1. Process Water Infrastructure ---
        Object.values(nodes).forEach(node => {
            if (node.tags.man_made && ['water_tower', 'storage_tank', 'reservoir', 'water_works'].includes(node.tags.man_made)) {
                pipelineNodes.push({
                    id: `inf_${node.id}`,
                    type: node.tags.man_made === 'water_works' ? 'reservoir' : 'esr',
                    name: node.tags.name || `Water Structure ${node.id}`,
                    lat: node.lat,
                    lon: node.lon,
                    capacity: 50,
                    status: 'active',
                    area: 'pcmc'
                });
                processedNodeIds.add(node.id);
            }
        });

        // --- 2. Process Roads as Pipelines ---
        ways.forEach(way => {
            if (!way.nodes || way.nodes.length < 2) return;

            const highwayType = way.tags.highway || 'default';
            const diameter = DIAMETER_MAPPING[highwayType] || DIAMETER_MAPPING['default'];

            for (let i = 0; i < way.nodes.length - 1; i++) {
                const nodeId1 = way.nodes[i];
                const nodeId2 = way.nodes[i + 1];
                const n1 = nodes[nodeId1];
                const n2 = nodes[nodeId2];

                if (!n1 || !n2) continue;

                // Add Junction Nodes if needed
                [n1, n2].forEach(n => {
                    if (!processedNodeIds.has(n.id)) {
                        pipelineNodes.push({
                            id: n.id.toString(),
                            type: 'junction',
                            name: `Junction ${n.id}`,
                            lat: n.lat,
                            lon: n.lon,
                            capacity: 0,
                            status: 'active',
                            area: 'pcmc'
                        });
                        processedNodeIds.add(n.id);
                    }
                });

                const distance = getHaversineDistance(n1.lat, n1.lon, n2.lat, n2.lon);

                pipelineEdges.push({
                    id: `pipe_${way.id}_${i}`,
                    source_id: n1.id.toString(),
                    target_id: n2.id.toString(),
                    diameter: diameter,
                    material: diameter > 600 ? 'MS' : 'DI',
                    status: 'active',
                    distance: distance,
                    original_way_id: way.id
                });
            }
        });

        console.log(`Prepared ${pipelineNodes.length} nodes and ${pipelineEdges.length} edges for import.`);

        // --- 3. Database Insertion ---
        await client.query('BEGIN');

        console.log("Truncating existing tables...");
        await client.query('TRUNCATE TABLE pipeline_edges CASCADE');
        await client.query('TRUNCATE TABLE pipeline_nodes CASCADE');

        console.log("Inserting Nodes...");
        // Split into chunks to avoid query param limits
        const NODE_CHUNK_SIZE = 1000;
        for (let i = 0; i < pipelineNodes.length; i += NODE_CHUNK_SIZE) {
            const chunk = pipelineNodes.slice(i, i + NODE_CHUNK_SIZE);
            const values = [];
            const placeholders = chunk.map((n, idx) => {
                const offset = idx * 8;
                values.push(n.id, n.type, n.name, n.lat, n.lon, n.capacity, n.status, n.area);
                return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
            }).join(',');

            const query = `INSERT INTO pipeline_nodes (id, type, name, lat, lon, capacity, status, area) VALUES ${placeholders} ON CONFLICT (id) DO NOTHING`;
            await client.query(query, values);
            process.stdout.write(`\rImported Nodes: ${Math.min(i + NODE_CHUNK_SIZE, pipelineNodes.length)}/${pipelineNodes.length}`);
        }
        console.log("\nNodes imported.");

        console.log("Inserting Edges...");
        const EDGE_CHUNK_SIZE = 1000;
        for (let i = 0; i < pipelineEdges.length; i += EDGE_CHUNK_SIZE) {
            const chunk = pipelineEdges.slice(i, i + EDGE_CHUNK_SIZE);
            const values = [];
            const placeholders = chunk.map((e, idx) => {
                const offset = idx * 8;
                values.push(e.id, e.source_id, e.target_id, e.diameter, e.material, e.status, e.distance, e.original_way_id);
                return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
            }).join(',');

            const query = `INSERT INTO pipeline_edges (id, source_id, target_id, diameter, material, status, distance, original_way_id) VALUES ${placeholders} ON CONFLICT (id) DO NOTHING`;
            await client.query(query, values);
            process.stdout.write(`\rImported Edges: ${Math.min(i + EDGE_CHUNK_SIZE, pipelineEdges.length)}/${pipelineEdges.length}`);
        }
        console.log("\nEdges imported.");

        await client.query('COMMIT');
        console.log("Database Import Complete Successfully!");

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error during import:", e);
    } finally {
        client.release();
        pool.end();
    }
}

importOsmToDb();
