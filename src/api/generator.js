import { chatCompletion, cleanResponse } from './llm'
import { architecturePrompts, chapterPrompts, utilityPrompts } from '../prompts'

// Destructure prompts
const { coreSeed: coreSeedPrompt, characterDynamics: characterDynamicsPrompt, worldBuilding: worldBuildingPrompt, plotArchitecture: plotArchitecturePrompt, characterState: createCharacterStatePrompt } = architecturePrompts
const { blueprint: chapterBlueprintPrompt, blueprintChunked: chunkedChapterBlueprintPrompt, firstDraft: firstChapterDraftPrompt, nextDraft: nextChapterDraftPrompt, enrich: enrichChapterPrompt } = chapterPrompts
const { summary: summaryPrompt, updateCharacterState: updateCharacterStatePrompt } = utilityPrompts

function formatGenre(genre) {
  if (Array.isArray(genre)) return genre.join(' / ')
  return genre || ''
}

// Novel generator service
// Orchestrates the generation process

/**
 * Generate novel architecture
 * Steps: Core seed → Character dynamics → World building → Plot architecture
 */
export async function generateArchitecture(project, apiConfig, onProgress) {
  const results = {
    coreSeed: project.coreSeed || '',
    characterDynamics: project.characterDynamics || '',
    worldBuilding: project.worldBuilding || '',
    plotArchitecture: project.plotArchitecture || '',
    characterState: project.characterState || ''
  }

  const params = {
    topic: project.topic,
    genre: formatGenre(project.genre),
    numberOfChapters: project.numberOfChapters,
    wordNumber: project.wordNumber,
    userGuidance: project.userGuidance || ''
  }

  // Step 1: Core seed
  if (!results.coreSeed) {
    onProgress('Generating core seed...', 1, 5)
    const prompt = coreSeedPrompt(params)
    results.coreSeed = cleanResponse(await chatCompletion(apiConfig, prompt))
  }

  // Step 2: Character dynamics
  if (!results.characterDynamics) {
    onProgress('Generating character system...', 2, 5)
    const prompt = characterDynamicsPrompt({
      ...params,
      coreSeed: results.coreSeed
    })
    results.characterDynamics = cleanResponse(await chatCompletion(apiConfig, prompt))
  }

  // Step 2.5: Character state
  if (!results.characterState && results.characterDynamics) {
    onProgress('Generating character status...', 2.5, 5)
    const prompt = createCharacterStatePrompt({
      characterDynamics: results.characterDynamics
    })
    results.characterState = cleanResponse(await chatCompletion(apiConfig, prompt))
  }

  // Step 3: World building
  if (!results.worldBuilding) {
    onProgress('Building worldview...', 3, 5)
    const prompt = worldBuildingPrompt({
      ...params,
      coreSeed: results.coreSeed
    })
    results.worldBuilding = cleanResponse(await chatCompletion(apiConfig, prompt))
  }

  // Step 4: Plot architecture
  if (!results.plotArchitecture) {
    onProgress('Designing plot architecture...', 4, 5)
    const prompt = plotArchitecturePrompt({
      ...params,
      coreSeed: results.coreSeed,
      characterDynamics: results.characterDynamics,
      worldBuilding: results.worldBuilding
    })
    results.plotArchitecture = cleanResponse(await chatCompletion(apiConfig, prompt))
  }

  onProgress('Architecture generation complete!', 5, 5)
  return results
}

/**
 * Generate chapter blueprint
 */
export async function generateChapterBlueprint(project, apiConfig, onProgress) {
  const { numberOfChapters, userGuidance } = project
  
  // Build novel architecture text
  const novelArchitecture = `
#=== 0) Novel Setting ===
Topic: ${project.topic}, Genre: ${formatGenre(project.genre)}, Length: Approximately ${numberOfChapters} chapters (each ${project.wordNumber} words)

#=== 1) Core Seed ===
${project.coreSeed}

#=== 2) Character Dynamics ===
${project.characterDynamics}

#=== 3) Worldview ===
${project.worldBuilding}

#=== 4) Three-Act Plot Structure ===
${project.plotArchitecture}
`

  // Calculate chunk size based on max tokens
  const tokensPerChapter = 200
  const maxTokens = apiConfig.maxTokens || 8192
  let chunkSize = Math.floor(maxTokens / tokensPerChapter / 10) * 10 - 10
  chunkSize = Math.max(1, Math.min(chunkSize, numberOfChapters))

  let blueprint = project.chapterBlueprint || ''
  
  // Parse existing chapters
  const existingChapters = blueprint.match(/Chapter\s*(\d+)|\u7b2c\s*(\d+)\s*\u7ae0/g) || []
  const maxExistingChapter = existingChapters.length > 0
    ? Math.max(...existingChapters.map(c => parseInt(c.match(/\d+/)[0])))
    : 0

  let currentStart = maxExistingChapter + 1

  if (chunkSize >= numberOfChapters && !blueprint) {
    // Single shot generation
    onProgress(`Generating chapter outline (1-${numberOfChapters})...`, 0, 1)
    const prompt = chapterBlueprintPrompt({
      userGuidance,
      novelArchitecture,
      numberOfChapters
    })
    blueprint = cleanResponse(await chatCompletion(apiConfig, prompt))
  } else {
    // Chunked generation
    while (currentStart <= numberOfChapters) {
      const currentEnd = Math.min(currentStart + chunkSize - 1, numberOfChapters)
      onProgress(
        `Generating chapter outline (${currentStart}-${currentEnd})...`,
        currentStart - 1,
        numberOfChapters
      )

      // Limit existing blueprint to last 100 chapters
      const limitedBlueprint = limitChapterBlueprint(blueprint, 100)

      const prompt = chunkedChapterBlueprintPrompt({
        userGuidance,
        novelArchitecture,
        numberOfChapters,
        chapterList: limitedBlueprint,
        startChapter: currentStart,
        endChapter: currentEnd
      })

      const chunkResult = cleanResponse(await chatCompletion(apiConfig, prompt))
      
      if (chunkResult) {
        blueprint = blueprint ? `${blueprint}\n\n${chunkResult}` : chunkResult
      }

      currentStart = currentEnd + 1
    }
  }

  onProgress('Chapter outline generation complete!', numberOfChapters, numberOfChapters)
  return blueprint
}

