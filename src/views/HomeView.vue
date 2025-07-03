<template>
  <div class="min-h-[calc(100vh-8rem)]">
    <!-- Hero Section -->
    <section class="py-16 px-4">
      <div class="container mx-auto text-center">
        <h1 class="text-5xl md:text-6xl font-bold text-game-text mb-6">
          AI-Powered Puzzle Adventures
        </h1>
        <p class="text-xl text-game-muted max-w-2xl mx-auto mb-8">
          Experience unique puzzles generated just for you by advanced AI. 
          Challenge your mind with endless possibilities.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            v-if="authStore.isAuthenticated"
            @click="router.push('/game')"
            class="btn-primary text-lg px-8 py-3"
          >
            Play Now
          </button>
          <button 
            v-else
            @click="appStore.openAuthModal('signup')"
            class="btn-primary text-lg px-8 py-3"
          >
            Get Started
          </button>
          
          <button 
            @click="scrollToFeatures"
            class="btn-secondary text-lg px-8 py-3"
          >
            Learn More
          </button>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section ref="featuresSection" class="py-16 px-4 bg-game-surface">
      <div class="container mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold text-center text-game-text mb-12">
          Why Puzzler?
        </h2>
        
        <div class="grid md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="text-center">
            <div class="w-16 h-16 bg-game-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-game-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-game-text mb-2">AI-Generated</h3>
            <p class="text-game-muted">
              Every puzzle is unique, created by cutting-edge AI technology to match your skill level
            </p>
          </div>
          
          <!-- Feature 2 -->
          <div class="text-center">
            <div class="w-16 h-16 bg-game-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-game-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-game-text mb-2">Adaptive Difficulty</h3>
            <p class="text-game-muted">
              Puzzles automatically adjust to your performance, keeping you engaged and challenged
            </p>
          </div>
          
          <!-- Feature 3 -->
          <div class="text-center">
            <div class="w-16 h-16 bg-game-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-game-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-game-text mb-2">Compete & Share</h3>
            <p class="text-game-muted">
              Challenge friends, climb leaderboards, and share your favorite puzzles with the community
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 px-4">
      <div class="container mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-game-text mb-6">
          Ready to Challenge Your Mind?
        </h2>
        <p class="text-lg text-game-muted mb-8 max-w-2xl mx-auto">
          Join thousands of puzzle enthusiasts exploring the future of gaming with AI-generated challenges.
        </p>
        <button 
          v-if="!authStore.isAuthenticated"
          @click="appStore.openAuthModal('signup')"
          class="btn-primary text-lg px-8 py-3"
        >
          Start Playing Free
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const featuresSection = ref<HTMLElement>()

function scrollToFeatures() {
  featuresSection.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<style scoped>
.btn-primary {
  @apply px-6 py-3 bg-game-accent text-white rounded-lg hover:bg-game-accent-hover 
         transition-colors font-medium shadow-lg hover:shadow-xl;
}

.btn-secondary {
  @apply px-6 py-3 bg-game-surface text-game-text border border-game-border rounded-lg 
         hover:bg-game-muted/10 transition-colors font-medium;
}
</style>