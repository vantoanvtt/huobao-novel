import { chatCompletion, cleanResponse } from './llm'
import { compassPrompts } from '../prompts/compass_eng'
import { parseJsonResponse, applyDelta, getSnapshotForChapter } from '../utils/graph-helpers'

const { extractGraph: extractGraphPrompt, extractChapterDelta: extractChapterDeltaPrompt, auditGraph: auditGraphPrompt, extractChapterGraph: extractChapterGraphPrompt } = compassPrompts

/**
 * Generate baseline graph from architecture data
 */
export async function generateBaseGraph(project, apiConfig, onProgress) {
  onProgress('Analyzing novel architecture, extracting entity relationships...', 1, 3)

  const prompt = extractGraphPrompt({
    characterDynamics: project.characterDynamics,
    characterState: project.characterState,
    worldBuilding: project.worldBuilding,
    plotArchitecture: project.plotArchitecture
  })

  const response = cleanResponse(await chatCompletion(apiConfig, prompt))
  const parsed = parseJsonResponse(response)

  if (!parsed || !parsed.nodes) {
    throw new Error('Graph extraction failed: AI returned incorrect data format')
  }

  // Ensure every edge has an id
  parsed.edges = (parsed.edges || []).map((e, i) => ({
    ...e,
    id: e.id || `edge_${e.source}_${e.target}_${i}`
  }))

  // Ensure every node has firstAppearance
  parsed.nodes = parsed.nodes.map(n => ({
    ...n,
    firstAppearance: n.firstAppearance ?? 0
  }))

  onProgress('Baseline graph generation complete', 3, 3)

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    snapshots: { '0': { nodes: parsed.nodes, edges: parsed.edges } },
    audit: { inconsistencies: [], lastAuditAt: null },
    graphGenerated: true
  }
}

/**
 * Generate snapshots in batch from written chapters
 */
export async function generateChapterSnapshots(project, apiConfig, onProgress) {
  const graphData = { ...project.graphData }
  const chapterNums = Object.keys(project.chapters || {}).map(Number).sort((a, b) => a - b)

  if (chapterNums.length === 0) return graphData
  if (!graphData.snapshots['0']) {
    throw new Error('Please generate baseline graph first')
  }

  // Find chapters without snapshots
  const existingSnapshots = new Set(Object.keys(graphData.snapshots).map(Number))
  const pendingChapters = chapterNums.filter(n => !existingSnapshots.has(n))

  if (pendingChapters.length === 0) return graphData

  for (let i = 0; i < pendingChapters.length; i++) {
    const chapterNum = pendingChapters[i]
    onProgress(`Analyzing relationship changes in Chapter ${chapterNum}...`, i + 1, pendingChapters.length)

    const currentSnapshot = getSnapshotForChapter(graphData.snapshots, chapterNum - 1)
    if (!currentSnapshot) continue

    const prompt = extractChapterDeltaPrompt({
      currentNodes: currentSnapshot.nodes,
      currentEdges: currentSnapshot.edges,
      chapterNumber: chapterNum,
      chapterText: project.chapters[chapterNum]
    })

    try {
      const response = cleanResponse(await chatCompletion(apiConfig, prompt))
      const delta = parseJsonResponse(response)

      if (delta) {
        const hasDelta = ['newNodes', 'updatedNodes', 'removedNodeIds', 'newEdges', 'updatedEdges', 'removedEdgeIds']
          .some(k => delta[k] && delta[k].length > 0)

        if (hasDelta) {
          graphData.snapshots[String(chapterNum)] = applyDelta(currentSnapshot, delta)
        }
      }
    } catch (err) {
      console.warn(`Graph analysis failed for Chapter ${chapterNum}:`, err.message)
    }
  }

  graphData.generatedAt = new Date().toISOString()
  return graphData
}

/**
 * Logic audit
 */
export async function auditCompassGraph(project, apiConfig, onProgress) {
  const graphData = project.graphData
  if (!graphData?.graphGenerated) {
    throw new Error('Please generate graph first')
  }

  onProgress('Performing logic audit...', 1, 2)

  // Build snapshot sequence text
  const snapshotKeys = Object.keys(graphData.snapshots).map(Number).sort((a, b) => a - b)
  const snapshotsText = snapshotKeys.map(k => {
    const s = graphData.snapshots[String(k)]
    return `--- Chapter ${k} Snapshot ---\nNodes: ${s.nodes.map(n => `${n.label}(${n.status})`).join(', ')}\nRelationships: ${s.edges.map(e => `${e.source}-[${e.relationType}]-${e.target}`).join(', ')}`
  }).join('\n\n')

  const prompt = auditGraphPrompt({
    chapterBlueprint: project.chapterBlueprint || '(No outline yet)',
    snapshotsText
  })

  const response = cleanResponse(await chatCompletion(apiConfig, prompt))
  const parsed = parseJsonResponse(response)

  onProgress('Logic audit complete', 2, 2)

  return {
    inconsistencies: parsed?.inconsistencies || [],
    lastAuditAt: new Date().toISOString()
  }
}

/**
 * Generate independent relationship graph from a single chapter
 */
export async function generateChapterGraph(project, chapterNum, chapterText, apiConfig, onProgress) {
  onProgress('Extracting character relationships in this chapter...')

  const prompt = extractChapterGraphPrompt({
    chapterNumber: chapterNum,
    chapterText,
    characterState: project.characterState || ''
  })

  const response = cleanResponse(await chatCompletion(apiConfig, prompt))
  const parsed = parseJsonResponse(response)

  if (!parsed || !parsed.nodes) {
    throw new Error('Chapter relationship extraction failed: AI returned incorrect data format')
  }

  // Ensure edge has id
  parsed.edges = (parsed.edges || []).map((e, i) => ({
    ...e,
    id: e.id || `edge_${e.source}_${e.target}_${i}`
  }))

  return { nodes: parsed.nodes, edges: parsed.edges }
}