/**
 * Limit chapter blueprint to recent chapters
 */
function limitChapterBlueprint(blueprint, limit) {
  if (!blueprint) return ''
  
  const pattern = /(Chapter\s+\d+.*?)(?=Chapter\s+\d+|$)/gs
  const chapters = blueprint.match(pattern) || []
  
  if (chapters.length <= limit) return blueprint
  
  return chapters.slice(-limit).join('\n\n').trim()
}

/**
 * Parse chapter blueprint into structured data
 */
export function parseChapterBlueprint(blueprint) {
  if (!blueprint) return []

  const chapters = []
  const pattern = /(Chapter\s+(\d+)\s*[-–—]\s*(.+?)(?=\n|$))/g
  let match

  while ((match = pattern.exec(blueprint)) !== null) {
    const chapterNum = parseInt(match[2])
    const title = match[3].trim()
    
    // Extract chapter details
    const startIndex = match.index
    const endIndex = blueprint.indexOf(`Chapter ${chapterNum + 1}`, startIndex)
    const chapterText = endIndex > -1 
      ? blueprint.substring(startIndex, endIndex)
      : blueprint.substring(startIndex)

    chapters.push({
      number: chapterNum,
      title,
      position: extractField(chapterText, 'Chapter positioning'),
      purpose: extractField(chapterText, 'Core function'),
      suspense: extractField(chapterText, 'Suspense density'),
      foreshadowing: extractField(chapterText, 'Foreshadowing operation'),
      twistLevel: extractField(chapterText, 'Plot twist level'),
      summary: extractField(chapterText, 'Chapter summary')
    })
  }

  return chapters
}

/**
 * Extract field value from text
 */
function extractField(text, fieldName) {
  const pattern = new RegExp(`${fieldName}[:：]\s*(.+?)(?=\n|$)`)
  const match = text.match(pattern)
  return match ? match[1].trim() : ''
}

/**
 * Generate a single chapter draft
 */
