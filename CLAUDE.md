# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Puzzle Game Generator - A Vue.js web application that uses OpenAI GPT to dynamically generate personalized puzzle challenges with adaptive difficulty.

## Essential Commands

```bash
# Development
npm run dev          # Start dev server on port 3000
npm run build        # Type-check and build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests with coverage (90% minimum required)
npm run test:e2e     # Run E2E tests headlessly
npm run test:e2e:dev # Open Cypress interactive runner

# Code Quality
npm run type-check   # TypeScript type checking
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
```

## Architecture

### Tech Stack
- **Frontend**: Vue 3 (Composition API), TypeScript, Vite, Tailwind CSS
- **Game Engine**: Phaser.js for 2D graphics
- **State**: Pinia stores
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: OpenAI GPT-4 with JSON schema validation

### Key Directories
- `src/components/game/` - Game-specific Vue components
- `src/game/engines/` - Phaser.js game engine integration
- `src/game/puzzles/` - Puzzle type implementations
- `src/ai/` - AI integration for puzzle generation
- `src/stores/` - Pinia state management
- `supabase/functions/` - Edge functions for AI processing
- `supabase/migrations/` - Database schema

### Development Standards
- TypeScript strict mode - no `any` types
- Vue SFCs with `<script setup>` syntax
- 90% test coverage requirement for new features
- Commit format: `type(scope): description`
- Performance targets: 60fps gameplay, <2s load times

### Environment Setup
Create `.env.local` with:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### Current Phase
Project is in Phase 1: Foundation & MVP (see TODO.md for detailed roadmap)

## AI Integration Pattern

When implementing AI puzzle generation:
1. Use structured prompts with JSON schema validation
2. Implement fallback systems for API failures
3. Ensure puzzle solvability (>95% success rate)
4. Handle rate limiting and privacy protection

## Testing Approach

- Unit tests: Test individual components and utilities in isolation
- E2E tests: Test complete user flows through the application
- Game tests: Verify puzzle mechanics and solvability
- AI tests: Mock OpenAI responses for consistent testing