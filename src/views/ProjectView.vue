<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNovelStore } from '../stores/novel'
import { useSettingsStore } from '../stores/settings'
import { generateArchitecture, generateChapterBlueprint, parseChapterBlueprint, exportNovelToText, exportNovelToMarkdown } from '../api/generator'
import { normalizeGenreList } from '../utils/genre'
import { useMessage, useDialog, NButton, NTabs, NTabPane, NCard, NProgress, NTag, NIcon } from 'naive-ui'
import { ArrowBackOutline, WarningOutline, GridOutline, ListOutline, PencilOutline, DownloadOutline, DocumentTextOutline, ReloadOutline, CompassOutline } from '@vicons/ionicons5'
import ArchitecturePanel from '../components/ArchitecturePanel.vue'
import ChapterBlueprintPanel from '../components/ChapterBlueprintPanel.vue'
import ChapterWriterPanel from '../components/ChapterWriterPanel.vue'
import InspirationCompass from '../components/compass/InspirationCompass.vue'

const route = useRoute()
const router = useRouter()
const novelStore = useNovelStore()
const settings = useSettingsStore()
const message = useMessage()
const dialog = useDialog()

// Current tab
const activeTab = ref('architecture')

// Generation state
const isGenerating = ref(false)
const generationStep = ref('')
const generationProgress = ref({ current: 0, total: 0 })

// Get current project
const project = computed(() => {
  return novelStore.projects.find(p => p.id === route.params.id)
})

// Parsed chapters
const chapters = computed(() => {
  if (!project.value?.chapterBlueprint) return []
  return parseChapterBlueprint(project.value.chapterBlueprint)
})

// Check if API is configured
const isApiConfigured = computed(() => {
  return !!settings.apiConfig.apiKey
})

const genreText = computed(() => {
  const genre = normalizeGenreList(project.value?.genre)
  if (Array.isArray(genre)) return genre.join(' / ')
  return genre || ''
})

// Load project on mount
onMounted(() => {
  if (!project.value) {
    message.error('Project not found')
    router.push('/')
  }
})

// Generate architecture
async function handleGenerateArchitecture() {
  if (!isApiConfigured.value) {
    message.warning('Please configure API Key in settings first')
    return
  }

  try {
    isGenerating.value = true
    
    const results = await generateArchitecture(
      project.value,
      settings.getStageConfig('architecture'),
      (step, current, total) => {
        generationStep.value = step
        generationProgress.value = { current, total }
      }
    )

    novelStore.updateProject(project.value.id, {
      ...results,
      architectureGenerated: true
    })

    message.success('Novel architecture generated successfully!')
  } catch (error) {
    console.error('Generation error:', error)
    message.error('Generation failed: ' + error.message)
  } finally {
    isGenerating.value = false
    generationStep.value = ''
  }
}

// Generate chapter blueprint
async function handleGenerateBlueprint() {
  if (!isApiConfigured.value) {
    message.warning('Please configure API Key in settings first')
    return
  }

  if (!project.value.architectureGenerated) {
    message.warning('Please generate novel architecture first')
    return
  }

  try {
    isGenerating.value = true
    
    const blueprint = await generateChapterBlueprint(
      project.value,
      settings.getStageConfig('blueprint'),
      (step, current, total) => {
        generationStep.value = step
        generationProgress.value = { current, total }
      }
    )

    novelStore.updateProject(project.value.id, {
      chapterBlueprint: blueprint,
      blueprintGenerated: true
    })

    message.success('Chapter blueprint generated successfully!')
  } catch (error) {
    console.error('Generation error:', error)
    message.error('Generation failed: ' + error.message)
  } finally {
    isGenerating.value = false
    generationStep.value = ''
  }
}

// Written chapters count
const writtenChaptersCount = computed(() => {
  return Object.keys(project.value?.chapters || {}).length
})

