/**
 * Chapter Prompts - English Version
 * Used for generating chapter outlines and chapter content
 */

/**
 * Chapter Blueprint Prompt (all chapters at once)
 * Suspense rhythm curve design
 */
export const blueprint = (params) => `
Based on the following elements:
- Content guidance: ${params.userGuidance || 'None'}
- Novel architecture:
${params.novelArchitecture}

Design the rhythm distribution for ${params.numberOfChapters} chapters (adjust style based on novel genre):

1. Chapter Cluster Division:
- Every 3-5 chapters form a plot unit with complete minor climax
- Arrange emotional rhythm between units (tension and release balance)
- Reserve foreshadowing for key turning point chapters

2. Each chapter should clarify:
- Chapter positioning (character/event/theme etc.)
- Core content (plot advancement/emotional development/character growth, etc.)
- Emotional tone (emotional color fitting the novel genre)
- Foreshadowing operation (plant/reinforce/payoff)
- Plot tension (★☆☆☆☆ to ★★★★★)

Output format example:
Chapter n - [Title]
Chapter positioning: [character/event/theme/...]
Core function: [advancement/turning point/development/escalation/...]
Emotional intensity: [calm/gradual/climax/...]
Foreshadowing operation: Plant(A clue)→Reinforce(B relationship)...
Plot tension: ★☆☆☆☆
Chapter summary: [one-sentence summary]

Requirements:
- Use concise language, keep each chapter within 100 words.
- Arrange rhythm reasonably, ensure continuity of overall emotional curve.
- Do not include ending chapters before generating ${params.numberOfChapters} chapters.
- **Plot design must fit the style and emotional tone of the novel genre**.

Return only final text, do not explain anything.
`

/**
 * Chunked Chapter Blueprint Prompt
 * For generating chapters in batches
 */
export const blueprintChunked = (params) => `
Based on the following elements:
- Content guidance: ${params.userGuidance || 'None'}
- Novel architecture:
${params.novelArchitecture}

Need to generate total of ${params.numberOfChapters} chapters rhythm distribution.

Currently existing chapter outline (empty if first time generation):
${params.chapterList || '(None)'}

Now please design the rhythm distribution for chapters ${params.startChapter} to ${params.endChapter} (adjust style based on novel genre):

1. Chapter Cluster Division:
- Every 3-5 chapters form a plot unit with complete minor climax
- Arrange emotional rhythm between units (tension and release balance)
- Reserve foreshadowing for key turning point chapters

2. Each chapter should clarify:
- Chapter positioning (character/event/theme etc.)
- Core content (plot advancement/emotional development/character growth, etc.)
- Emotional tone (emotional color fitting the novel genre)
- Foreshadowing operation (plant/reinforce/payoff)
- Plot tension (★☆☆☆☆ to ★★★★★)

Output format example:
Chapter n - [Title]
Chapter positioning: [character/event/theme/...]
Core function: [advancement/turning point/development/escalation/...]
Emotional intensity: [calm/gradual/climax/...]
Foreshadowing operation: Plant(A clue)→Reinforce(B relationship)...
Plot tension: ★☆☆☆☆
Chapter summary: [one-sentence summary]

Requirements:
- Use concise language, keep each chapter within 100 words.
- Arrange rhythm reasonably, ensure continuity of overall emotional curve.
- Do not include ending chapters before generating ${params.numberOfChapters} chapters.
- **Plot design must fit the style and emotional tone of the novel genre**.

Return only final text, do not explain anything.
`

/**
 * First Chapter Draft Prompt
 */
