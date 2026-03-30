<script setup>
import { ref, computed } from 'vue'
import { useNovelStore } from '../stores/novel'
import { useSettingsStore } from '../stores/settings'
import { generateChapterDraft, finalizeChapter, enrichChapter, parseChapterBlueprint } from '../api/generator'
import { generateChapterGraph } from '../api/compass-generator'
import { useMessage, useDialog, NButton, NInput, NProgress, NTag, NIcon, NTooltip } from 'naive-ui'
import { WarningOutline, SparklesOutline, PencilOutline, SaveOutline, CheckmarkOutline, CheckmarkCircleOutline, ReloadOutline, HelpCircleOutline, DocumentTextOutline } from '@vicons/ionicons5'
import ChapterRelationGraph from './compass/ChapterRelationGraph.vue'

const props = defineProps({
  project: Object,
  isGenerating: Boolean
})

const emit = defineEmits(['update:isGenerating'])
const novelStore = useNovelStore()
const settings = useSettingsStore()
const message = useMessage()
const dialog = useDialog()

// Current chapter being written
const currentChapter = ref(1)
const chapterContent = ref('')
const generationStep = ref('')
const graphGenerating = ref(false)
const graphStep = ref('')

// Parsed blueprint chapters
const blueprintChapters = computed(() => {
  if (!props.project?.chapterBlueprint) return []
  return parseChapterBlueprint(props.project.chapterBlueprint)
})

// Written chapters count - 已写章节数
const writtenChaptersCount = computed(() => {
  return Object.keys(props.project?.chapters || {}).length
})

// Next chapter to write - 下一个要写的章节
const nextChapterToWrite = computed(() => {
  const chapters = props.project?.chapters || {}
  for (let i = 1; i <= props.project?.numberOfChapters; i++) {
    if (!chapters[i]) return i
  }
  return props.project?.numberOfChapters || 1
})

// Current chapter info from blueprint - 当前章节大纲信息
const currentChapterInfo = computed(() => {
  return blueprintChapters.value.find(c => c.number === currentChapter.value) || null
})

// Check if chapter exists - 检查章节是否已存在
const chapterExists = computed(() => {
  return !!props.project?.chapters?.[currentChapter.value]
})

// Current chapter's relation graph data
const currentChapterGraph = computed(() => {
  return props.project?.chapterGraphs?.[currentChapter.value] || null
})

// Load chapter content when switching - 切换章节时加载内容
function loadChapter(num) {
  currentChapter.value = num
  chapterContent.value = props.project?.chapters?.[num] || ''
}

// Generate chapter draft - 生成章节草稿
async function handleGenerate() {
  if (!settings.apiConfig.apiKey) {
    message.warning('Please configure the API Key in Settings first')
    return
  }

  if (!props.project?.blueprintGenerated) {
    message.warning('Please generate the chapter blueprint first')
    return
  }

  // Check if previous chapters exist for non-first chapters
  if (currentChapter.value > 1 && !props.project?.chapters?.[currentChapter.value - 1]) {
    const confirmed = await new Promise((resolve) => {
      dialog.warning({
        title: 'Continue Out of Order?',
        content: `Chapter ${currentChapter.value - 1} has not been generated yet. Generating in order is recommended. Continue anyway?`,
        positiveText: 'Continue',
        negativeText: 'Cancel',
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false)
      })
    })
    if (!confirmed) return
  }

  try {
    emit('update:isGenerating', true)
    
    const draft = await generateChapterDraft(
      props.project,
      currentChapter.value,
      settings.getStageConfig('chapter'),
      (step) => { generationStep.value = step }
    )

    chapterContent.value = draft
    message.success(`Chapter ${currentChapter.value} draft generated`)
  } catch (error) {
    console.error('Generation error:', error)
    message.error('Generation failed: ' + error.message)
  } finally {
    emit('update:isGenerating', false)
    generationStep.value = ''
  }
}

// Save and finalize chapter - 保存并定稿章节
async function handleSaveAndFinalize() {
  if (!chapterContent.value.trim()) {
    message.warning('Chapter content is empty')
    return
  }

  if (!settings.apiConfig.apiKey) {
    message.warning('Please configure the API Key in Settings first')
    return
  }

  try {
    emit('update:isGenerating', true)

    // Save chapter content - 保存章节内容
    const updatedChapters = { ...props.project.chapters, [currentChapter.value]: chapterContent.value }
    
    // Finalize chapter (update summary and character state)
    const updates = await finalizeChapter(
      props.project,
      currentChapter.value,
      chapterContent.value,
      settings.getStageConfig('finalize'),
      (step) => { generationStep.value = step }
    )

    novelStore.updateProject(props.project.id, {
      chapters: updatedChapters,
      ...updates
    })

    message.success(`Chapter ${currentChapter.value} saved and finalized`)

    // Generate chapter relation graph in background
    const savedChapter = currentChapter.value
    const savedContent = chapterContent.value
    generateChapterGraphData(savedChapter, savedContent)

    // Auto advance to next chapter - 自动跳转到下一章
    if (currentChapter.value < props.project.numberOfChapters) {
      currentChapter.value++
      chapterContent.value = ''
    }
  } catch (error) {
    console.error('Finalize error:', error)
    message.error('Save failed: ' + error.message)
  } finally {
    emit('update:isGenerating', false)
    generationStep.value = ''
  }
}

