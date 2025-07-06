<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-gray-800">Settings</h1>
          <button
            @click="$router.push('/play')"
            class="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X class="w-6 h-6" />
          </button>
        </div>
        <p class="text-gray-600 mt-2">Customize your game experience</p>
      </div>

      <!-- Settings Tabs -->
      <div class="bg-white rounded-lg shadow-md">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'px-6 py-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              <component :is="tab.icon" class="w-4 h-4 inline-block mr-2" />
              {{ tab.name }}
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Game Settings -->
          <div v-if="activeTab === 'game'" class="space-y-6">
            <SettingSection title="Difficulty">
              <SettingRow label="Default Difficulty">
                <select
                  v-model="settingsStore.gameSettings.value.defaultDifficulty"
                  @change="updateGameSettings({ defaultDifficulty: $event.target.value })"
                  class="input-select"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </SettingRow>
              <SettingRow label="Auto-select difficulty based on performance">
                <ToggleSwitch
                  v-model="settingsStore.gameSettings.value.autoSelectDifficulty"
                  @update:modelValue="updateGameSettings({ autoSelectDifficulty: $event })"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection title="Hints">
              <SettingRow label="Enable hints">
                <ToggleSwitch
                  v-model="settingsStore.gameSettings.value.enableHints"
                  @update:modelValue="updateGameSettings({ enableHints: $event })"
                />
              </SettingRow>
              <SettingRow 
                label="Hint delay (seconds)"
                :disabled="!settingsStore.gameSettings.value.enableHints"
              >
                <input
                  type="number"
                  v-model.number="settingsStore.gameSettings.value.hintDelay"
                  @change="updateGameSettings({ hintDelay: $event.target.value })"
                  min="0"
                  max="300"
                  class="input-number"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection title="Sound">
              <SettingRow label="Enable sound">
                <ToggleSwitch
                  v-model="settingsStore.gameSettings.value.enableSound"
                  @update:modelValue="updateGameSettings({ enableSound: $event })"
                />
              </SettingRow>
              <SettingRow 
                label="Master volume"
                :disabled="!settingsStore.gameSettings.value.enableSound"
              >
                <RangeSlider
                  v-model="settingsStore.gameSettings.value.masterVolume"
                  @update:modelValue="updateGameSettings({ masterVolume: $event })"
                  :min="0"
                  :max="100"
                />
              </SettingRow>
              <SettingRow 
                label="Effects volume"
                :disabled="!settingsStore.gameSettings.value.enableSound"
              >
                <RangeSlider
                  v-model="settingsStore.gameSettings.value.effectsVolume"
                  @update:modelValue="updateGameSettings({ effectsVolume: $event })"
                  :min="0"
                  :max="100"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection title="Gameplay">
              <SettingRow label="Show timer">
                <ToggleSwitch
                  v-model="settingsStore.gameSettings.value.showTimer"
                  @update:modelValue="updateGameSettings({ showTimer: $event })"
                />
              </SettingRow>
              <SettingRow label="Pause when window loses focus">
                <ToggleSwitch
                  v-model="settingsStore.gameSettings.value.pauseOnBlur"
                  @update:modelValue="updateGameSettings({ pauseOnBlur: $event })"
                />
              </SettingRow>
              <SettingRow label="Confirm before quitting puzzle">
                <ToggleSwitch
                  v-model="settingsStore.gameSettings.value.confirmBeforeQuit"
                  @update:modelValue="updateGameSettings({ confirmBeforeQuit: $event })"
                />
              </SettingRow>
            </SettingSection>
          </div>

          <!-- UI Settings -->
          <div v-if="activeTab === 'ui'" class="space-y-6">
            <SettingSection title="Appearance">
              <SettingRow label="Theme">
                <select
                  v-model="settingsStore.uiSettings.value.theme"
                  @change="updateUISettings({ theme: $event.target.value })"
                  class="input-select"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </SettingRow>
              <SettingRow label="Color scheme">
                <select
                  v-model="settingsStore.uiSettings.value.colorScheme"
                  @change="updateUISettings({ colorScheme: $event.target.value })"
                  class="input-select"
                >
                  <option value="default">Default</option>
                  <option value="colorblind">Colorblind friendly</option>
                  <option value="high-contrast">High contrast</option>
                </select>
              </SettingRow>
              <SettingRow label="Font size">
                <select
                  v-model="settingsStore.uiSettings.value.fontSize"
                  @change="updateUISettings({ fontSize: $event.target.value })"
                  class="input-select"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </SettingRow>
            </SettingSection>

            <SettingSection title="Display Options">
              <SettingRow label="Reduce motion">
                <ToggleSwitch
                  v-model="settingsStore.uiSettings.value.reducedMotion"
                  @update:modelValue="updateUISettings({ reducedMotion: $event })"
                />
              </SettingRow>
              <SettingRow label="Compact mode">
                <ToggleSwitch
                  v-model="settingsStore.uiSettings.value.compactMode"
                  @update:modelValue="updateUISettings({ compactMode: $event })"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection title="Game Board">
              <SettingRow label="Highlight selected cell">
                <ToggleSwitch
                  v-model="settingsStore.uiSettings.value.highlightSelection"
                  @update:modelValue="updateUISettings({ highlightSelection: $event })"
                />
              </SettingRow>
              <SettingRow label="Highlight conflicts">
                <ToggleSwitch
                  v-model="settingsStore.uiSettings.value.highlightConflicts"
                  @update:modelValue="updateUISettings({ highlightConflicts: $event })"
                />
              </SettingRow>
              <SettingRow label="Show possible values">
                <ToggleSwitch
                  v-model="settingsStore.uiSettings.value.showPossibleValues"
                  @update:modelValue="updateUISettings({ showPossibleValues: $event })"
                />
              </SettingRow>
            </SettingSection>
          </div>

          <!-- Notifications -->
          <div v-if="activeTab === 'notifications'" class="space-y-6">
            <SettingSection title="In-Game Notifications">
              <SettingRow label="Show achievement notifications">
                <ToggleSwitch
                  v-model="settingsStore.notificationSettings.value.showAchievements"
                  @update:modelValue="updateNotificationSettings({ showAchievements: $event })"
                />
              </SettingRow>
              <SettingRow label="Show level up notifications">
                <ToggleSwitch
                  v-model="settingsStore.notificationSettings.value.showLevelUp"
                  @update:modelValue="updateNotificationSettings({ showLevelUp: $event })"
                />
              </SettingRow>
              <SettingRow label="Show daily challenge reminders">
                <ToggleSwitch
                  v-model="settingsStore.notificationSettings.value.showDailyChallenge"
                  @update:modelValue="updateNotificationSettings({ showDailyChallenge: $event })"
                />
              </SettingRow>
            </SettingSection>
          </div>

          <!-- Privacy -->
          <div v-if="activeTab === 'privacy'" class="space-y-6">
            <SettingSection title="Profile">
              <SettingRow label="Profile visibility">
                <select
                  v-model="settingsStore.privacySettings.value.profileVisibility"
                  @change="updatePrivacySettings({ profileVisibility: $event.target.value })"
                  class="input-select"
                >
                  <option value="public">Public</option>
                  <option value="friends">Friends only</option>
                  <option value="private">Private</option>
                </select>
              </SettingRow>
              <SettingRow label="Show in leaderboard">
                <ToggleSwitch
                  v-model="settingsStore.privacySettings.value.showInLeaderboard"
                  @update:modelValue="updatePrivacySettings({ showInLeaderboard: $event })"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection title="Data & Analytics">
              <SettingRow label="Share statistics with other players">
                <ToggleSwitch
                  v-model="settingsStore.privacySettings.value.shareStatistics"
                  @update:modelValue="updatePrivacySettings({ shareStatistics: $event })"
                />
              </SettingRow>
              <SettingRow label="Anonymous usage analytics">
                <ToggleSwitch
                  v-model="settingsStore.privacySettings.value.anonymousAnalytics"
                  @update:modelValue="updatePrivacySettings({ anonymousAnalytics: $event })"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection title="Social">
              <SettingRow label="Allow friend requests">
                <ToggleSwitch
                  v-model="settingsStore.privacySettings.value.allowFriendRequests"
                  @update:modelValue="updatePrivacySettings({ allowFriendRequests: $event })"
                />
              </SettingRow>
              <SettingRow label="Allow challenge invitations">
                <ToggleSwitch
                  v-model="settingsStore.privacySettings.value.allowChallenges"
                  @update:modelValue="updatePrivacySettings({ allowChallenges: $event })"
                />
              </SettingRow>
            </SettingSection>
          </div>
        </div>

        <!-- Actions -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            @click="resetCurrentSection"
            class="text-sm text-gray-600 hover:text-gray-800"
          >
            Reset to defaults
          </button>
          <div class="flex items-center gap-4">
            <span v-if="settingsStore.lastSaved.value" class="text-sm text-gray-500">
              Last saved: {{ formatLastSaved }}
            </span>
            <button
              @click="saveSettings"
              :disabled="settingsStore.isSaving.value"
              class="btn-primary"
            >
              <Loader2 v-if="settingsStore.isSaving.value" class="w-4 h-4 animate-spin" />
              <span v-else>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  X, 
  Gamepad2, 
  Palette, 
  Bell, 
  Shield,
  Loader2
} from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from 'vue-toastification'
import SettingSection from '@/components/settings/SettingSection.vue'
import SettingRow from '@/components/settings/SettingRow.vue'
import ToggleSwitch from '@/components/ui/ToggleSwitch.vue'
import RangeSlider from '@/components/ui/RangeSlider.vue'

