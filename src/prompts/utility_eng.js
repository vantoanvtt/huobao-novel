/**
 * Utility Prompts - English Version
 * Used for summary updates, character state updates, and other auxiliary functions
 */

/**
 * Previous Content Summary Update Prompt
 */
export const summary = (params) => `
The following is the newly completed chapter text:
${params.chapterText}

This is the current previous content summary (can be empty):
${params.globalSummary || '(None)'}

Please update the previous content summary based on new content in this chapter.

Requirements:
- Retain existing important information while integrating new plot points
- Use concise and coherent language to describe overall book progress
- Objective description, no expansion or interpretation
- Total word count controlled within 2000 words

Return only the previous content summary text, do not explain anything.
`

/**
 * Character State Update Prompt
 */
export const updateCharacterState = (params) => `
The following is the newly completed chapter text:
${params.chapterText}

This is the current character status document:
${params.oldState}

Please update the main character status document, maintaining the original format structure.

Requirements:
- Make additions/deletions directly based on existing document
- Maintain original structure, keep language concise and orderly
- Briefly describe newly appearing characters; can remove characters who fade from view
- Only modify what changed in this chapter

Return only the updated character status text, do not explain anything.
`

/**
 * Export all utility prompts
 */
export const utilityPrompts = {
    summary,
    updateCharacterState
}
