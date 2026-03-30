/**
 * Graph Helpers - Graph utility functions
 */

// Relationship type → Color mapping
export const RELATION_COLORS = {
  hostile: '#ef4444',
  romantic: '#ec4899',
  alliance: '#f59e0b',
  neutral: '#9ca3af',
  family: '#3b82f6',
  mentor: '#22c55e'
}

// Relationship type → English labels
export const RELATION_LABELS = {
  hostile: 'Hostile',
  romantic: 'Romantic',
  alliance: 'Alliance',
  neutral: 'Neutral',
  family: 'Family',
  mentor: 'Mentor'
}

// Entity type → ECharts symbol mapping
export const NODE_SHAPES = {
  character: 'circle',
  faction: 'diamond',
  location: 'rect',
  item: 'triangle'
}

// Entity type → English labels
export const NODE_TYPE_LABELS = {
  character: 'Character',
  faction: 'Faction',
  location: 'Location',
  item: 'Item'
}

// Faction → Color (dynamically allocated)
const FACTION_PALETTE = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#14b8a6',
  '#f97316', '#ef4444', '#ec4899', '#84cc16'
]

/**
 * Assign color to faction
 */
export function getFactionColorMap(nodes) {
  const factions = [...new Set(nodes.filter(n => n.faction).map(n => n.faction))]
  const map = {}
  factions.forEach((f, i) => {
    map[f] = FACTION_PALETTE[i % FACTION_PALETTE.length]
  })
  return map
}

/**
 * Get the latest snapshot for a specified chapter
 * Find the maximum key from snapshots where key <= chapterNum
 */
export function getSnapshotForChapter(snapshots, chapterNum) {
  if (!snapshots || Object.keys(snapshots).length === 0) return null
  const keys = Object.keys(snapshots).map(Number).sort((a, b) => a - b)
  let best = null
  for (const k of keys) {
    if (k <= chapterNum) best = k
    else break
  }
  return best !== null ? snapshots[String(best)] : null
}

/**
 * Get list of all chapter numbers that have snapshots
 */
export function getSnapshotChapters(snapshots) {
  if (!snapshots) return []
  return Object.keys(snapshots).map(Number).sort((a, b) => a - b)
}

/**
 * Convert snapshot/graph data to ECharts graph series format
 */
export function toEChartsGraphData(snapshot, isDark = false, factionColorMap = {}) {
  if (!snapshot) return { nodes: [], links: [], categories: [] }

  const categorySet = new Set()
  snapshot.nodes.forEach(n => {
    if (n.faction) categorySet.add(n.faction)
  })
  const categoryList = [...categorySet]
  const categories = categoryList.map(name => ({
    name,
    itemStyle: { color: factionColorMap[name] || '#6366f1' }
  }))
  // Nodes without faction are grouped as "Other"
  categories.push({ name: 'Other', itemStyle: { color: isDark ? '#a78bfa' : '#6366f1' } })

  // ECharts symbol mapping
  const ECHARTS_SYMBOLS = {
    character: 'circle',
    faction: 'diamond',
    location: 'rect',
    item: 'triangle'
  }

  const nodes = snapshot.nodes.map(node => {
    const isDeceased = node.status === 'deceased'
    const isOffline = node.status === 'offline'
    const size = 20 + (node.importance || 5) * 4
    const catIndex = node.faction ? categoryList.indexOf(node.faction) : categories.length - 1

    return {
      id: node.id,
      name: node.label,
      symbol: ECHARTS_SYMBOLS[node.type] || 'circle',
      symbolSize: size,
      category: catIndex,
      value: node.importance || 5,
      label: { show: size > 36 },
      itemStyle: {
        opacity: isDeceased ? 0.35 : isOffline ? 0.6 : 1,
        ...(isDeceased ? { color: '#6b7280' } : {})
      },
      _raw: node
    }
  })

  const links = snapshot.edges.map(edge => ({
    source: edge.source,
    target: edge.target,
    value: edge.strength || 3,
    lineStyle: {
      color: RELATION_COLORS[edge.relationType] || '#9ca3af',
      width: Math.max(1, (edge.strength || 3) / 3),
      opacity: 0.6
    },
    _raw: edge
  }))

  return { nodes, links, categories }
}

