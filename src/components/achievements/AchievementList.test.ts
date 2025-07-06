import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AchievementList from './AchievementList.vue'
import AchievementBadge from './AchievementBadge.vue'
import type { Achievement } from '@/types/achievements'

describe('AchievementList', () => {
  const mockAchievements: Achievement[] = [
    {
      id: 'first_win',
      name: 'First Victory',
      description: 'Complete your first puzzle',
      icon: '🏆',
      unlockedAt: new Date(),
      progress: 1,
      maxProgress: 1,
      category: 'gameplay',
      rarity: 'common'
    },
    {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Complete a puzzle in under 60 seconds',
      icon: '⚡',
      unlockedAt: null,
      progress: 0,
      maxProgress: 1,
      category: 'speed',
      rarity: 'rare'
    },
    {
      id: 'puzzle_master',
      name: 'Puzzle Master',
      description: 'Complete 100 puzzles',
      icon: '🧩',
      unlockedAt: null,
      progress: 45,
      maxProgress: 100,
      category: 'milestones',
      rarity: 'epic'
    }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders all achievements', () => {
    const wrapper = mount(AchievementList, {
      props: {
        achievements: mockAchievements
      }
    })
    
    const badges = wrapper.findAllComponents(AchievementBadge)
    expect(badges).toHaveLength(3)
  })

  it('groups achievements by category', () => {
    const wrapper = mount(AchievementList, {
      props: {
        achievements: mockAchievements,
        groupByCategory: true
      }
    })
    
    expect(wrapper.find('[data-category="gameplay"]').exists()).toBe(true)
    expect(wrapper.find('[data-category="speed"]').exists()).toBe(true)
    expect(wrapper.find('[data-category="milestones"]').exists()).toBe(true)
  })

  it('filters achievements by unlocked status', () => {
    const wrapper = mount(AchievementList, {
      props: {
        achievements: mockAchievements,
        filter: 'unlocked'
      }
    })
    
    const badges = wrapper.findAllComponents(AchievementBadge)
    expect(badges).toHaveLength(1)
    expect(badges[0].props('achievement').id).toBe('first_win')
  })

  it('filters achievements by locked status', () => {
    const wrapper = mount(AchievementList, {
      props: {
        achievements: mockAchievements,
        filter: 'locked'
      }
    })
    
    const badges = wrapper.findAllComponents(AchievementBadge)
    expect(badges).toHaveLength(2)
  })

  it('sorts achievements by unlock date', () => {
    const wrapper = mount(AchievementList, {
      props: {
        achievements: mockAchievements,
        sortBy: 'unlock-date'
      }
    })
    
    const badges = wrapper.findAllComponents(AchievementBadge)
    expect(badges[0].props('achievement').id).toBe('first_win')
  })

  it('sorts achievements by rarity', () => {
    const wrapper = mount(AchievementList, {
      props: {
        achievements: mockAchievements,
        sortBy: 'rarity'
      }
    })
    
    const badges = wrapper.findAllComponents(AchievementBadge)
    const rarities = badges.map(b => b.props('achievement').rarity)
    expect(rarities).toEqual(['epic', 'rare', 'common'])
  })

  it('shows achievement statistics', () => {
    const wrapper = mount(AchievementList, {
      props: {
        achievements: mockAchievements,
        showStats: true
      }
    })
    
    const stats = wrapper.find('.achievement-list__stats')
    expect(stats.exists()).toBe(true)
    expect(stats.text()).toContain('1 / 3')
    expect(stats.text()).toContain('33%')
  })

  it('emits achievement-click event when badge is clicked', async () => {
    const wrapper = mount(AchievementList, {
      props: {
        achievements: mockAchievements
      }
    })
    
    const firstBadge = wrapper.findComponent(AchievementBadge)
    await firstBadge.vm.$emit('click', mockAchievements[0])
    
    expect(wrapper.emitted('achievement-click')).toHaveLength(1)
    expect(wrapper.emitted('achievement-click')?.[0]).toEqual([mockAchievements[0]])
  })

  it('shows empty state when no achievements', () => {
    const wrapper = mount(AchievementList, {
      props: {
        achievements: []
      }
    })
    
    expect(wrapper.find('.achievement-list__empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No achievements yet')
  })

  it('applies grid layout by default', () => {
    const wrapper = mount(AchievementList, {
      props: {
        achievements: mockAchievements
      }
    })
    
    expect(wrapper.find('.achievement-list--grid').exists()).toBe(true)
  })

  it('applies list layout when specified', () => {
    const wrapper = mount(AchievementList, {
      props: {
        achievements: mockAchievements,
        layout: 'list'
      }
    })
    
    expect(wrapper.find('.achievement-list--list').exists()).toBe(true)
  })

  it('shows search bar when searchable', async () => {
    const wrapper = mount(AchievementList, {
      props: {
        achievements: mockAchievements,
        searchable: true
      }
    })
    
    const searchInput = wrapper.find('input[type="search"]')
    expect(searchInput.exists()).toBe(true)
    
    await searchInput.setValue('speed')
    
    const badges = wrapper.findAllComponents(AchievementBadge)
    expect(badges).toHaveLength(1)
    expect(badges[0].props('achievement').id).toBe('speed_demon')
  })
})