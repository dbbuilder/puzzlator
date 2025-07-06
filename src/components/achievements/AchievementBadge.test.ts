import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AchievementBadge from './AchievementBadge.vue'
import type { Achievement } from '@/types/achievements'

describe('AchievementBadge', () => {
  const mockAchievement: Achievement = {
    id: 'first_win',
    name: 'First Victory',
    description: 'Complete your first puzzle',
    icon: '🏆',
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
    category: 'gameplay',
    rarity: 'common'
  }

  it('renders achievement name', () => {
    const wrapper = mount(AchievementBadge, {
      props: {
        achievement: mockAchievement
      }
    })
    
    expect(wrapper.text()).toContain('First Victory')
  })

  it('renders achievement icon', () => {
    const wrapper = mount(AchievementBadge, {
      props: {
        achievement: mockAchievement
      }
    })
    
    expect(wrapper.text()).toContain('🏆')
  })

  it('shows locked state when not unlocked', () => {
    const wrapper = mount(AchievementBadge, {
      props: {
        achievement: mockAchievement
      }
    })
    
    expect(wrapper.classes()).toContain('achievement-badge--locked')
    expect(wrapper.find('.achievement-badge__lock-icon').exists()).toBe(true)
  })

  it('shows unlocked state when achievement is unlocked', () => {
    const unlockedAchievement = {
      ...mockAchievement,
      unlockedAt: new Date()
    }
    
    const wrapper = mount(AchievementBadge, {
      props: {
        achievement: unlockedAchievement
      }
    })
    
    expect(wrapper.classes()).toContain('achievement-badge--unlocked')
    expect(wrapper.find('.achievement-badge__lock-icon').exists()).toBe(false)
  })

  it('shows progress bar for progressive achievements', () => {
    const progressiveAchievement = {
      ...mockAchievement,
      progress: 5,
      maxProgress: 10
    }
    
    const wrapper = mount(AchievementBadge, {
      props: {
        achievement: progressiveAchievement
      }
    })
    
    const progressBar = wrapper.find('.achievement-badge__progress')
    expect(progressBar.exists()).toBe(true)
    expect(progressBar.text()).toContain('5/10')
  })

  it('applies rarity classes', () => {
    const rarities = ['common', 'rare', 'epic', 'legendary'] as const
    
    rarities.forEach(rarity => {
      const achievement = { ...mockAchievement, rarity }
      const wrapper = mount(AchievementBadge, {
        props: { achievement }
      })
      
      expect(wrapper.classes()).toContain(`achievement-badge--${rarity}`)
    })
  })

  it('shows tooltip on hover', async () => {
    const wrapper = mount(AchievementBadge, {
      props: {
        achievement: mockAchievement
      }
    })
    
    await wrapper.trigger('mouseenter')
    const tooltip = wrapper.find('.achievement-badge__tooltip')
    
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('Complete your first puzzle')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(AchievementBadge, {
      props: {
        achievement: mockAchievement
      }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.emitted('click')?.[0]).toEqual([mockAchievement])
  })

  it('shows unlock date for unlocked achievements', () => {
    const unlockedDate = new Date('2025-07-06T10:00:00')
    const unlockedAchievement = {
      ...mockAchievement,
      unlockedAt: unlockedDate
    }
    
    const wrapper = mount(AchievementBadge, {
      props: {
        achievement: unlockedAchievement
      }
    })
    
    expect(wrapper.find('.achievement-badge__unlock-date').exists()).toBe(true)
    expect(wrapper.find('.achievement-badge__unlock-date').text()).toMatch(/Unlocked/)
  })

  it('applies size prop correctly', () => {
    const sizes = ['small', 'medium', 'large'] as const
    
    sizes.forEach(size => {
      const wrapper = mount(AchievementBadge, {
        props: {
          achievement: mockAchievement,
          size
        }
      })
      
      expect(wrapper.classes()).toContain(`achievement-badge--${size}`)
    })
  })
})