/**
 * Lazy-deletion style Dijkstra using a binary min-heap (same idea as heapq in Python).
 */
const NETWORK_TOPOLOGY = {
  A: { B: 8, C: 3, D: 6 },
  B: { A: 8, E: 5 },
  C: { A: 3, D: 2 },
  D: { A: 6, C: 2, E: 5, G: 3 },
  E: { B: 5, D: 5, F: 5 },
  F: { E: 5, G: 3, H: 6 },
  G: { D: 3, F: 3, H: 4 },
  H: { G: 4, F: 6 },
};

const POSITIONS = {
  A: [80, 60],
  B: [80, 200],
  C: [220, 60],
  D: [220, 200],
  E: [360, 60],
  F: [360, 200],
  G: [220, 320],
  H: [360, 320],
};

function cmpPair(a, b) {
  if (a[0] !== b[0]) return a[0] - b[0];
  return a[1].localeCompare(b[1]);
}

function heapPush(heap, item) {
  heap.push(item);
  let i = heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (cmpPair(heap[p], heap[i]) <= 0) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}

function heapPop(heap) {
  const top = heap[0];
  const last = heap.pop();
  if (!heap.length) return top;
  heap[0] = last;
  let i = 0;
  const n = heap.length;
  for (;;) {
    let sm = i;
    const l = i * 2 + 1;
    const r = i * 2 + 2;
    if (l < n && cmpPair(heap[l], heap[sm]) < 0) sm = l;
    if (r < n && cmpPair(heap[r], heap[sm]) < 0) sm = r;
    if (sm === i) break;
    [heap[sm], heap[i]] = [heap[i], heap[sm]];
    i = sm;
  }
  return top;
}

function dijkstraOptimized(graph, startNode) {
  const distances = {};
  for (const node of Object.keys(graph)) {
    distances[node] = Infinity;
  }
  distances[startNode] = 0;

  const pq = [];
  heapPush(pq, [0, startNode]);

  while (pq.length) {
    const [currentDistance, currentNode] = heapPop(pq);
    if (currentDistance > distances[currentNode]) continue;

    for (const [neighbor, edgeWeight] of Object.entries(graph[currentNode])) {
      const alt = currentDistance + edgeWeight;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        heapPush(pq, [alt, neighbor]);
      }
    }
  }
  return distances;
}

function uniqueUndirectedEdges(graph) {
  const seen = new Set();
  const edges = [];
  for (const u of Object.keys(graph).sort()) {
    for (const v of Object.keys(graph[u]).sort()) {
      const a = u < v ? u : v;
      const b = u < v ? v : u;
      const key = `${a}|${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const w = graph[a][b];
      edges.push([a, b, w]);
    }
  }
  return edges;
}

function weightLabelPosition(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const offset = 10;
  return [mx + nx * offset, my + ny * offset];
}

function buildStaticGraph(svg) {
  const NS = "http://www.w3.org/2000/svg";

  const defs = document.createElementNS(NS, "defs");
  const grad = document.createElementNS(NS, "linearGradient");
  grad.setAttribute("id", "startGradient");
  grad.setAttribute("x1", "0%");
  grad.setAttribute("y1", "0%");
  grad.setAttribute("x2", "100%");
  grad.setAttribute("y2", "100%");
  const s1 = document.createElementNS(NS, "stop");
  s1.setAttribute("offset", "0%");
  s1.setAttribute("stop-color", "#4f46e5");
  const s2 = document.createElementNS(NS, "stop");
  s2.setAttribute("offset", "100%");
  s2.setAttribute("stop-color", "#020617");
  grad.appendChild(s1);
  grad.appendChild(s2);
  defs.appendChild(grad);
  svg.appendChild(defs);

  for (const [u, v, w] of uniqueUndirectedEdges(NETWORK_TOPOLOGY)) {
    const [x1, y1] = POSITIONS[u];
    const [x2, y2] = POSITIONS[v];
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    line.setAttribute("class", "edge");
    svg.appendChild(line);
    const text = document.createElementNS(NS, "text");
    const [tx, ty] = weightLabelPosition(x1, y1, x2, y2);
    text.setAttribute("x", String(tx));
    text.setAttribute("y", String(ty));
    text.setAttribute("class", "weight");
    text.textContent = String(w);
    svg.appendChild(text);
  }

  const nodes = Object.keys(POSITIONS).sort();
  for (const node of nodes) {
    const [x, y] = POSITIONS[node];
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "node-group");
    g.dataset.nodeId = node;

    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("cx", String(x));
    circle.setAttribute("cy", String(y));
    circle.setAttribute("r", "22");
    circle.setAttribute("class", "node");
    circle.id = `node-circle-${node}`;

    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", String(x));
    label.setAttribute("y", String(y + 4));
    label.setAttribute("class", "label");
    label.textContent = node;

    const distEl = document.createElementNS(NS, "text");
    distEl.setAttribute("x", String(x));
    distEl.setAttribute("y", String(y + 44));
    distEl.setAttribute("class", "distance hidden");
    distEl.id = `node-dist-${node}`;

    g.appendChild(circle);
    g.appendChild(label);
    g.appendChild(distEl);
    svg.appendChild(g);
  }
}

function updateView(startNode, distances) {
  const nodes = Object.keys(POSITIONS).sort();
  for (const node of nodes) {
    const circle = document.getElementById(`node-circle-${node}`);
    const distEl = document.getElementById(`node-dist-${node}`);
    circle.classList.toggle("node-start", node === startNode);
    if (node === startNode) {
      circle.setAttribute("fill", "url(#startGradient)");
    } else {
      circle.setAttribute("fill", "#020617");
    }

    const d = distances[node];
    if (d !== Infinity && Number.isFinite(d)) {
      distEl.textContent = String(Math.round(d));
      distEl.classList.remove("hidden");
    } else {
      distEl.textContent = "";
      distEl.classList.add("hidden");
    }
  }

  const tbody = document.querySelector("#dist-table tbody");
  tbody.innerHTML = "";
  for (const node of nodes) {
    const tr = document.createElement("tr");
    const tdN = document.createElement("td");
    tdN.textContent = node;
    const tdD = document.createElement("td");
    const d = distances[node];
    tdD.textContent = d === Infinity ? "∞" : String(Math.round(d));
    tr.appendChild(tdN);
    tr.appendChild(tdD);
    tbody.appendChild(tr);
  }

  document.getElementById("table-hint").classList.add("hidden");
  document.getElementById("dist-table").classList.remove("hidden");
}

function init() {
  const svg = document.getElementById("graph");
  buildStaticGraph(svg);

  const select = document.getElementById("start_node");
  const nodes = Object.keys(NETWORK_TOPOLOGY).sort();
  for (const n of nodes) {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    select.appendChild(opt);
  }
  select.value = "A";

  document.getElementById("compute").addEventListener("click", () => {
    const start = select.value;
    if (!NETWORK_TOPOLOGY[start]) return;
    const distances = dijkstraOptimized(NETWORK_TOPOLOGY, start);
    updateView(start, distances);
  });
}

document.addEventListener("DOMContentLoaded", init);