export async function generateChapterDraft(project, chapterNumber, apiConfig, onProgress) {
  const chapters = parseChapterBlueprint(project.chapterBlueprint)
  const chapterInfo = chapters.find(c => c.number === chapterNumber)
  
  if (!chapterInfo) {
    throw new Error(`Chapter ${chapterNumber} does not exist in the outline`)
  }

  const nextChapterInfo = chapters.find(c => c.number === chapterNumber + 1) || {
    title: '(Not set)',
    position: 'Transition chapter',
    purpose: 'Linking chapters',
    suspense: 'Medium',
    foreshadowing: 'No foreshadowing',
    twistLevel: '★☆☆☆☆',
    summary: 'Connecting content'
  }

  // Build novel setting text
  const novelSetting = `
Novel Genre: ${formatGenre(project.genre)}

Core Seed: ${project.coreSeed}

Character System: ${project.characterDynamics}

Worldview: ${project.worldBuilding}

Plot Architecture: ${project.plotArchitecture}
`

  let prompt
  if (chapterNumber === 1) {
    // First chapter
    onProgress(`Generating draft for Chapter ${chapterNumber}...`, 0, 3)
    prompt = firstChapterDraftPrompt({
      chapterNumber,
      chapterTitle: chapterInfo.title,
      chapterRole: chapterInfo.position,
      chapterPurpose: chapterInfo.purpose,
      suspenseLevel: chapterInfo.suspense,
      foreshadowing: chapterInfo.foreshadowing,
      plotTwistLevel: chapterInfo.twistLevel,
      chapterSummary: chapterInfo.summary,
      novelSetting,
      wordNumber: project.wordNumber,
      userGuidance: project.userGuidance
    })
  } else {
    // Subsequent chapters
    onProgress(`Generating draft for chapter ${chapterNumber}...`, 0, 3)
    
    // Get previous chapter excerpt
    const prevChapter = project.chapters?.[chapterNumber - 1] || ''
    const previousChapterExcerpt = prevChapter.slice(-800) || '(No previous chapter content)'

    prompt = nextChapterDraftPrompt({
      chapterNumber,
      chapterTitle: chapterInfo.title,
      chapterRole: chapterInfo.position,
      chapterPurpose: chapterInfo.purpose,
      suspenseLevel: chapterInfo.suspense,
      foreshadowing: chapterInfo.foreshadowing,
      plotTwistLevel: chapterInfo.twistLevel,
      chapterSummary: chapterInfo.summary,
      wordNumber: project.wordNumber,
      globalSummary: project.globalSummary || '(No previous summary - first chapter)',
      previousChapterExcerpt,
      characterState: project.characterState || '(No character state yet)',
      userGuidance: project.userGuidance,
      shortSummary: '',
      nextChapterNumber: chapterNumber + 1,
      nextChapterTitle: nextChapterInfo.title,
      nextChapterRole: nextChapterInfo.position,
      nextChapterPurpose: nextChapterInfo.purpose,
      nextSuspenseLevel: nextChapterInfo.suspense,
      nextForeshadowing: nextChapterInfo.foreshadowing,
      nextPlotTwistLevel: nextChapterInfo.twistLevel,
      nextChapterSummary: nextChapterInfo.summary
    })
  }

  const chapterText = cleanResponse(await chatCompletion(apiConfig, prompt))
  onProgress(`Chapter ${chapterNumber} draft completed`, 1, 3)

  return chapterText
}

/**
 * Finalize chapter - Update global summary and character state
 */
export async function finalizeChapter(project, chapterNumber, chapterText, apiConfig, onProgress) {
  onProgress('Updating previous story summary...', 1, 3)
  
  // Update global summary
  const newSummary = cleanResponse(await chatCompletion(apiConfig, summaryPrompt({
    chapterText,
    globalSummary: project.globalSummary || ''
  })))

  onProgress('Updating character state...', 2, 3)
  
  // Update character state
  const newCharacterState = cleanResponse(await chatCompletion(apiConfig, updateCharacterStatePrompt({
    chapterText,
    oldState: project.characterState || ''
  })))

  onProgress('Chapter finalization completed', 3, 3)

  return {
    globalSummary: newSummary || project.globalSummary,
    characterState: newCharacterState || project.characterState
  }
}

/**
 * Enrich chapter text - Expand chapter content
 */
export async function enrichChapter(chapterText, wordNumber, apiConfig, onProgress) {
  onProgress('Enriching chapter text...', 0, 1)
  
  const enrichedText = cleanResponse(await chatCompletion(apiConfig, enrichChapterPrompt({
    chapterText,
    wordNumber
  })))

  onProgress('Enrichment completed', 1, 1)
  return enrichedText || chapterText
}

/**
 * Export novel to text - Export novel as text
 */
export function exportNovelToText(project) {
  const lines = []
  
  // Title
  lines.push(`《${project.title}》`)
  lines.push('')
  lines.push(`Genre: ${formatGenre(project.genre)}`)
  lines.push(`Theme: ${project.topic}`)
  lines.push('')
  lines.push('=' .repeat(50))
  lines.push('')

  // Chapters
  const chapters = project.chapters || {}
  const chapterNums = Object.keys(chapters).map(Number).sort((a, b) => a - b)
  const blueprintChapters = parseChapterBlueprint(project.chapterBlueprint)

  for (const num of chapterNums) {
    const info = blueprintChapters.find(c => c.number === num)
    const title = info?.title || `Chapter ${num}`
    
    lines.push(`Chapter ${num} ${title}`)
    lines.push('')
    lines.push(chapters[num])
    lines.push('')
    lines.push('-'.repeat(30))
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Export novel to markdown - Export novel as Markdown
 */
export function exportNovelToMarkdown(project) {
  const lines = []
  
  // Title
  lines.push(`# ${project.title}`)
  lines.push('')
  lines.push(`> **Genre**: ${formatGenre(project.genre)}`)
  lines.push(`> **Theme**: ${project.topic}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // Chapters
  const chapters = project.chapters || {}
  const chapterNums = Object.keys(chapters).map(Number).sort((a, b) => a - b)
  const blueprintChapters = parseChapterBlueprint(project.chapterBlueprint)

  for (const num of chapterNums) {
    const info = blueprintChapters.find(c => c.number === num)
    const title = info?.title || `Chapter ${num}`
    
    lines.push(`## Chapter ${num} ${title}`)
    lines.push('')
    lines.push(chapters[num])
    lines.push('')
  }

  return lines.join('\n')
}