export const firstDraft = (params) => `
About to write: Chapter ${params.chapterNumber} 《${params.chapterTitle}》
Chapter positioning: ${params.chapterRole}
Core function: ${params.chapterPurpose}
Suspense density: ${params.suspenseLevel}
Foreshadowing operation: ${params.foreshadowing}
Plot twist level: ${params.plotTwistLevel}
Chapter summary: ${params.chapterSummary}

Available elements:
- Core characters: ${params.charactersInvolved || '(Not specified)'}
- Key items: ${params.keyItems || '(Not specified)'}
- Scene location: ${params.sceneLocation || '(Not specified)'}
- Time pressure: ${params.timeConstraint || '(Not specified)'}

Reference documents:
- Novel setting:
${params.novelSetting}

Complete Chapter ${params.chapterNumber}'s content, word count requirement ${params.wordNumber} words. Design 2 or more scenes based on novel genre:

1. Dialogue Scene:
   - Embody character personality and relationships
   - Advance plot or emotional development

2. Action/Interaction Scene:
   - Environmental interaction details (sensory description)
   - Pacing control (adjust based on plot needs)
   - Reveal character traits through actions

3. Psychological/Emotional Scene:
   - Character's inner activity description
   - Delicate portrayal of emotional changes
   - Fit the emotional tone of the novel genre

4. Environmental Scene:
   - Scene atmosphere creation
   - Correspondence between environment and character feelings
   - Fit the overall style of the novel genre

Format requirements:
- Return only chapter content text;
- Do not use chapter sub-titles;
- Do not use markdown format.

Additional guidance: ${params.userGuidance || '(None)'}
`

/**
 * Subsequent Chapter Draft Prompt
 */
export const nextDraft = (params) => `
Reference documents:
└── Previous content summary:
    ${params.globalSummary}

└── End excerpt of previous chapter:
    ${params.previousChapterExcerpt}

└── User guidance:
    ${params.userGuidance || '(None)'}

└── Character status:
    ${params.characterState}

└── Current chapter summary:
    ${params.shortSummary || '(None)'}

Current chapter information:
Chapter ${params.chapterNumber} 《${params.chapterTitle}》:
├── Chapter positioning: ${params.chapterRole}
├── Core function: ${params.chapterPurpose}
├── Suspense density: ${params.suspenseLevel}
├── Foreshadowing design: ${params.foreshadowing}
├── Plot twist level: ${params.plotTwistLevel}
├── Chapter summary: ${params.chapterSummary}
├── Word count requirement: ${params.wordNumber} words
├── Core characters: ${params.charactersInvolved || '(Not specified)'}
├── Key items: ${params.keyItems || '(Not specified)'}
├── Scene location: ${params.sceneLocation || '(Not specified)'}
└── Time pressure: ${params.timeConstraint || '(Not specified)'}

Next chapter outline
Chapter ${params.nextChapterNumber} 《${params.nextChapterTitle}》:
├── Chapter positioning: ${params.nextChapterRole}
├── Core function: ${params.nextChapterPurpose}
├── Suspense density: ${params.nextSuspenseLevel}
├── Foreshadowing design: ${params.nextForeshadowing}
├── Plot twist level: ${params.nextPlotTwistLevel}
└── Chapter summary: ${params.nextChapterSummary}

Based on all the above settings, complete Chapter ${params.chapterNumber}'s content with ${params.wordNumber} words requirement.
Content generation strictly follows:
- User guidance
- Current chapter summary
- Current chapter information
- No logic gaps
Ensure chapter content connects smoothly with previous summary and previous chapter ending, maintaining complete context with next chapter outline.

Format requirements:
- Return only chapter content text;
- Do not use chapter sub-titles;
- Do not use markdown format.
`

/**
 * Chapter Enrichment Prompt
 */
export const enrich = (params) => `
The following chapter text is relatively short. Please expand it while maintaining plot continuity, bringing it closer to ${params.wordNumber} words.

Original content:
${params.chapterText}

Requirements:
- Maintain plot continuity
- Add environmental and psychological descriptions
- Enrich dialogue and scene details
- Return only final text, do not explain anything
`

/**
 * Export all chapter prompts
 */
export const chapterPrompts = {
    blueprint,
    blueprintChunked,
    firstDraft,
    nextDraft,
    enrich
}