// Export novel
function handleExport(format) {
  if (!project.value) return
  
  const content = format === 'markdown' 
    ? exportNovelToMarkdown(project.value)
    : exportNovelToText(project.value)
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.value.title}.${format === 'markdown' ? 'md' : 'txt'}`
  a.click()
  URL.revokeObjectURL(url)
  
  message.success('Export successful')
}

// Regenerate confirmation
async function confirmRegenerate(type) {
  dialog.warning({
    title: 'Confirm Regenerate',
    content: `Are you sure you want to regenerate the ${type === 'architecture' ? 'novel architecture' : 'chapter blueprint'}? Existing content will be overwritten.`,
    positiveText: 'Regenerate',
    negativeText: 'Cancel',
    onPositiveClick: () => {
      if (type === 'architecture') {
        novelStore.updateProject(project.value.id, {
          coreSeed: '',
          characterDynamics: '',
          worldBuilding: '',
          plotArchitecture: '',
          characterState: '',
          architectureGenerated: false
        })
        handleGenerateArchitecture()
      } else {
        novelStore.updateProject(project.value.id, {
          chapterBlueprint: '',
          blueprintGenerated: false
        })
        handleGenerateBlueprint()
      }
    }
  })
}
</script>

<template>
  <div v-if="project" class="max-w-5xl mx-auto px-4">
    <!-- Project header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-4">
        <n-button text @click="router.push('/')">
          <template #icon>
            <n-icon><ArrowBackOutline /></n-icon>
          </template>
          Back
        </n-button>
      </div>
      
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {{ project.title }}
          </h1>
          <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <n-tag :bordered="false" round size="small">{{ genreText }}</n-tag>
            <span>{{ project.numberOfChapters }} chapters</span>
            <span>·</span>
            <span>{{ project.wordNumber }} words per chapter</span>
          </div>
        </div>

        <!-- API status indicator -->
        <div v-if="!isApiConfigured" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
          <WarningOutline class="w-5 h-5" />
          <span class="text-sm font-medium">Configure API Key</span>
        </div>
      </div>
    </div>

    <!-- Generation progress -->
    <div v-if="isGenerating" class="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-indigo-200/50 dark:border-indigo-700/50">
      <div class="flex items-center gap-4">
        <ReloadOutline class="w-6 h-6 text-indigo-500 animate-spin" />
        <div class="flex-1">
          <div class="text-gray-800 dark:text-white font-medium mb-2">
            {{ generationStep }}
          </div>
          <n-progress 
            type="line"
            :percentage="generationProgress.total > 0 ? Math.round((generationProgress.current / generationProgress.total) * 100) : 0"
            :height="8"
            :border-radius="4"
            :fill-border-radius="4"
            :show-indicator="false"
          />
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <n-tabs v-model:value="activeTab" type="segment" animated class="novel-tabs">
      <!-- Architecture tab -->
      <n-tab-pane name="architecture">
        <template #tab>
          <div class="flex items-center gap-2">
            <GridOutline class="w-4 h-4" />
            <span>Novel Architecture</span>
            <n-tag v-if="project.architectureGenerated" type="success" size="small" :bordered="false" round>
              Generated
            </n-tag>
          </div>
        </template>
        
        <ArchitecturePanel 
          :project="project"
          :is-generating="isGenerating"
          @generate="handleGenerateArchitecture"
          @regenerate="confirmRegenerate('architecture')"
        />
      </n-tab-pane>

      <!-- Chapter blueprint tab -->
      <n-tab-pane name="blueprint">
        <template #tab>
          <div class="flex items-center gap-2">
            <ListOutline class="w-4 h-4" />
            <span>Chapter Blueprint</span>
            <n-tag v-if="project.blueprintGenerated" type="success" size="small" :bordered="false" round>
              Generated
            </n-tag>
          </div>
        </template>

        <ChapterBlueprintPanel
          :project="project"
          :chapters="chapters"
          :is-generating="isGenerating"
          :architecture-generated="project.architectureGenerated"
          @generate="handleGenerateBlueprint"
          @regenerate="confirmRegenerate('blueprint')"
        />
      </n-tab-pane>

      <!-- Chapter writer tab -->
      <n-tab-pane name="writer">
        <template #tab>
          <div class="flex items-center gap-2">
            <PencilOutline class="w-4 h-4" />
            <span>Write Chapters</span>
            <n-tag v-if="writtenChaptersCount > 0" type="success" size="small" :bordered="false" round>
              {{ writtenChaptersCount }}/{{ project.numberOfChapters }}
            </n-tag>
          </div>
        </template>

        <ChapterWriterPanel
          :project="project"
          :is-generating="isGenerating"
          @update:is-generating="isGenerating = $event"
        />
      </n-tab-pane>

      <!-- Inspiration Compass tab -->
      <n-tab-pane name="compass">
        <template #tab>
          <div class="flex items-center gap-2">
            <CompassOutline class="w-4 h-4" />
            <span>Inspiration Compass</span>
            <n-tag v-if="project.graphData?.graphGenerated" type="success" size="small" :bordered="false" round>
              Generated
            </n-tag>
          </div>
        </template>

        <InspirationCompass
          :project="project"
          :is-generating="isGenerating"
          @update:is-generating="isGenerating = $event"
        />
      </n-tab-pane>

      <!-- Export tab -->
      <n-tab-pane name="export">
        <template #tab>
          <div class="flex items-center gap-2">
            <DownloadOutline class="w-4 h-4" />
            <span>Export</span>
          </div>
        </template>

        <div class="bg-white dark:bg-[#1f1f23] rounded-2xl p-8 border border-gray-200/80 dark:border-gray-700/50">
          <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-6">Export Novel</h3>
          
          <!-- Export stats -->
          <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-5 text-center">
              <div class="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{{ writtenChaptersCount }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Completed Chapters</div>
            </div>
            <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 text-center">
              <div class="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{{ project.numberOfChapters }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Chapters</div>
            </div>
            <div class="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 rounded-xl p-5 text-center">
              <div class="text-4xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                {{ Object.values(project.chapters || {}).reduce((a, b) => a + b.length, 0) }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Words</div>
            </div>
          </div>

          <!-- Export options -->
          <div class="flex gap-4">
            <n-button size="large" @click="handleExport('txt')" :disabled="writtenChaptersCount === 0" secondary>
              <template #icon>
                <n-icon><DocumentTextOutline /></n-icon>
              </template>
              Export as TXT
            </n-button>
            <n-button size="large" @click="handleExport('markdown')" :disabled="writtenChaptersCount === 0" secondary>
              <template #icon>
                <n-icon><DocumentTextOutline /></n-icon>
              </template>
              Export as Markdown
            </n-button>
          </div>

          <div v-if="writtenChaptersCount === 0" class="flex items-center gap-2 mt-6 text-amber-600 dark:text-amber-400 text-sm">
            <WarningOutline class="w-4 h-4" />
            No completed chapters yet. Please generate chapter content in the Write Chapters section
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>

  <!-- Not found state -->
  <div v-else class="text-center py-20">
    <WarningOutline class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
    <p class="text-gray-500 dark:text-gray-400 mb-6">Project not found or has been deleted</p>
    <n-button type="primary" @click="router.push('/')">
      Back to Home
    </n-button>
  </div>
</template>

<style>
.novel-tabs .n-tabs-nav {
  @apply bg-white dark:bg-[#1f1f23] rounded-xl p-1.5 border border-gray-200/80 dark:border-gray-700/50;
}

.novel-tabs .n-tabs-pane-wrapper {
  @apply pt-6;
}

.novel-tabs .n-tab-pane {
  @apply px-0;
}
</style>
