import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { achievementService } from '@/services/achievements'
import { supabase } from '@/config/supabase'
import { useUserStore } from './user-supabase'
import type { Achievement, AchievementNotificationData } from '@/types/achievements'

export const useAchievementsStore = defineStore('achievements', () => {
  // State
  const achievements = ref<Achievement[]>([])
  const userAchievements = ref<Map<string, Achievement>>(new Map())
  const notificationQueue = ref<AchievementNotificationData[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const unlockedAchievements = computed(() => 
    Array.from(userAchievements.value.values()).filter(a => a.unlockedAt !== null)
  )
  
  const lockedAchievements = computed(() => 
    achievements.value.filter(a => !userAchievements.value.has(a.id) || userAchievements.value.get(a.id)?.unlockedAt === null)
  )
  
  const achievementProgress = computed(() => ({
    unlocked: unlockedAchievements.value.length,
    total: achievements.value.length,
    percentage: achievements.value.length > 0 
      ? Math.round((unlockedAchievements.value.length / achievements.value.length) * 100)
      : 0
  }))

  // Actions
  async function loadAchievements() {
    isLoading.value = true
    error.value = null
    
    try {
      // Use the imported supabase client directly
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Load all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true })

      if (achievementsError) throw achievementsError
      
      achievements.value = achievementsData || []
      
      // Load user's achievements if logged in
      const userStore = useUserStore()
      if (userStore.isAuthenticated && userStore.currentUser) {
        await loadUserAchievements(userStore.currentUser.id)
      }
    } catch (err) {
      console.error('Failed to load achievements:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load achievements'
      
      // Use demo achievements as fallback
      achievements.value = achievementService.getAllAchievements()
    } finally {
      isLoading.value = false
    }
  }

  async function loadUserAchievements(userId: string) {
    try {
      // Use the imported supabase client directly
      if (!supabase) return

      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at, progress')
        .eq('user_id', userId)

      if (userAchievementsError) throw userAchievementsError

      // Map user achievements
      userAchievements.value.clear()
      
      for (const userAch of userAchievementsData || []) {
        const achievement = achievements.value.find(a => a.id === userAch.achievement_id)
        if (achievement) {
          userAchievements.value.set(achievement.id, {
            ...achievement,
            unlockedAt: userAch.unlocked_at ? new Date(userAch.unlocked_at) : null,
            progress: userAch.progress || 0
          })
        }
      }
    } catch (err) {
      console.error('Failed to load user achievements:', err)
      // Continue without user achievements
    }
  }

  async function unlockAchievement(achievementId: string) {
    const achievement = achievements.value.find(a => a.id === achievementId)
    if (!achievement) return

    const userStore = useUserStore()
    if (!userStore.isAuthenticated || !userStore.currentUser) {
      // Store locally for guest users
      const unlockedAchievement = {
        ...achievement,
        unlockedAt: new Date()
      }
      userAchievements.value.set(achievementId, unlockedAchievement)
      
      // Add to notification queue
      notificationQueue.value.push({
        achievement: unlockedAchievement,
        isNew: true
      })
      
      return
    }

    try {
      // Use the imported supabase client directly
      if (!supabase) return

      // Check if already unlocked
      const existing = userAchievements.value.get(achievementId)
      if (existing?.unlockedAt) return

      // Unlock in database
      const { error: unlockError } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: userStore.currentUser.id,
          achievement_id: achievementId,
          unlocked_at: new Date().toISOString(),
          progress: achievement.maxProgress
        })

      if (unlockError) throw unlockError

      // Update local state
      const unlockedAchievement = {
        ...achievement,
        unlockedAt: new Date(),
        progress: achievement.maxProgress
      }
      userAchievements.value.set(achievementId, unlockedAchievement)

      // Add to notification queue
      notificationQueue.value.push({
        achievement: unlockedAchievement,
        isNew: true
      })
    } catch (err) {
      console.error('Failed to unlock achievement:', err)
    }
  }

  async function updateAchievementProgress(achievementId: string, progress: number) {
    const achievement = achievements.value.find(a => a.id === achievementId)
    if (!achievement) return

    const userStore = useUserStore()
    const currentAchievement = userAchievements.value.get(achievementId) || achievement
    const previousProgress = currentAchievement.progress
    
    // Update local state immediately
    userAchievements.value.set(achievementId, {
      ...currentAchievement,
      progress: Math.min(progress, achievement.maxProgress)
    })

    // Check if achievement is now complete
    if (progress >= achievement.maxProgress && !currentAchievement.unlockedAt) {
      await unlockAchievement(achievementId)
      return
    }

    // Save progress to database if authenticated
    if (userStore.isAuthenticated && userStore.currentUser) {
      try {
        // Use the imported supabase client directly
        if (!supabase) return

        const { error: updateError } = await supabase
          .from('user_achievements')
          .upsert({
            user_id: userStore.currentUser.id,
            achievement_id: achievementId,
            progress,
            unlocked_at: null
          })

        if (updateError) throw updateError
      } catch (err) {
        console.error('Failed to update achievement progress:', err)
      }
    }

    // Add progress notification if significant
    if (progress > previousProgress && progress < achievement.maxProgress) {
      notificationQueue.value.push({
        achievement: userAchievements.value.get(achievementId)!,
        isNew: false,
        previousProgress
      })
    }
  }

  function checkAndUnlockAchievements(gameData: any) {
    // Use the achievement service to check conditions
    const unlockedIds = achievementService.checkAchievements(gameData)
    
    // Unlock each achievement
    unlockedIds.forEach(id => unlockAchievement(id))
    
    // Update progress for progressive achievements
    const progressUpdates = achievementService.getProgressUpdates(gameData)
    progressUpdates.forEach(({ achievementId, progress }) => {
      updateAchievementProgress(achievementId, progress)
    })
  }

  function getNextNotification(): AchievementNotificationData | null {
    return notificationQueue.value.shift() || null
  }

  function clearNotifications() {
    notificationQueue.value = []
  }

  // Initialize on store creation
  loadAchievements()

  return {
    // State
    achievements,
    userAchievements,
    isLoading,
    error,
    
    // Computed
    unlockedAchievements,
    lockedAchievements,
    achievementProgress,
    
    // Actions
    loadAchievements,
    loadUserAchievements,
    unlockAchievement,
    updateAchievementProgress,
    checkAndUnlockAchievements,
    getNextNotification,
    clearNotifications
  }
})