// Quick save without finalize - 快速保存（不定稿）
function handleQuickSave() {
  if (!chapterContent.value.trim()) {
    message.warning('Chapter content is empty')
    return
  }

  const updatedChapters = { ...props.project.chapters, [currentChapter.value]: chapterContent.value }
  novelStore.updateProject(props.project.id, { chapters: updatedChapters })
  message.success('Saved')
}

// Enrich chapter - 扩写章节
async function handleEnrich() {
  if (!chapterContent.value.trim()) {
    message.warning('Please generate or enter chapter content first')
    return
  }

  if (!settings.apiConfig.apiKey) {
    message.warning('Please configure the API Key in Settings first')
    return
  }

  try {
    emit('update:isGenerating', true)
    
    const enriched = await enrichChapter(
      chapterContent.value,
      props.project.wordNumber,
      settings.getStageConfig('enrich'),
      (step) => { generationStep.value = step }
    )

    chapterContent.value = enriched
    message.success('Chapter enriched')
  } catch (error) {
    console.error('Enrich error:', error)
    message.error('Enrich failed: ' + error.message)
  } finally {
    emit('update:isGenerating', false)
    generationStep.value = ''
  }
}

// Generate chapter relation graph - 生成章节关系图谱
async function generateChapterGraphData(chapterNum, chapterText) {
  try {
    graphGenerating.value = true
    graphStep.value = 'Extracting chapter relationship graph...'

    const graphResult = await generateChapterGraph(
      props.project,
      chapterNum,
      chapterText,
      settings.getStageConfig('architecture'),
      (step) => { graphStep.value = step }
    )

    const updatedChapterGraphs = { ...props.project.chapterGraphs, [chapterNum]: graphResult }
    novelStore.updateProject(props.project.id, { chapterGraphs: updatedChapterGraphs })
    message.success(`Chapter ${chapterNum} relationship graph generated`)
  } catch (err) {
    console.error('Chapter graph error:', err)
    message.warning('Relationship graph generation failed: ' + err.message)
  } finally {
    graphGenerating.value = false
    graphStep.value = ''
  }
}

// Initialize with next chapter to write - 初始化到下一个要写的章节
loadChapter(nextChapterToWrite.value)
</script>

