import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AchievementNotification from './AchievementNotification.vue'
import type { Achievement } from '@/types/achievements'

describe('AchievementNotification', () => {
  const mockAchievement: Achievement = {
    id: 'first_win',
    name: 'First Victory',
    description: 'Complete your first puzzle',
    icon: '🏆',
    unlockedAt: new Date(),
    progress: 1,
    maxProgress: 1,
    category: 'gameplay',
    rarity: 'common'
  }

  it('shows notification when achievement is provided', () => {
    const wrapper = mount(AchievementNotification, {
      props: {
        achievement: mockAchievement
      }
    })
    
    expect(wrapper.find('.achievement-notification').exists()).toBe(true)
    expect(wrapper.text()).toContain('Achievement Unlocked!')
    expect(wrapper.text()).toContain('First Victory')
    expect(wrapper.text()).toContain('🏆')
  })

  it('hides notification when no achievement', () => {
    const wrapper = mount(AchievementNotification, {
      props: {
        achievement: null
      }
    })
    
    expect(wrapper.find('.achievement-notification').exists()).toBe(false)
  })

  it('auto-hides after duration', async () => {
    vi.useFakeTimers()
    
    const wrapper = mount(AchievementNotification, {
      props: {
        achievement: mockAchievement,
        duration: 3000
      }
    })
    
    expect(wrapper.find('.achievement-notification').exists()).toBe(true)
    
    vi.advanceTimersByTime(3000)
    await flushPromises()
    
    expect(wrapper.emitted('hidden')).toHaveLength(1)
    
    vi.useRealTimers()
  })

  it('can be manually dismissed', async () => {
    const wrapper = mount(AchievementNotification, {
      props: {
        achievement: mockAchievement,
        dismissible: true
      }
    })
    
    const closeButton = wrapper.find('.achievement-notification__close')
    expect(closeButton.exists()).toBe(true)
    
    await closeButton.trigger('click')
    
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    expect(wrapper.emitted('dismiss')?.[0]).toEqual([mockAchievement])
  })

  it('shows rarity-specific styling', () => {
    const rarities = ['common', 'rare', 'epic', 'legendary'] as const
    
    rarities.forEach(rarity => {
      const achievement = { ...mockAchievement, rarity }
      const wrapper = mount(AchievementNotification, {
        props: { achievement }
      })
      
      expect(wrapper.find('.achievement-notification').classes())
        .toContain(`achievement-notification--${rarity}`)
    })
  })

  it('plays sound when enabled', () => {
    const playSpy = vi.fn()
    window.HTMLAudioElement.prototype.play = playSpy
    
    mount(AchievementNotification, {
      props: {
        achievement: mockAchievement,
        playSound: true
      }
    })
    
    expect(playSpy).toHaveBeenCalled()
  })

  it('shows confetti animation for rare achievements', () => {
    const rareAchievement = { ...mockAchievement, rarity: 'legendary' as const }
    
    const wrapper = mount(AchievementNotification, {
      props: {
        achievement: rareAchievement
      }
    })
    
    expect(wrapper.find('.achievement-notification__confetti').exists()).toBe(true)
  })

  it('shows progress for progressive achievements', () => {
    const progressAchievement = {
      ...mockAchievement,
      progress: 50,
      maxProgress: 100
    }
    
    const wrapper = mount(AchievementNotification, {
      props: {
        achievement: progressAchievement
      }
    })
    
    expect(wrapper.text()).toContain('50/100')
  })

  it('applies custom position', () => {
    const positions = ['top-right', 'top-center', 'bottom-center'] as const
    
    positions.forEach(position => {
      const wrapper = mount(AchievementNotification, {
        props: {
          achievement: mockAchievement,
          position
        }
      })
      
      expect(wrapper.find('.achievement-notification').classes())
        .toContain(`achievement-notification--${position}`)
    })
  })

  it('queues multiple achievements', async () => {
    const wrapper = mount(AchievementNotification, {
      props: {
        achievement: mockAchievement,
        queue: true
      }
    })
    
    const secondAchievement = { 
      ...mockAchievement, 
      id: 'second', 
      name: 'Second Achievement' 
    }
    
    await wrapper.setProps({ achievement: secondAchievement })
    
    // Should still show first achievement
    expect(wrapper.text()).toContain('First Victory')
    
    // Queue should contain second achievement
    expect(wrapper.vm.achievementQueue).toHaveLength(1)
  })
})