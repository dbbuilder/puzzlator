<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold text-gray-800 mb-4">AI Puzzle Game</h1>
        <p class="text-xl text-gray-600">Choose your puzzle type and difficulty</p>
      </div>

      <!-- User Profile Summary -->
      <div v-if="userProfile" class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {{ userProfile.display_name?.charAt(0).toUpperCase() || 'U' }}
            </div>
            <div>
              <h2 class="text-2xl font-semibold">{{ userProfile.display_name || userProfile.username }}</h2>
              <p class="text-gray-600">
                Score: {{ userProfile.total_score.toLocaleString() }} | 
                Puzzles: {{ userProfile.puzzles_completed }}/{{ userProfile.puzzles_attempted }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              @click="showProfile = true"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Profile
            </button>
            <button
              @click="handleLogout"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <!-- Puzzle Type Selection -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Select Puzzle Type</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            v-for="type in puzzleTypes"
            :key="type.id"
            @click="selectedType = type.id"
            :class="[
              'p-6 rounded-lg border-2 transition-all',
              selectedType === type.id
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-purple-300'
            ]"
          >
            <component :is="type.icon" class="w-12 h-12 mx-auto mb-2" />
            <h3 class="font-semibold">{{ type.name }}</h3>
            <p class="text-sm text-gray-600 mt-1">{{ type.description }}</p>
          </button>
        </div>
      </div>

      <!-- Difficulty Selection -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Select Difficulty</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            v-for="diff in difficulties"
            :key="diff.id"
            @click="selectedDifficulty = diff.id"
            :class="[
              'p-4 rounded-lg border-2 transition-all',
              selectedDifficulty === diff.id
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-purple-300'
            ]"
          >
            <h3 class="font-semibold text-lg">{{ diff.name }}</h3>
            <div class="flex items-center justify-center mt-2">
              <Star
                v-for="i in diff.stars"
                :key="i"
                class="w-5 h-5 text-yellow-400 fill-current"
              />
            </div>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="mb-8 flex justify-between items-center">
        <h2 class="text-2xl font-semibold">Available Puzzles</h2>
        <div class="flex gap-4">
          <select 
            v-model="filterDifficulty"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
          <router-link to="/leaderboard" class="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium">
            Leaderboard
          </router-link>
          <router-link to="/profile" class="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium">
            Profile
          </router-link>
        </div>
      </div>

      <!-- Available Puzzles -->
      <div class="mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="puzzle in filteredPuzzles"
            :key="puzzle.id"
            class="puzzle-card bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
            @click="selectPuzzle(puzzle)"
          >
            <h3 class="font-semibold">{{ puzzle.title || `${puzzle.type} Puzzle` }}</h3>
            <p class="text-sm text-gray-600 mt-1">
              Difficulty: {{ puzzle.difficulty }} | 
              Played: {{ puzzle.play_count }} times
            </p>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-sm text-gray-500">
                Avg Score: {{ puzzle.avg_score || 'N/A' }}
              </span>
              <button class="text-purple-600 hover:text-purple-700 font-medium">
                Play →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-center space-x-4">
        <button
          @click="createNewPuzzle"
          :disabled="!selectedType || !selectedDifficulty"
          :class="[
            'px-8 py-3 rounded-lg font-semibold text-lg transition-all',
            selectedType && selectedDifficulty
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          Generate New Puzzle
        </button>
        <button
          @click="showLeaderboard = true"
          class="px-8 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-semibold text-lg hover:bg-purple-50 transition-all"
        >
          View Leaderboard
        </button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 text-center">
        <Loader2 class="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
        <p class="text-lg font-semibold">{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Grid3x3, Brain, Puzzle, Binary, Hash, Lightbulb, Type, Calculator, Star, Loader2 } from 'lucide-vue-next'
import { supabase } from '@/config/supabase'
import { useGameStore } from '@/stores/game'
import { useUserStore } from '@/stores/user'
import type { Database } from '@/types/db'

type Puzzle = Database['public']['Tables']['puzzles']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']

const router = useRouter()
const gameStore = useGameStore()
const userStore = useUserStore()

const selectedType = ref<string>('')
const selectedDifficulty = ref<string>('')
const loading = ref(false)
const loadingMessage = ref('')
const showProfile = ref(false)
const showLeaderboard = ref(false)
const recentPuzzles = ref<Puzzle[]>([])
const userProfile = ref<UserProfile | null>(null)
const filterDifficulty = ref<string>('')

const puzzleTypes = [
  { id: 'sudoku4x4', name: 'Sudoku 4x4', icon: Grid3x3, description: 'Classic number puzzle' },
  { id: 'logic', name: 'Logic', icon: Brain, description: 'Deductive reasoning' },
  { id: 'spatial', name: 'Spatial', icon: Puzzle, description: 'Visual puzzles' },
  { id: 'pattern', name: 'Pattern', icon: Binary, description: 'Find the sequence' },
  { id: 'sequence', name: 'Sequence', icon: Hash, description: 'Number patterns' },
  { id: 'deduction', name: 'Deduction', icon: Lightbulb, description: 'Solve mysteries' },
  { id: 'wordplay', name: 'Wordplay', icon: Type, description: 'Word puzzles' },
  { id: 'math', name: 'Math', icon: Calculator, description: 'Mathematical challenges' }
]

