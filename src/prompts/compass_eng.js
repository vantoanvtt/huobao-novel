/**
 * Compass Prompts - English Version
 * Used for extracting entity relationship graphs from novel data
 */

/**
 * Extract complete graph from architecture data (baseline snapshot)
 */
export const extractGraph = (params) => `
You are a novel analysis engine. Please extract the entity relationship graph from the following novel architecture data and output in strict JSON format.

=== Character System ===
${params.characterDynamics}

=== Character Status ===
${params.characterState}

=== Worldview ===
${params.worldBuilding}

=== Plot Architecture ===
${params.plotArchitecture}

Please extract the following four entity types:
1. character (character): All named characters
2. faction (faction/organization): Definite organizations, sects, powers
3. location (location): Important scene locations
4. item (item): Key props, weapons, tokens

And relationships between entities, with relationship types limited to:
- hostile (hostile), romantic (emotional/romantic), alliance (alliance/covenant)
- neutral (neutral), family (kinship), mentor (mentor/guidance)

Output format (strict JSON, no explanatory text):
{
  "nodes": [
    {
      "id": "char_<pinyin_abbr>",
      "label": "Character Name",
      "type": "character",
      "importance": 8,
      "faction": "faction name or null",
      "status": "active",
      "bio": "one-sentence introduction",
      "traits": ["trait1", "trait2"],
      "firstAppearance": 0
    }
  ],
  "edges": [
    {
      "id": "edge_<source>_<target>",
      "source": "char_xxx",
      "target": "char_yyy",
      "relationType": "alliance",
      "label": "relationship summary",
      "strength": 7,
      "description": "detailed relationship description",
      "events": ["key event 1"]
    }
  ]
}

Requirements:
- importance range 1-10, protagonist 9-10, important support characters 5-7, bystanders 1-4
- strength range 1-10, core relationships 7-10, general relationships 3-6
- Each node's id must be unique, using type prefix + pinyin abbreviation (e.g. char_zhangsan, fac_zhengdao, loc_liuxi, item_hanjian)
- Output only JSON, no markdown code block markers
`

/**
 * Extract incremental changes from chapter content (delta)
 */
export const extractChapterDelta = (params) => `
You are a novel analysis engine. Please analyze the following chapter content and output relationship graph changes (delta) in strict JSON format.

=== Current Graph Status ===
Nodes: ${JSON.stringify(params.currentNodes.map(n => ({ id: n.id, label: n.label, type: n.type, status: n.status })))}
Edges: ${JSON.stringify(params.currentEdges.map(e => ({ id: e.id, source: e.source, target: e.target, relationType: e.relationType, label: e.label })))}

=== Chapter ${params.chapterNumber} Content ===
${params.chapterText}

Please analyze this chapter's content and output the following changes:

{
  "newNodes": [
    { "id": "char_xxx", "label": "name", "type": "character", "importance": 5, "faction": null, "status": "active", "bio": "introduction", "traits": [], "firstAppearance": ${params.chapterNumber} }
  ],
  "updatedNodes": [
    { "id": "existing node id", "changes": { "status": "deceased", "importance": 7 } }
  ],
  "removedNodeIds": [],
  "newEdges": [
    { "id": "edge_x_y", "source": "char_x", "target": "char_y", "relationType": "hostile", "label": "relationship", "strength": 5, "description": "description", "events": ["event"] }
  ],
  "updatedEdges": [
    { "id": "existing edge id", "changes": { "relationType": "hostile", "strength": 9, "events": ["new event"] } }
  ],
  "removedEdgeIds": []
}

Requirements:
- Output only changed content, do not include unchanged fields
- If no changes in this chapter, return empty arrays []
- When character dies set status to "deceased", temporary absence set to "offline"
- Update relationType and events when relationships change
- Output only JSON, no markdown code block markers
`

/**
 * Logic Audit - Detect logical inconsistencies in graph
 */
export const auditGraph = (params) => `
You are a novel logic audit engine. Please check the following novel's relationship graph snapshot sequence for logical inconsistencies.

=== Chapter Outline ===
${params.chapterBlueprint}

=== Graph Snapshot Sequence ===
${params.snapshotsText}

Please check for the following types of logic issues:
1. dead_reappear: Character dies in one chapter, then reappears with interactions in later chapters
2. missing_setup: Two characters suddenly develop a relationship, but no prior foreshadowing exists
3. faction_conflict: Character's faction affiliation contradicts their relationship network
4. orphan_thread: A relationship line breaks mid-way, with no follow-up development or explanation
5. weight_imbalance: Support character screen time exceeds protagonist, potentially stealing main plot

Output format (strict JSON):
{
  "inconsistencies": [
    {
      "type": "dead_reappear",
      "severity": "error",
      "nodeIds": ["char_xxx"],
      "edgeIds": [],
      "chapters": [10, 15],
      "message": "Character XXX died in chapter 10 but appeared in interaction with YYY in chapter 15"
    }
  ]
}

severity levels: error (serious logic error), warning (potential issue), info (optimization suggestion)
Output only JSON, no markdown code block markers
`

/**
 * Extract complete relationship graph from single chapter content (for inline chapter editor panel)
 */
export const extractChapterGraph = (params) => `
You are a novel analysis engine. Please extract the character relationship graph involved in this chapter from the following single chapter content and output in strict JSON format.

=== Chapter ${params.chapterNumber} Content ===
${params.chapterText}

${params.characterState ? `=== Current Character Status ===\n${params.characterState}\n` : ''}

Please extract all characters appearing in this chapter and their relationships:

Output format (strict JSON, no explanatory text):
{
  "nodes": [
    {
      "id": "char_<pinyin_abbr>",
      "label": "Character Name",
      "type": "character",
      "importance": 8,
      "faction": "faction name or null",
      "status": "active",
      "bio": "character performance in this chapter (one sentence)"
    }
  ],
  "edges": [
    {
      "source": "char_xxx",
      "target": "char_yyy",
      "relationType": "alliance",
      "label": "relationship summary",
      "strength": 7
    }
  ]
}

Requirements:
- Extract only characters actually appearing or mentioned in this chapter
- importance range 1-10, higher with more screen time in this chapter
- strength range 1-10, higher with closer interaction in this chapter
- relationType limited to: hostile / romantic / alliance / neutral / family / mentor
- Output only JSON, no markdown code block markers
`

export const compassPrompts = {
    extractGraph,
    extractChapterDelta,
    auditGraph,
    extractChapterGraph
}