const router = useRouter()
const settingsStore = useSettingsStore()
const toast = useToast()

// Tab management
const tabs = [
  { id: 'game', name: 'Game', icon: Gamepad2 },
  { id: 'ui', name: 'Display', icon: Palette },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'privacy', name: 'Privacy', icon: Shield },
]

const activeTab = ref('game')

// Computed
const formatLastSaved = computed(() => {
  if (!settingsStore.lastSaved.value) return ''
  const now = new Date()
  const diff = now.getTime() - settingsStore.lastSaved.value.getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'Just now'
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  
  return settingsStore.lastSaved.value.toLocaleDateString()
})

// Methods
function updateGameSettings(updates: any) {
  settingsStore.updateGameSettings(updates)
}

function updateUISettings(updates: any) {
  settingsStore.updateUISettings(updates)
}

function updateNotificationSettings(updates: any) {
  settingsStore.updateNotificationSettings(updates)
}

function updatePrivacySettings(updates: any) {
  settingsStore.updatePrivacySettings(updates)
}

async function saveSettings() {
  try {
    await settingsStore.saveSettings()
    toast.success('Settings saved successfully')
  } catch (error) {
    toast.error('Failed to save settings')
  }
}

function resetCurrentSection() {
  const sectionMap = {
    game: 'gameSettings',
    ui: 'uiSettings',
    notifications: 'notificationSettings',
    privacy: 'privacySettings',
  }
  
  const section = sectionMap[activeTab.value as keyof typeof sectionMap]
  if (section) {
    settingsStore.resetSection(section as any)
    toast.info(`${activeTab.value} settings reset to defaults`)
  }
}
</script>

<style scoped>
.input-select {
  @apply px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent;
}

.input-number {
  @apply w-20 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent;
}

.btn-primary {
  @apply px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2;
}
</style>