const difficulties = [
  { id: 'easy', name: 'Easy', stars: 1 },
  { id: 'medium', name: 'Medium', stars: 2 },
  { id: 'hard', name: 'Hard', stars: 3 },
  { id: 'expert', name: 'Expert', stars: 4 }
]

const filteredPuzzles = computed(() => {
  if (!filterDifficulty.value) {
    return recentPuzzles.value
  }
  return recentPuzzles.value.filter(puzzle => puzzle.difficulty === filterDifficulty.value)
})

onMounted(async () => {
  // Load user profile
  const userId = userStore.currentUserId
  if (userId) {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) {
        userProfile.value = data
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

  // Load recent puzzles
  try {
    if (supabase) {
      const { data } = await supabase
        .from('puzzles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6)
      if (data) {
        recentPuzzles.value = data
      }
    } else {
      // Demo mode - show sample puzzles
      recentPuzzles.value = [
        {
          id: 'demo-1',
          type: 'sudoku4x4',
          difficulty: 'easy',
          title: 'Sudoku 4x4 - Easy',
          description: 'A simple 4x4 Sudoku puzzle',
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-2',
          type: 'sudoku4x4',
          difficulty: 'medium',
          title: 'Sudoku 4x4 - Medium',
          description: 'A medium difficulty 4x4 Sudoku puzzle',
          created_at: new Date().toISOString()
        }
      ] as any
    }
  } catch (error) {
    console.error('Failed to load recent puzzles:', error)
  }
})

async function createNewPuzzle() {
  if (!selectedType.value || !selectedDifficulty.value) return

  loading.value = true
  loadingMessage.value = 'Generating puzzle...'

  try {
    // For now, create a sample puzzle
    // In production, this would call an AI service
    const puzzleData = generateSamplePuzzle(selectedType.value, selectedDifficulty.value)
    
    let puzzle: any
    
    if (supabase) {
      const { data } = await supabase
        .from('puzzles')
        .insert({
        type: selectedType.value as any,
        difficulty: selectedDifficulty.value as any,
        title: `${selectedType.value} Challenge`,
        description: `A ${selectedDifficulty.value} ${selectedType.value} puzzle`,
        puzzle_data: puzzleData.puzzle,
        solution_data: puzzleData.solution,
        max_score: 1000,
        hint_penalty: 20
        })
        .select()
        .single()
      puzzle = data
    } else {
      // Demo mode - create local puzzle
      puzzle = {
        id: 'demo-puzzle-' + Date.now(),
        type: selectedType.value,
        difficulty: selectedDifficulty.value,
        title: `${selectedType.value} Challenge`,
        description: `A ${selectedDifficulty.value} ${selectedType.value} puzzle`,
        puzzle_data: puzzleData.puzzle,
        solution_data: puzzleData.solution,
        max_score: 1000,
        hint_penalty: 20,
        created_at: new Date().toISOString()
      }
    }

    if (!puzzle) {
      throw new Error('Failed to create puzzle')
    }

    // Create game session
    let session: any
    
    if (supabase) {
      const { data } = await supabase
        .from('game_sessions')
        .insert({
        user_id: userStore.currentUserId!,
        puzzle_id: puzzle.id,
        game_state: puzzleData.puzzle,
        status: 'in_progress'
        })
        .select()
        .single()
      session = data
    } else {
      // Demo mode - create local session
      session = {
        id: 'demo-session-' + Date.now(),
        user_id: userStore.currentUserId || 'demo-user',
        puzzle_id: puzzle.id,
        game_state: puzzleData.puzzle,
        status: 'in_progress',
        created_at: new Date().toISOString()
      }
    }

    // Navigate to game
    gameStore.setCurrentPuzzle(puzzle)
    gameStore.setCurrentSession(session)
    router.push(`/play/${puzzle.id}`)
  } catch (error) {
    console.error('Failed to create puzzle:', error)
    loadingMessage.value = 'Failed to generate puzzle'
    setTimeout(() => {
      loading.value = false
    }, 2000)
  }
}

function selectPuzzle(puzzle: Puzzle) {
  router.push(`/play/${puzzle.id}`)
}

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}

function generateSamplePuzzle(type: string, difficulty: string) {
  // Generate sample puzzle data based on type
  if (type === 'sudoku4x4') {
    const puzzle = [
      [1, null, 3, null],
      [null, 4, null, 2],
      [2, null, 4, null],
      [null, 3, null, 1]
    ]
    const solution = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1]
    ]
    return { puzzle, solution }
  }
  
  if (type === 'pattern') {
    // Generate pattern puzzle metadata
    const patternTypes = {
      easy: 'numeric',
      medium: 'shapes',
      hard: 'colors',
      expert: 'mixed'
    }
    
    return {
      puzzle: { 
        type, 
        difficulty, 
        patternType: patternTypes[difficulty as keyof typeof patternTypes] || 'numeric'
      },
      solution: { type, difficulty }
    }
  }
  
  // Default puzzle data
  return {
    puzzle: { type, difficulty, data: {} },
    solution: { type, difficulty, data: {} }
  }
}
</script>