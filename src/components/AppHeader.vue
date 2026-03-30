<script setup>
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import SettingsDialog from './SettingsDialog.vue'
import { ref } from 'vue'
import { NButton, NTooltip } from 'naive-ui'
import { PencilOutline, SunnyOutline, MoonOutline, SettingsOutline } from '@vicons/ionicons5'

const router = useRouter()
const settings = useSettingsStore()
const showSettings = ref(false)
</script>

<template>
  <header class="sticky top-0 z-50 bg-white/90 dark:bg-[#18181c]/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60 shadow-sm">
    <div class="container mx-auto px-6">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Title -->
        <div 
          class="flex items-center gap-3 cursor-pointer group"
          @click="router.push('/')"
        >
          <div class="w-10 h-10 rounded-xl  flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300 group-hover:scale-105">
            <img src="@/assets/logo.png" />
          </div>
          <div>
            <h1 class="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">AI Novel Generator</h1>
            <p class="text-xs text-gray-400 dark:text-gray-500">Novel Generator</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <!-- Theme toggle -->
          <n-tooltip :show-arrow="false">
            <template #trigger>
              <n-button 
                circle 
                quaternary
                @click="settings.toggleDark"
                class="!w-10 !h-10"
              >
                <template #icon>
                  <SunnyOutline v-if="settings.isDark" class="w-5 h-5" />
                  <MoonOutline v-else class="w-5 h-5" />
                </template>
              </n-button>
            </template>
            {{ settings.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode' }}
          </n-tooltip>

          <!-- Settings -->
          <n-tooltip :show-arrow="false">
            <template #trigger>
              <n-button 
                circle 
                quaternary
                @click="showSettings = true"
                class="!w-10 !h-10"
              >
                <template #icon>
                  <SettingsOutline class="w-5 h-5" />
                </template>
              </n-button>
            </template>
            Settings
          </n-tooltip>
        </div>
      </div>
    </div>
  </header>
  <SettingsDialog v-model="showSettings" />
</template>
