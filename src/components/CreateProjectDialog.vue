<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNovelStore } from '../stores/novel'
import { useMessage } from 'naive-ui'
import { NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NButton, NSpace, NIcon } from 'naive-ui'
import { CheckmarkOutline } from '@vicons/ionicons5'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])
const router = useRouter()
const novelStore = useNovelStore()
const message = useMessage()

// Form data
const formRef = ref(null)
const form = reactive({
  title: '',
  topic: '',
  genre: ['Fantasy'],
  numberOfChapters: 100,
  wordNumber: 3000,
  userGuidance: ''
})

// Genre options
const genreOptions = [
  { label: 'Fantasy', value: 'Fantasy' },
  { label: 'Xianxia', value: 'Xianxia' },
  { label: 'Urban', value: 'Urban' },
  { label: 'Historical', value: 'Historical' },
  { label: 'Sci-Fi', value: 'Sci-Fi' },
  { label: 'Game', value: 'Game' },
  { label: 'Mystery', value: 'Mystery' },
  { label: 'Supernatural', value: 'Supernatural' },
  { label: 'Martial Arts', value: 'Martial Arts' },
  { label: 'Romance', value: 'Romance' },
  { label: 'Military', value: 'Military' },
  { label: 'Sports', value: 'Sports' },
  { label: 'Horror', value: 'Horror' },
  { label: 'Anime', value: 'Anime' },
  { label: 'Other', value: 'Other' }
]

// Form rules
const rules = {
  title: [{ required: true, message: 'Please enter project name', trigger: 'blur' }],
  topic: [{ required: true, message: 'Please enter novel topic', trigger: 'blur' }],
  genre: [
    {
      required: true,
      trigger: 'change',
      validator: (_rule, value) => {
        if (Array.isArray(value) && value.length > 0) return true
        return new Error('Please select novel genre')
      }
    }
  ],
  numberOfChapters: [{ required: true, message: 'Please enter number of chapters', trigger: 'blur', type: 'number' }],
  wordNumber: [{ required: true, message: 'Please enter words per chapter', trigger: 'blur', type: 'number' }]
}

// Reset form when dialog opens
watch(() => props.modelValue, (val) => {
  if (val) {
    form.title = ''
    form.topic = ''
    form.genre = ['Fantasy']
    form.numberOfChapters = 100
    form.wordNumber = 3000
    form.userGuidance = ''
  }
})

// Create project
async function createProject() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    const project = novelStore.createProject({
      title: form.title,
      topic: form.topic,
      genre: form.genre,
      numberOfChapters: form.numberOfChapters,
      wordNumber: form.wordNumber,
      userGuidance: form.userGuidance
    })
    
    message.success('Project created successfully')
    emit('update:modelValue', false)
    router.push(`/project/${project.id}`)
  } catch (error) {
    // Validation failed
  }
}
</script>

<template>
  <n-modal
    :show="modelValue"
    @update:show="emit('update:modelValue', $event)"
    :mask-closable="false"
    preset="card"
    title="Create New Project"
    style="width: 620px"
    :bordered="false"
    class="!rounded-2xl"
  >
    <n-form 
      ref="formRef"
      :model="form" 
      :rules="rules"
      label-placement="top"
      class="space-y-1"
    >
      <!-- Project title -->
      <n-form-item label="Project Name" path="title">
        <n-input 
          v-model:value="form.title" 
          placeholder="e.g., Star and Sea"
          :maxlength="50"
          show-count
        />
      </n-form-item>

      <!-- Novel topic -->
      <n-form-item label="Novel Topic / Core Concept" path="topic">
        <n-input 
          v-model:value="form.topic" 
          type="textarea"
          :rows="3"
          placeholder="Describe your novel core concept..."
          :maxlength="500"
          show-count
        />
      </n-form-item>

      <!-- Genre selection -->
      <n-form-item label="Novel Genre" path="genre">
        <n-select 
          v-model:value="form.genre" 
          :options="genreOptions"
          multiple
          class="w-full"
        />
      </n-form-item>

      <!-- Chapter count and word count -->
      <div class="grid grid-cols-2 gap-4">
        <n-form-item label="Number of Chapters" path="numberOfChapters">
          <n-input-number 
            v-model:value="form.numberOfChapters" 
            :min="10" 
            :max="500"
            :step="10"
            class="w-full"
          />
        </n-form-item>

        <n-form-item label="Words per Chapter" path="wordNumber">
          <n-input-number 
            v-model:value="form.wordNumber" 
            :min="1000" 
            :max="10000"
            :step="500"
            class="w-full"
          />
        </n-form-item>
      </div>

      <!-- User guidance -->
      <n-form-item label="Creation Guidance (Optional)">
        <n-input 
          v-model:value="form.userGuidance" 
          type="textarea"
          :rows="3"
          placeholder="Add additional creation requirements here, such as character settings, plot direction, writing style, etc."
          :maxlength="1000"
          show-count
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('update:modelValue', false)">Cancel</n-button>
        <n-button type="primary" @click="createProject">
          <template #icon>
            <n-icon><CheckmarkOutline /></n-icon>
          </template>
          Create Project
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