<template>
  <div class="space-y-4">
    <!-- Not ready state -->
    <div 
      v-if="!project?.blueprintGenerated" 
      class="bg-white dark:bg-[#1f1f23] rounded-2xl p-12 border border-gray-200/80 dark:border-gray-700/50 text-center"
    >
      <div class="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/25">
        <WarningOutline class="w-12 h-12 text-white" />
      </div>
      <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-3">Generate Chapter Blueprint First</h3>
      <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
        Chapter text generation requires chapter blueprint
      </p>
    </div>

      <!-- Main content -->
    <template v-else>
      <!-- Progress indicator -->
      <div class="bg-white dark:bg-[#1f1f23] rounded-xl p-5 border border-gray-200/80 dark:border-gray-700/50">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Writing Progress</span>
          <span class="text-sm font-bold text-gray-800 dark:text-white">
            {{ writtenChaptersCount }} / {{ project.numberOfChapters }} chapters
          </span>
        </div>
        <n-progress 
          type="line"
          :percentage="Math.round((writtenChaptersCount / project.numberOfChapters) * 100)"
          :height="10"
          :border-radius="6"
          :fill-border-radius="6"
          :show-indicator="false"
        />
      </div>

      <!-- Chapter selector and editor -->
      <div class="grid grid-cols-12 gap-4">
        <!-- Chapter list sidebar -->
        <div class="col-span-3">
          <div class="bg-white dark:bg-[#1f1f23] rounded-xl border border-gray-200/80 dark:border-gray-700/50 overflow-hidden">
            <div class="p-4 border-b border-gray-200/80 dark:border-gray-700/50">
              <h3 class="font-semibold text-gray-800 dark:text-white">Chapter List</h3>
            </div>
            <div class="max-h-[500px] overflow-y-auto">
              <div
                v-for="ch in blueprintChapters"
                :key="ch.number"
                class="px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                :class="{ 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 !border-l-indigo-500': ch.number === currentChapter }"
                @click="loadChapter(ch.number)"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-800 dark:text-white truncate flex-1">
                    Chapter {{ ch.number }}
                  </span>
                  <CheckmarkCircleOutline v-if="project.chapters?.[ch.number]" class="w-5 h-5 text-green-500 ml-2" />
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{{ ch.title }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Editor area -->
        <div class="col-span-9 space-y-4">
          <!-- Chapter info header -->
          <div class="bg-white dark:bg-[#1f1f23] rounded-xl p-5 border border-gray-200/80 dark:border-gray-700/50">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-bold text-gray-800 dark:text-white">
                Chapter {{ currentChapter }} - {{ currentChapterInfo?.title || 'Untitled' }}
              </h3>
              <div class="flex items-center gap-2">
                <n-tag v-if="chapterExists" type="success" size="small" :bordered="false" round>Saved</n-tag>
                <n-tag v-else type="info" size="small" :bordered="false" round>Unsaved</n-tag>
              </div>
            </div>
            
            <!-- Chapter meta info -->
            <div v-if="currentChapterInfo" class="flex flex-wrap gap-2 text-xs">
              <n-tag size="small" :bordered="false" round>{{ currentChapterInfo.position }}</n-tag>
              <n-tag size="small" type="success" :bordered="false" round>{{ currentChapterInfo.purpose }}</n-tag>
              <n-tag size="small" type="warning" :bordered="false" round>{{ currentChapterInfo.suspense }}</n-tag>
            </div>
            <p v-if="currentChapterInfo?.summary" class="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
              {{ currentChapterInfo.summary }}
            </p>
          </div>

          <!-- Global Summary -->
          <div 
            v-if="currentChapter > 1 && project.globalSummary" 
            class="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl p-4 border border-amber-200/50 dark:border-amber-700/30"
          >
            <div class="flex items-center gap-2 mb-2">
              <DocumentTextOutline class="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span class="text-sm font-medium text-amber-700 dark:text-amber-300">Previous Summary</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
              {{ project.globalSummary }}
            </p>
          </div>

          <!-- Generation status -->
          <div v-if="isGenerating" class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-700/50">
            <div class="flex items-center gap-3">
              <ReloadOutline class="w-5 h-5 text-indigo-500 animate-spin" />
              <span class="text-indigo-700 dark:text-indigo-300 font-medium">{{ generationStep || 'Processing...' }}</span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center gap-2 flex-wrap">
            <n-button type="primary" :loading="isGenerating" @click="handleGenerate">
              <template #icon>
                <n-icon><SparklesOutline /></n-icon>
              </template>
              Generate Draft
            </n-button>
            <n-button :disabled="isGenerating || !chapterContent" @click="handleEnrich" secondary>
              <template #icon>
                <n-icon><PencilOutline /></n-icon>
              </template>
              Enrich
            </n-button>
            <div class="flex-1"></div>
            <n-button :disabled="isGenerating || !chapterContent" @click="handleQuickSave" tertiary>
              <template #icon>
                <n-icon><SaveOutline /></n-icon>
              </template>
              Quick Save
            </n-button>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-icon class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" :size="18">
                  <HelpCircleOutline />
                </n-icon>
              </template>
              Save chapter content only, without updating the summary or character state
            </n-tooltip>
            <n-button type="success" :loading="isGenerating" :disabled="!chapterContent" @click="handleSaveAndFinalize">
              <template #icon>
                <n-icon><CheckmarkOutline /></n-icon>
              </template>
              Save and Finalize
            </n-button>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-icon class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" :size="18">
                  <HelpCircleOutline />
                </n-icon>
              </template>
              Save the chapter and update the summary and character state for later-chapter continuity
            </n-tooltip>
          </div>

          <!-- Editor textarea -->
          <n-input
            v-model:value="chapterContent"
            type="textarea"
            :autosize="{ minRows: 20, maxRows: 40 }"
            :placeholder="`Write or generate Chapter ${currentChapter} here...`"
            class="novel-textarea"
          />

          <!-- Word count -->
          <div class="text-right text-sm text-gray-500 dark:text-gray-400">
            Current words: <span class="font-medium text-gray-700 dark:text-gray-300">{{ chapterContent.length }}</span> / Target: {{ project.wordNumber }}
          </div>

          <!-- Chapter relation graph -->
          <div v-if="graphGenerating" class="flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-sm text-indigo-600 dark:text-indigo-400">
            <span class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            {{ graphStep || 'Generating relationship graph...' }}
          </div>
          <div v-if="currentChapterGraph" class="bg-white dark:bg-[#1f1f23] rounded-xl border border-gray-200/80 dark:border-gray-700/50 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-200/80 dark:border-gray-700/50 flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Chapter Relationship Graph</span>
              <n-tag size="small" :bordered="false" round type="info">
                {{ currentChapterGraph.nodes?.length || 0 }} characters · {{ currentChapterGraph.edges?.length || 0 }} relationships
              </n-tag>
            </div>
            <ChapterRelationGraph :graph-data="currentChapterGraph" :height="360" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
