import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Novel project store
export const useNovelStore = defineStore('novel', () => {
  // State
  const projects = ref(JSON.parse(localStorage.getItem('novel_projects') || '[]'))
  const currentProject = ref(null)
  const isGenerating = ref(false)
  const generationProgress = ref('')

  // Getters
  const projectList = computed(() => projects.value)
  const hasProjects = computed(() => projects.value.length > 0)

  // Actions
  // Create a new novel project
  function createProject(projectData) {
    const newProject = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...projectData,
      // Architecture data
      coreSeed: '',
      characterDynamics: '',
      worldBuilding: '',
      plotArchitecture: '',
      characterState: '',
      // Chapter blueprint
      chapterBlueprint: '',
      // Chapters content (key: chapter number, value: chapter text)
      chapters: {},
      // Global summary
      globalSummary: '',
      // Graph data
      graphData: {
        version: 1,
        generatedAt: null,
        snapshots: {},
        audit: { inconsistencies: [], lastAuditAt: null },
        graphGenerated: false
      },
      // Chapter graphs - { [chapterNum]: { nodes, edges } }
      chapterGraphs: {},
      // Generation status
      architectureGenerated: false,
      blueprintGenerated: false
    }
    projects.value.unshift(newProject)
    saveToStorage()
    return newProject
  }

  // Update project
  function updateProject(id, updates) {
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value[index] = {
        ...projects.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveToStorage()
      if (currentProject.value?.id === id) {
        currentProject.value = projects.value[index]
      }
    }
  }

  // Delete project
  function deleteProject(id) {
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value.splice(index, 1)
      saveToStorage()
      if (currentProject.value?.id === id) {
        currentProject.value = null
      }
    }
  }

  // Set current project
  function setCurrentProject(id) {
    currentProject.value = projects.value.find(p => p.id === id) || null
  }

  // Save to localStorage
  function saveToStorage() {
    localStorage.setItem('novel_projects', JSON.stringify(projects.value))
  }

  // Set generation state
  function setGenerating(value, progress = '') {
    isGenerating.value = value
    generationProgress.value = progress
  }

  return {
    projects,
    currentProject,
    isGenerating,
    generationProgress,
    projectList,
    hasProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    setGenerating
  }
})
