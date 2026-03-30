<script setup>
import { ref, watch } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useMessage } from 'naive-ui'
import { NModal, NCard, NForm, NFormItem, NInput, NButton, NSpace, NIcon, NTooltip, NTabs, NTabPane, NSelect, NAutoComplete } from 'naive-ui'
import { FlashOutline, HelpCircleOutline } from '@vicons/ionicons5'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const settings = useSettingsStore()
const message = useMessage()

// Channel configurations
const channels = [
  { 
    id: 'chatfire', 
    name: 'Chatfire',
    baseUrl: 'https://api.chatfire.site/v1',
    models: [
      // 'gpt-4o',
      // 'claude-sonnet-4-5-20250929',
      // 'kimi-k2-thinking',
      'gemini-3-flash-preview',
      'doubao-seed-1-8-251228',
      'gemini-3-pro-preview',
      // 'gemini-2.5-pro'
    ]
  },
  { 
    id: 'openai', 
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-5.2', 'gpt-4o', 'gpt-4o-mini']
  },
  { 
    id: 'gemini', 
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    models: ['gemini-2.5-pro', 'gemini-3-pro-preview']
  }
]

// Current channel
const currentChannel = ref('chatfire')

// Channel options for select
const channelOptions = channels.map(c => ({ label: c.name, value: c.id }))

// Current channel models
import { computed } from 'vue'
const currentChannelModels = computed(() => {
  const channel = channels.find(c => c.id === currentChannel.value)
  return channel?.models.map(m => ({ label: m, value: m })) || []
})

// Initialize with default values
const localConfig = ref({
  channel: 'chatfire',
  baseUrl: 'https://api.chatfire.site/v1',
  apiKey: '',
  model: 'gemini-3-flash-preview',
  temperature: 0.7,
  maxTokens: 8192,
  timeout: 600
})

// Handle channel change
function handleChannelChange(channelId) {
  currentChannel.value = channelId
  const channel = channels.find(c => c.id === channelId)
  if (channel) {
    localConfig.value.channel = channelId
    localConfig.value.baseUrl = channel.baseUrl
    localConfig.value.model = channel.models[0] || ''
  }
}

// Stage-specific models
const localStageModels = ref({
  architecture: '',
  blueprint: '',
  chapter: '',
  finalize: '',
  enrich: ''
})

// Stage labels
const stageLabels = {
  architecture: 'Architecture',
  blueprint: 'Blueprint',
  chapter: 'Chapter',
  finalize: 'Finalize',
  enrich: 'Enrich'
}

// Sync local config when dialog opens
watch(() => props.modelValue, (val) => {
  if (val) {
    localConfig.value = { ...settings.apiConfig }
    localStageModels.value = { ...settings.stageModels }
    currentChannel.value = localConfig.value.channel || 'chatfire'
  }
}, { immediate: true })

// Save settings
function saveSettings() {
  if (!localConfig.value.apiKey) {
    message.warning('Please enter API Key')
    return
  }
  settings.updateApiConfig(localConfig.value)
  settings.updateStageModels(localStageModels.value)
  message.success('Settings saved')
  emit('update:modelValue', false)
}

// Test connection
async function testConnection() {
  if (!localConfig.value.apiKey) {
    message.warning('Please enter API Key')
    return
  }
  
  try {
    const response = await fetch(`${localConfig.value.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${localConfig.value.apiKey}`
      }
    })
    
    if (response.ok) {
      message.success('Connection successful!')
    } else {
      message.error('Connection failed: ' + response.status)
    }
  } catch (error) {
    message.error('Connection failed: ' + error.message)
  }
}

function goToGetKey() {
  window.open('https://api.chatfire.site/login?inviteCode=EEE80324', '_blank')
}
</script>

<template>
  <n-modal
    :show="modelValue"
    @update:show="emit('update:modelValue', $event)"
    :mask-closable="false"
    preset="card"
    title="API Settings"
    style="width: 520px"
    :bordered="false"
    class="!rounded-2xl"
  >
    <n-form label-placement="top" class="space-y-1">
      <!-- Channel Select -->
      <n-form-item label="Channel">
        <n-select
          :value="currentChannel"
          :options="channelOptions"
          @update:value="handleChannelChange"
        />
      </n-form-item>

      <!-- API Base URL -->
      <n-form-item label="API Base URL">
        <n-input 
          v-model:value="localConfig.baseUrl" 
          placeholder="https://api.chatfire.site/v1"
        />
      </n-form-item>

      <!-- API Key -->
      <n-form-item label="API Key">
        <n-input 
          v-model:value="localConfig.apiKey" 
          type="password"
          placeholder="Enter API Key"
          show-password-on="click"
        />
      </n-form-item>

      <!-- Default Model -->
      <n-form-item>
        <template #label>
          <div class="flex items-center gap-1">
            <span>Default Model</span>
            <n-tooltip trigger="hover">
              <template #trigger>
                <n-icon class="text-gray-400 cursor-help" :size="14">
                  <HelpCircleOutline />
                </n-icon>
              </template>
              Use this model when stage-specific models are not configured
            </n-tooltip>
          </div>
        </template>
        <n-auto-complete
          v-model:value="localConfig.model"
          :options="currentChannelModels"
          :get-show="() => true"
          placeholder="Select or enter model name"
          clearable
        />
      </n-form-item>

      <!-- Stage-specific Models -->
      <div class="mt-4">
        <div class="flex items-center gap-1 mb-3">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Stage-specific Models</span>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-icon class="text-gray-400 cursor-help" :size="14">
                <HelpCircleOutline />
              </n-icon>
            </template>
            Leave empty to use default model
          </n-tooltip>
        </div>
        <n-tabs type="segment" size="small">
          <n-tab-pane v-for="(label, key) in stageLabels" :key="key" :name="key" :tab="label">
            <n-auto-complete
              v-model:value="localStageModels[key]"
              :options="currentChannelModels"
              :get-show="() => true"
              placeholder="Leave empty to use default model"
              class="mt-3"
              clearable
            />
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-form>

    <template #footer>
      <div class="flex justify-between">
        <n-space>
          <n-button @click="goToGetKey" tertiary>
            Get Key
          </n-button>
        </n-space>
        <n-space>
          <n-button @click="emit('update:modelValue', false)">Cancel</n-button>
          <n-button type="primary" @click="saveSettings">Save</n-button>
        </n-space>
      </div>
    </template>
  </n-modal>
</template>
