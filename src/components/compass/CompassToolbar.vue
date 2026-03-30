<script setup>
import { NButton, NIcon, NSpace, NDropdown, NTooltip } from 'naive-ui'
import { RefreshOutline, DownloadOutline, ScanOutline, PlayOutline } from '@vicons/ionicons5'

const props = defineProps({
  isGenerating: Boolean,
  graphGenerated: Boolean,
  hasChapters: Boolean
})

const emit = defineEmits(['generate', 'update-snapshots', 'export-png', 'export-html', 'reset-view'])

const exportOptions = [
  { label: 'Export as PNG', key: 'png' },
  { label: 'Export as Interactive HTML', key: 'html' }
]

function handleExport(key) {
  if (key === 'png') emit('export-png')
  else if (key === 'html') emit('export-html')
}
</script>

<template>
  <div class="flex items-center justify-between flex-wrap gap-3 px-4 py-3 bg-white dark:bg-[#1f1f23] rounded-xl border border-gray-200/80 dark:border-gray-700/50">
    <div class="flex items-center gap-2">
      <n-tooltip trigger="hover">
        <template #trigger>
          <n-button
            type="primary"
            :loading="isGenerating"
            :disabled="isGenerating"
            @click="graphGenerated ? emit('generate') : emit('generate')"
          >
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            {{ graphGenerated ? 'Regenerate Graph' : 'Generate Graph' }}
          </n-button>
        </template>
        Extract entity relationships from novel architecture
      </n-tooltip>

      <n-button
        v-if="graphGenerated && hasChapters"
        secondary
        :loading="isGenerating"
        :disabled="isGenerating"
        @click="emit('update-snapshots')"
      >
        <template #icon>
          <n-icon><PlayOutline /></n-icon>
        </template>
        Update Chapter Snapshots
      </n-button>
    </div>

    <div class="flex items-center gap-2">
      <n-button
        v-if="graphGenerated"
        quaternary
        size="small"
        @click="emit('reset-view')"
      >
        <template #icon>
          <n-icon><ScanOutline /></n-icon>
        </template>
        Reset View
      </n-button>

      <n-dropdown
        v-if="graphGenerated"
        :options="exportOptions"
        @select="handleExport"
      >
        <n-button secondary size="small">
          <template #icon>
            <n-icon><DownloadOutline /></n-icon>
          </template>
          Export
        </n-button>
      </n-dropdown>
    </div>
  </div>
</template>
