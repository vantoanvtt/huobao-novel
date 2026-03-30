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
  genre: ['玄幻'],
  numberOfChapters: 100,
  wordNumber: 3000,
  userGuidance: ''
})

// Genre options
const genreOptions = [
  { label: 'Fantasy', value: '玄幻' },
  { label: 'Xianxia', value: '仙侠' },
  { label: 'Urban', value: '都市' },
  { label: 'Historical', value: '历史' },
  { label: 'Sci-Fi', value: '科幻' },
  { label: 'Game', value: '游戏' },
  { label: 'Mystery', value: '悬疑' },
  { label: 'Supernatural', value: '奇幻' },
  { label: 'Martial Arts', value: '武侠' },
  { label: 'Romance', value: '言情' },
  { label: 'Military', value: '军事' },
  { label: 'Sports', value: '体育' },
  { label: 'Horror', value: '灵异' },
  { label: 'Anime', value: '二次元' },
  { label: 'Other', value: '其他' }
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
    form.genre = ['玄幻']
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
