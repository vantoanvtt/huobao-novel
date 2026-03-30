/**
 * Architecture Prompts - English Version
 * Used for generating various components of novel architecture
 */

/**
 * Core Seed Prompt
 * Snowflake method step 1 - Summarize story essence in a single sentence
 */
export const coreSeed = (params) => `
As a professional writer, please use the "Snowflake Method" step 1 to build the story core:
Topic: ${params.topic}
Genre: ${params.genre}
Length: Approximately ${params.numberOfChapters} chapters (each chapter ${params.wordNumber} words)

Based on the characteristics of the 【${params.genre}】 genre, summarize the essence of the story in a single sentence using a formula.

Examples for different genres:
- Mystery/Thriller: "When [protagonist] encounters [core event], must [key action], otherwise [disaster consequence]; meanwhile, [larger hidden crisis] is brewing."
- Romance/Heartwarming: "When [protagonist] meets [another character] in [background environment], they form a bond through [circumstance], and gain [emotional outcome] during [growth/healing process]."
- Fantasy/Xianxia: "When [protagonist] gains [opportunity], sets on [cultivation path], faces [challenges], gradually becomes [final achievement]."
- Contemporary/Realistic: "When [protagonist] faces [real difficulty], achieves [life goal] through [effort method], while gaining [emotional/growth]."

Requirements:
1. **Strictly adhere to the core characteristics and emotional tone of 【${params.genre}】 genre**
2. Embody character's core driving force
3. Hint at key features of worldview or story background
4. Use 25-100 words for precise expression

Return only the story core text, do not explain anything.
`

/**
 * Character Dynamics Prompt
 * Design core characters with dynamic change potential
 */
export const characterDynamics = (params) => `
Based on the following elements:
- Novel genre: ${params.genre || 'General'}
- Content guidance: ${params.userGuidance || 'None'}
- Core seed: ${params.coreSeed}

Please design 3-6 core characters with dynamic change potential. Each character should include:

Characteristics:
- Background, appearance, gender, age, profession, etc.
- Character's unique traits or growth potential

Core Motivation Triangle:
- Surface pursuit (material goals)
- Deep desire (emotional needs)
- Soul requirement (philosophical level)

Character Arc Design:
Initial state → Trigger event → Inner transformation → Growth milestone → Final state

Character Relationship Network (adjusted for 【${params.genre || 'General'}】 genre):
- Relationships and interaction patterns with other characters
- Source of bonds or tension between characters
- Emotional connection points (friendship/love/family/trust, etc.)
- Possible misunderstandings or obstacles to overcome

**Important**: Character design must fit the emotional tone of 【${params.genre || 'General'}】 genre.

Requirements:
Return only final text, do not explain anything.
`

/**
 * World Building Prompt
 * Three-dimensional interwoven approach to world construction
 */
export const worldBuilding = (params) => `
Based on the following elements:
- Novel genre: ${params.genre || 'General'}
- Content guidance: ${params.userGuidance || 'None'}
- Core story: "${params.coreSeed}"

To serve the above content, please build a worldview suitable for 【${params.genre || 'General'}】 genre:

1. Physical Dimension:
- Space structure (geographic environment, main scenes)
- Time background (era/time span when story takes place)
- Rule system (basic operating laws of this world)

2. Social Dimension:
- Social structure (social environment where characters exist)
- Cultural atmosphere (customs, habits, values)
- Lifestyle (details of daily life settings)

3. Emotional Dimension:
- Core imagery throughout the book (recurring scenes, objects, symbols)
- Correspondence between environmental atmosphere and story emotion
- How scene design strengthens the emotional experience of 【${params.genre || 'General'}】 genre

**Important**: World design must serve the core experience of 【${params.genre || 'General'}】 genre, creating an atmosphere fitting the genre characteristics.

Requirements:
Write the entire response in English only.
Do not use Chinese.
Each dimension should include at least 3 dynamic elements that can interact with character decisions.
Return only final text, do not explain anything.
`

/**
 * Plot Architecture Prompt
 * Three-act suspense structure
 */
export const plotArchitecture = (params) => `
Based on the following elements:
- Novel genre: ${params.genre || 'General'}
- Content guidance: ${params.userGuidance || 'None'}
- Core seed: ${params.coreSeed}
- Character system: ${params.characterDynamics}
- Worldview: ${params.worldBuilding}

Please design a three-act plot structure based on 【${params.genre || 'General'}】 genre:

Act I (Beginning)
- Daily state display (3 scene setups embodying the atmosphere of 【${params.genre || 'General'}】)
- Story introduction: Present the beginning of main line, emotional line, and side lines
- Inciting incident: The trigger that drives the story forward (changing character relationships or states)
- Initial reaction: Protagonist's first response to the change

Act II (Development)
- Plot deepening: Intertwined development of main line + emotional line
- Challenge and growth: Difficulties the character faces and inner transformation
- Emotional escalation/Conflict intensification: Key nodes in relationship development
- Important turning point: Pivotal moment that changes story direction

Act III (Climax and Resolution)
- Core conflict eruption: The climax of the story
- Character choice: Protagonist makes important decision
- Emotional/Event resolution: Resolution appropriate for 【${params.genre || 'General'}】 genre

**Important**: Plot design must meet reader expectations for 【${params.genre || 'General'}】 genre, ensuring consistent emotional tone.

Write the entire response in English only.
Do not use Chinese.
Each stage should include 3 key nodes with foreshadowing design.
Return only final text, do not explain anything.
`

/**
 * Character State Prompt
 * Generate initial character state document
 */
export const characterState = (params) => `
Based on current character dynamics definition: ${params.characterDynamics}

Please generate a character state document in this format:
Example:
Zhang San:
├── Items:
│  ├── Blue Robe: A worn blue long robe with dark red stains
│  └── Cold Iron Sword: A broken iron sword with ancient runes carved on the blade
├── Abilities
│  ├── Skill 1: Powerful spiritual perception ability: able to sense the inner thoughts of surrounding people
│  └── Skill 2: Invisible attack: able to release a spiritual attack that cannot be captured visually
├── Status
│  ├── Physical state: Standing tall, wearing luxurious armor, cold expression
│  └── Mental state: Currently calm, but harbors ambitions and anxiety about controlling Liu Xi town's future
├── Main Character Relationship Network
│  ├── Li Si: Zhang San has been associated with her since childhood, maintaining constant attention to her growth
│  └── Wang Er: They share a complicated past; recent conflict makes them feel threatened
├── Triggering or Deepening Events
│  ├── Mysterious symbols suddenly appear in village: These symbols hint at major events coming to Liu Xi town
│  └── Li Si is pierced through skin: This event makes them realize each other's power, prompting quick departure

Requirements:
Return only the written character state text, do not explain anything.
`

/**
 * Export all architecture prompts
 */
export const architecturePrompts = {
    coreSeed,
    characterDynamics,
    worldBuilding,
    plotArchitecture,
    characterState
}
