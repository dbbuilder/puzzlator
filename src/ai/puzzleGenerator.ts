import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import type {
  PuzzleGenerationRequest,
  GeneratedPuzzle,
  GeneratorConfig,
  PuzzleMetadata,
  ValidationResult
} from '@/types/ai'
import { PuzzleGenerationError, APIError, ValidationError } from '@/types/ai'
import { promptTemplates } from './prompts'
import { validatePuzzle } from './validators'
import { generateLocalPuzzle } from './localGenerator'

export class PuzzleGenerator {
  private openai: OpenAI
  private config: Required<GeneratorConfig>
  private cache: Map<string, GeneratedPuzzle> = new Map()

  constructor(config: GeneratorConfig) {
    this.config = {
      model: 'gpt-4-1106-preview',
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
      maxRetries: 3,
      cacheEnabled: true,
      cacheTTL: 3600000, // 1 hour
      fallbackEnabled: true,
      ...config
    }

    this.openai = new OpenAI({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true // Only for development
    })
  }

  async generatePuzzle(request: PuzzleGenerationRequest): Promise<GeneratedPuzzle> {
    const cacheKey = this.getCacheKey(request)
    
    // Check cache
    if (request.useCache !== false && this.config.cacheEnabled) {
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached
    }

    let lastError: Error | null = null
    
    // Try generating with retries
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const puzzle = await this.generateWithAPI(request)
        
        // Validate the generated puzzle
        const validation = await validatePuzzle(puzzle.type, puzzle)
        if (!validation.isValid) {
          throw new ValidationError('Invalid puzzle generated', validation.errors)
        }

        // Cache the result
        if (this.config.cacheEnabled) {
          this.addToCache(cacheKey, puzzle)
        }

        return puzzle
      } catch (error: any) {
        lastError = error
        
        // Handle rate limiting
        if (error.status === 429) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          await this.delay(delay)
          continue
        }
        
        // Don't retry validation errors
        if (error instanceof ValidationError) {
          break
        }
      }
    }

    // Try fallback generation if enabled
    if (request.allowFallback !== false && this.config.fallbackEnabled) {
      try {
        const localPuzzle = await generateLocalPuzzle(request)
        localPuzzle.metadata = {
          ...localPuzzle.metadata,
          generatedLocally: true
        }
        return localPuzzle
      } catch (fallbackError) {
        // Fallback also failed
      }
    }

    throw lastError || new PuzzleGenerationError('Failed to generate puzzle', 'GENERATION_FAILED')
  }

  private async generateWithAPI(request: PuzzleGenerationRequest): Promise<GeneratedPuzzle> {
    const startTime = Date.now()
    const template = promptTemplates[request.type]
    
    if (!template) {
      throw new PuzzleGenerationError(`Unknown puzzle type: ${request.type}`, 'INVALID_TYPE')
    }

    // Build the prompt
    const systemPrompt = this.buildSystemPrompt(template.system, request)
    const userPrompt = this.buildUserPrompt(template.user, request)

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new APIError('Empty response from API')
      }

      let parsedResponse: any
      try {
        parsedResponse = JSON.parse(response)
      } catch (parseError) {
        throw new ValidationError('Invalid response format', { response })
      }

      // Create the puzzle object
      const puzzle: GeneratedPuzzle = {
        id: uuidv4(),
        type: request.type,
        difficulty: request.difficulty,
        puzzle: parsedResponse.puzzle,
        solution: parsedResponse.solution,
        hints: parsedResponse.hints,
        metadata: {
          generatedAt: new Date().toISOString(),
          generationTime: Date.now() - startTime,
          model: this.config.model,
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          ...parsedResponse.metadata
        }
      }

      return puzzle
    } catch (error: any) {
      if (error instanceof PuzzleGenerationError) {
        throw error
      }
      throw new APIError(`OpenAI API error: ${error.message}`, error.status, error)
    }
  }

  private buildSystemPrompt(template: string, request: PuzzleGenerationRequest): string {
    let prompt = template

    // Add user performance context
    if (request.userLevel !== undefined) {
      prompt += `\n\nThe user is at level ${request.userLevel}.`
    }

    if (request.previousPerformance) {
      const perf = request.previousPerformance
      prompt += `\n\nUser performance metrics:`
      prompt += `\n- Average solving time: ${perf.averageTime} seconds`
      prompt += `\n- Success rate: ${Math.round(perf.successRate * 100)}%`
      prompt += `\n- Average hints used: ${perf.hintsUsed.toFixed(1)}`
      
      // Adjust difficulty based on performance
      if (perf.successRate > 0.9 && perf.hintsUsed < 0.5) {
        prompt += `\n\nThe user is performing very well. Consider making the puzzle slightly more challenging.`
      } else if (perf.successRate < 0.5) {
        prompt += `\n\nThe user is struggling. Consider making the puzzle slightly easier.`
      }
    }

    // Add constraints
    if (request.constraints) {
      prompt += `\n\nAdditional constraints:`
      Object.entries(request.constraints).forEach(([key, value]) => {
        prompt += `\n- ${key}: ${value}`
      })
    }

    return prompt
  }

  private buildUserPrompt(template: string, request: PuzzleGenerationRequest): string {
    let prompt = template
      .replace('{difficulty}', request.difficulty)
      .replace('{type}', request.type)

    if (request.subtype) {
      prompt = prompt.replace('{subtype}', request.subtype)
    }

    return prompt
  }

  private getCacheKey(request: PuzzleGenerationRequest): string {
    const key = {
      type: request.type,
      difficulty: request.difficulty,
      subtype: request.subtype,
      userLevel: request.userLevel,
      constraints: request.constraints
    }
    return JSON.stringify(key)
  }

  private getFromCache(key: string): GeneratedPuzzle | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const age = Date.now() - new Date(cached.metadata!.generatedAt).getTime()
    if (age > this.config.cacheTTL) {
      this.cache.delete(key)
      return null
    }

    return cached
  }

  private addToCache(key: string, puzzle: GeneratedPuzzle): void {
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    this.cache.set(key, puzzle)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Public methods for cache management
  clearCache(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }

  pregenerate(requests: PuzzleGenerationRequest[]): Promise<void> {
    return Promise.all(
      requests.map(req => this.generatePuzzle({ ...req, useCache: true }))
    ).then(() => undefined)
  }
}