/**
 * Apply delta to snapshot to generate new snapshot
 */
export function applyDelta(snapshot, delta) {
  const nodes = [...snapshot.nodes]
  const edges = [...snapshot.edges]

  // Add new nodes
  if (delta.newNodes) {
    for (const n of delta.newNodes) {
      if (!nodes.find(x => x.id === n.id)) nodes.push(n)
    }
  }

  // Update nodes
  if (delta.updatedNodes) {
    for (const u of delta.updatedNodes) {
      const idx = nodes.findIndex(x => x.id === u.id)
      if (idx !== -1) nodes[idx] = { ...nodes[idx], ...u.changes }
    }
  }

  // Delete nodes
  if (delta.removedNodeIds) {
    for (const id of delta.removedNodeIds) {
      const idx = nodes.findIndex(x => x.id === id)
      if (idx !== -1) nodes.splice(idx, 1)
    }
  }

  // Add new edges
  if (delta.newEdges) {
    for (const e of delta.newEdges) {
      if (!edges.find(x => x.id === e.id)) edges.push(e)
    }
  }

  // Update edges
  if (delta.updatedEdges) {
    for (const u of delta.updatedEdges) {
      const idx = edges.findIndex(x => x.id === u.id)
      if (idx !== -1) {
        edges[idx] = { ...edges[idx], ...u.changes }
        if (u.changes.events) {
          edges[idx].events = [...(edges[idx].events || []), ...u.changes.events]
        }
      }
    }
  }

  // Delete edges
  if (delta.removedEdgeIds) {
    for (const id of delta.removedEdgeIds) {
      const idx = edges.findIndex(x => x.id === id)
      if (idx !== -1) edges.splice(idx, 1)
    }
  }

  return { nodes, edges }
}

/**
 * Try to parse JSON from LLM response
 */
export function parseJsonResponse(text) {
  // Try direct parsing first
  try {
    return JSON.parse(text)
  } catch {
    // Try extracting JSON block
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

/**
 * Generate standalone HTML for export
 */
export function generateExportHTML(graphData, projectTitle) {
  const snapshot = getSnapshotForChapter(graphData.snapshots, Infinity)
  if (!snapshot) return ''

  const factionColorMap = getFactionColorMap(snapshot.nodes)
  const { nodes, links, categories } = toEChartsGraphData(snapshot, true, factionColorMap)
  const dataJson = JSON.stringify({ nodes, links, categories })

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${projectTitle} - 人物关系图谱</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"><\/script>
<style>
  body { margin: 0; background: #0f172a; font-family: system-ui; overflow: hidden; }
  #graph { width: 100vw; height: 100vh; }
  .title { position: fixed; top: 16px; left: 16px; color: #e2e8f0; font-size: 18px; z-index: 10; text-shadow: 0 0 10px rgba(99,102,241,0.5); }
</style>
</head>
<body>
<div class="title">${projectTitle} - 人物关系图谱</div>
<div id="graph"></div>
<script>
var data = ${dataJson};
var chart = echarts.init(document.getElementById('graph'));
chart.setOption({
  tooltip: {},
  legend: [{ data: data.categories.map(function(c){ return c.name; }), textStyle: { color: '#e2e8f0' }, top: 20, right: 20 }],
  animationDuration: 1500,
  animationEasingUpdate: 'quinticInOut',
  series: [{
    type: 'graph',
    layout: 'force',
    data: data.nodes,
    links: data.links,
    categories: data.categories,
    roam: true,
    label: { position: 'right', formatter: '{b}', color: '#e2e8f0' },
    lineStyle: { curveness: 0.2 },
    emphasis: { focus: 'adjacency', lineStyle: { width: 6 } },
    force: { repulsion: 200, edgeLength: [80, 200], gravity: 0.1 }
  }]
});
window.addEventListener('resize', function(){ chart.resize(); });
<\/script>
</body>
</html>`
}
