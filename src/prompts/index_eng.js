/**
 * Prompt Manager (English) - English Version Prompt Manager
 * Unified management of all English AI prompts, easy to maintain and extend
 */

import { architecturePrompts } from './architecture_eng'
import { chapterPrompts } from './chapter_eng'
import { utilityPrompts } from './utility_eng'
import { compassPrompts } from './compass_eng'

/**
 * Prompt Manager (English Version)
 * Provides unified interface for accessing English prompts
 */
class PromptManagerEng {
    constructor() {
        this.prompts = {
            architecture: architecturePrompts,
            chapter: chapterPrompts,
            utility: utilityPrompts,
            compass: compassPrompts
        }

        // Version number for tracking prompt updates
        this.version = '1.0.0'
    }

    /**
     * Get prompt
     * @param {string} category - Category (architecture/chapter/utility/compass)
     * @param {string} name - Prompt name
     * @param {object} params - Parameters
     * @returns {string} Generated prompt
     */
    get(category, name, params = {}) {
        const categoryPrompts = this.prompts[category]
        if (!categoryPrompts) {
            throw new Error(`Unknown prompt category: ${category}`)
        }

        const promptFn = categoryPrompts[name]
        if (!promptFn) {
            throw new Error(`Unknown prompt: ${category}.${name}`)
        }

        return promptFn(params)
    }

    /**
     * Get architecture prompts
     */
    getArchitecture(name, params) {
        return this.get('architecture', name, params)
    }

    /**
     * Get chapter prompts
     */
    getChapter(name, params) {
        return this.get('chapter', name, params)
    }

    /**
     * Get utility prompts
     */
    getUtility(name, params) {
        return this.get('utility', name, params)
    }

    /**
     * Get compass prompts
     */
    getCompass(name, params) {
        return this.get('compass', name, params)
    }

    /**
     * List all available prompts
     */
    list() {
        return Object.keys(this.prompts)
    }

    /**
     * List prompts in a category
     */
    listInCategory(category) {
        const categoryPrompts = this.prompts[category]
        if (!categoryPrompts) {
            throw new Error(`Unknown prompt category: ${category}`)
        }
        return Object.keys(categoryPrompts)
    }
}

// Export singleton instance
export const promptManagerEng = new PromptManagerEng()
export default promptManagerEng


export { architecturePrompts } from './architecture_eng'
export { chapterPrompts } from './chapter_eng'
export { utilityPrompts } from './utility_eng'
export { compassPrompts } from './compass_eng'
