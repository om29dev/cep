/**
 * Dijkstra's Algorithm for Water Pipeline Pathfinding
 * Server-side version (Async/DB enabled)
 */

const { buildPipelineGraph, getHaversineDistance } = require('../data/pcmcPipelineData');

/**
 * Priority Queue implementation using Min-Heap
 */
class PriorityQueue {
    constructor() { this.heap = []; }
    push(item, priority) { this.heap.push({ item, priority }); this.bubbleUp(this.heap.length - 1); }
    pop() {
        if (this.heap.length === 0) return null;
        const min = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0) { this.heap[0] = end; this.bubbleDown(0); }
        return min.item;
    }
    isEmpty() { return this.heap.length === 0; }
    bubbleUp(index) {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.heap[parent].priority <= this.heap[index].priority) break;
            [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
            index = parent;
        }
    }
    bubbleDown(index) {
        const length = this.heap.length;
        while (true) {
            const left = 2 * index + 1;
            const right = 2 * index + 2;
            let smallest = index;
            if (left < length && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
            if (right < length && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
            if (smallest === index) break;
            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            index = smallest;
        }
    }
}

/**
 * Dijkstra's Algorithm to find shortest path between two nodes
 */
async function dijkstra(startNodeId, endNodeId, options = {}, existingGraph = null) {
    const graph = existingGraph || await buildPipelineGraph();

    const {
        avoidNodes = [],
        avoidEdges = [],
        preferLargeDiameter = false,
    } = options;

    if (!graph[startNodeId]) return { success: false, error: `Start node '${startNodeId}' not found` };
    if (!graph[endNodeId]) return { success: false, error: `End node '${endNodeId}' not found` };

    const distances = {};
    const previous = {};
    const previousEdge = {};
    const visited = new Set();
    const pq = new PriorityQueue();

    Object.keys(graph).forEach(nodeId => distances[nodeId] = Infinity);
    distances[startNodeId] = 0;
    pq.push(startNodeId, 0);

    while (!pq.isEmpty()) {
        const currentNodeId = pq.pop();
        if (visited.has(currentNodeId)) continue;
        visited.add(currentNodeId);

        if (currentNodeId === endNodeId) break;

        const currentNode = graph[currentNodeId];

        for (const neighbor of currentNode.neighbors) {
            if (visited.has(neighbor.nodeId)) continue;
            if (avoidNodes.includes(neighbor.nodeId)) continue;
            if (avoidEdges.includes(neighbor.edgeId)) continue;

            let weight = neighbor.distance;
            if (preferLargeDiameter && neighbor.diameter) {
                weight = weight * (1000 / neighbor.diameter);
            }

            const newDistance = distances[currentNodeId] + weight;

            if (newDistance < distances[neighbor.nodeId]) {
                distances[neighbor.nodeId] = newDistance;
                previous[neighbor.nodeId] = currentNodeId;
                previousEdge[neighbor.nodeId] = neighbor.edgeId;
                pq.push(neighbor.nodeId, newDistance);
            }
        }
    }

    if (distances[endNodeId] === Infinity) {
        return { success: false, error: 'No path found between the specified nodes' };
    }

    const path = [];
    const edges = [];
    let current = endNodeId;

    while (current) {
        path.unshift(current);
        if (previousEdge[current]) edges.unshift(previousEdge[current]);
        current = previous[current];
    }

    // Since we don't have direct edge map loaded efficiently, we'd need another query or map.
    // For simplicity, we re-use neighbor data or assume we can just return IDs for now.
    // If we need detailed edge objects, we might need a separate lookup or pass full objects.

    return {
        success: true,
        path,
        edges,
        totalDistance: Math.round(distances[endNodeId] * 100) / 100,
        nodeCount: path.length
    };
}

/**
 * Finds the optimal connection route from a given location to the nearest water source
 */
async function findOptimalConnectionRoute(lat, lng) {
    console.log(`\n--- Route Planning Request ---`);
    console.log(`Target: ${lat}, ${lng}`);

    const { getHaversineDistance } = require('../data/pcmcPipelineData');

    // Build Graph ONCE for the entire operation
    const graph = await require('../data/pcmcPipelineData').buildPipelineGraph();

    // 1. Find nearest node to target location (Manually using the graph we just built to save DB calls)
    // 1. Find nearest NODES candidates (plural)
    // We get top candidates to avoid getting stuck on a "dead" pipe segment (disconnected subgraph)
    const candidates = [];
    Object.values(graph).forEach(node => {
        const d = getHaversineDistance(lat, lng, node.coords[0], node.coords[1]);
        if (d < 10.0) { // Search radius 10km
            candidates.push({ node, dist: d });
        }
    });

    // Increase candidate search depth significantly to find a connected node
    candidates.sort((a, b) => a.dist - b.dist);
    const topCandidates = candidates.slice(0, 100); // Check top 100 closest infrastructure points

    let route = null;
    let nearestNode = null; // This will become our actual connection point
    let finalSource = null;
    let minDist = Infinity;
    let fallbackUsed = false;

    if (topCandidates.length > 0) {
        console.log(`Found ${topCandidates.length} nearby infrastructure candidates. Checking connectivity...`);

        for (const cand of topCandidates) {
            // Optimization: Prioritize 'junction' type slightly if dists are very close?
            // For now, strict distance is best for cost correctness.

            // Check if this node connects to ANY water source
            // Pass preferLargeDiameter: false because we just want ANY valid connection.
            const pathResult = await findPathToAnySource(cand.node.id, graph, { preferLargeDiameter: false });

            if (pathResult.success) {
                console.log(`  -> Connected! Connection: ${cand.node.id} (${cand.node.type}) Source: ${pathResult.foundSource.id}`);
                route = pathResult;
                nearestNode = cand.node;
                finalSource = pathResult.foundSource;
                minDist = cand.dist;
                break; // Stop at the first (closest) valid connection found
            }
        }
    }

    // If still no route found after checking 100 candidates, then we truly are isolated.
    if (!route) {
        console.log("All nearby infrastructure nodes are isolated/disconnected from water sources.");
        return { success: false, error: 'Cannot find a connected water pipeline nearby. The local network seems isolated.' };
    }

    // 3. Reverse the path (Source -> Target)
    // The path from findPathToAnySource is target -> source. We need source -> target.
    route.path.reverse();
    route.edges.reverse(); // Edges also need to be reversed to match the path direction

    // The previous "if (!route.success)" block is now redundant due to the check above.
    // Keeping it for now as per instruction, but it will never be hit.

    console.log(`Route Found! Length: ${route.totalDistance}km, Hops: ${route.path.length}`);

    // Map IDs to Coordinates using the SAME graph
    const pathCoords = route.path.map(id => {
        const n = graph[id];
        if (!n || !n.coords || n.coords.length < 2) return null;

        const latVal = parseFloat(n.coords[0]);
        const lonVal = parseFloat(n.coords[1]);
        if (isNaN(latVal) || isNaN(lonVal)) return null;
        return [latVal, lonVal];
    }).filter(p => p !== null);

    // Append the target location
    const targetLat = parseFloat(lat);
    const targetLng = parseFloat(lng);
    if (!isNaN(targetLat) && !isNaN(targetLng)) {
        pathCoords.push([targetLat, targetLng]);
    }

    return {
        success: true,
        connectionPoint: nearestNode,
        waterSource: finalSource,
        path: route.path,
        fullPathCoords: pathCoords,
        totalDistance: route.totalDistance,
        isFallback: fallbackUsed,
        newPipeRequired: {
            estimatedLength: Math.round(minDist * 1000 * 1.35), // 1.35x Tortuosity Factor for road distance
            // Default calculation, frontend can override based on selection
            estimatedCost: {
                raw: Math.round(minDist * 1000 * 1.35 * 1200), // Defaulting to HDPE rate approx
                formatted: `₹${(minDist * 1000 * 1.35 * 1200).toLocaleString()}`
            }
        }
    };
}


// --------------------------------------------------------------------------
// Helper: Find Path to ANY source
// --------------------------------------------------------------------------

/**
 * Special Dijkstra to find path from startNodeId to ANY node of type 'reservoir' or 'esr'
 */
async function findPathToAnySource(startNodeId, graph, options = {}) {
    const { preferLargeDiameter = false } = options;
    const distances = {};
    const previous = {};
    const previousEdge = {};
    const visited = new Set();
    const pq = new PriorityQueue();

    distances[startNodeId] = 0;
    pq.push(startNodeId, 0);

    let foundSourceId = null;

    while (!pq.isEmpty()) {
        const currentNodeId = pq.pop();
        if (visited.has(currentNodeId)) continue;
        visited.add(currentNodeId);

        const currentNode = graph[currentNodeId];
        if (!currentNode) continue;

        // STOP CONDITION: Found a source!
        if (currentNode.type === 'reservoir' || currentNode.type === 'esr') {
            foundSourceId = currentNodeId;
            break;
        }

        for (const neighbor of currentNode.neighbors) {
            if (visited.has(neighbor.nodeId)) continue;

            let weight = neighbor.distance;
            // Apply potential diameter preference (reversed logic? 
            // Usually large diameter = less friction = lower cost? 
            // In original Dijkstra: preferLargeDiameter -> weight / diameter (smaller weight = better).
            if (preferLargeDiameter && neighbor.diameter) {
                weight = weight * (1000 / neighbor.diameter);
            }

            const newDistance = distances[currentNodeId] + weight;

            if (distances[neighbor.nodeId] === undefined || newDistance < distances[neighbor.nodeId]) {
                distances[neighbor.nodeId] = newDistance;
                previous[neighbor.nodeId] = currentNodeId;
                previousEdge[neighbor.nodeId] = neighbor.edgeId;
                pq.push(neighbor.nodeId, newDistance);
            }
        }
    }

    if (!foundSourceId) {
        return { success: false };
    }

    // Reconstruct Path
    // We went FROM Target TO Source.
    // So 'previous' traces BACK to Target.
    // Start at Source -> previous[Source] -> ... -> Target.
    // Path array will be [Source, ..., Target].
    const path = [];
    const edges = [];
    let current = foundSourceId;

    while (current) {
        path.push(current);
        const edgeId = previousEdge[current];
        if (edgeId) edges.push(edgeId);
        current = previous[current];
    }

    // The main function expects [Source, ..., Target].
    // And later it calls .reverse(), so it wants [Target, ..., Source]?
    // Wait. My main function calls:
    // route.path.reverse(); 
    // Meaning it expects to flip it.
    // If I return [Source, ..., Target], reverse() makes it [Target, ..., Source].
    // Visualizing flow: Source -> ... -> Target.
    // So main function wants Source -> Target.
    // If main reverses, it must think it got Target -> Source.
    // My findPathToAnySource logic (Target -> Source) returns [Source, ..., Target] because of reconstruction.
    // So this is correct: [Source, ..., Target].
    // Main function:
    // route.path.reverse(); -> becomes [Target, ..., Source].
    // Wait. Then pathCoords iterates it from start.
    // pathCoords logic: route.path[0] is start.
    // Start = Water Source? No.
    // Start = Connection Node? No.
    // The frontend draws a line.
    // Usually we want Source -> Target for flow simulation.
    // If findPathToAnySource returns [Source, ..., Target].
    // And main reverses it to [Target, ..., Source].
    // Then pathCoords[0] = Target.
    // pathCoords[last] = Source.
    // Is that what we want?
    // Let's check main function: 
    // const pathCoords = route.path.map...
    // pathCoords.push([targetLat, targetLng]);
    // So pathCoords ends at Target.
    // So the path should end near Target.
    // So route.path needs to end near Connection Node.
    // [Source, ..., ConnectionNode].
    // My function returns [Source, ..., ConnectionNode].
    // Main function REVERSES it -> [ConnectionNode, ..., Source].
    // Then pushes Target.
    // Result: [ConnectionNode, ..., Source, Target].
    // That looks WRONG. We want Source -> ConnectionNode -> Target.
    // So Main Function should NOT reverse it if I return [Source, ..., ConnectionNode].
    // OR I return [ConnectionNode, ..., Source].

    // Let's stick to returning [Source, ..., ConnectionNode] as "Path from Source".
    // AND removing the .reverse() in Main Function?
    // OR changing return to [ConnectionNode, ..., Source].
    // Let's return [ConnectionNode, ..., Source] (Target -> Source).
    // Reversing [Source, ..., ConnectionNode] gives [ConnectionNode, ..., Source].

    // Verify total physical distance
    let totalPhysicalDistance = 0;
    let curr = foundSourceId;
    while (curr && previous[curr]) {
        const prev = previous[curr];
        const node = graph[curr];
        if (node) {
            const edge = node.neighbors.find(n => n.nodeId === prev);
            if (edge) {
                totalPhysicalDistance += edge.distance;
                // console.log(`Segment ${curr}->${prev}: ${edge.distance.toFixed(3)}km`);
            }
        }
        curr = prev;
    }

    console.log(`Path Found! Dijkstra Cost: ${distances[foundSourceId].toFixed(3)}, Physical Dist (Verified): ${totalPhysicalDistance.toFixed(3)} km`);

    return {
        success: true,
        path: path.reverse(), // Now [ConnectionNode, ..., Source]
        edges: edges.reverse(),
        foundSource: graph[foundSourceId],
        totalDistance: totalPhysicalDistance // Return verified physical distance
    };
}

module.exports = {
    dijkstra,
    findOptimalConnectionRoute
};
