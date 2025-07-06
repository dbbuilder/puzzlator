import { onErrorCaptured, getCurrentInstance } from 'vue'
import { captureError, addBreadcrumb, captureMessage, trackPerformance } from '@/config/sentry'
import type { SeverityLevel } from '@sentry/vue'

export interface UseSentryOptions {
  componentName?: string
  captureErrors?: boolean
}

/**
 * Vue composable for Sentry integration
 */
export function useSentry(options: UseSentryOptions = {}) {
  const instance = getCurrentInstance()
  const componentName = options.componentName || instance?.type.name || 'UnknownComponent'
  
  // Automatically capture component errors
  if (options.captureErrors !== false) {
    onErrorCaptured((error, instance, info) => {
      captureError(error, {
        componentName,
        errorInfo: info,
        componentStack: instance?.$el?.outerHTML?.substring(0, 200)
      })
      
      // Return false to prevent the error from propagating
      return false
    })
  }
  
  /**
   * Log a breadcrumb for this component
   */
  const logBreadcrumb = (message: string, data?: any) => {
    addBreadcrumb(`[${componentName}] ${message}`, 'ui', data)
  }
  
  /**
   * Log an error with component context
   */
  const logError = (error: Error | string, context?: Record<string, any>) => {
    const err = typeof error === 'string' ? new Error(error) : error
    captureError(err, {
      component: componentName,
      ...context
    })
  }
  
  /**
   * Log a message with severity
   */
  const logMessage = (message: string, level: SeverityLevel = 'info') => {
    captureMessage(`[${componentName}] ${message}`, level)
  }
  
  /**
   * Track component performance
   */
  const trackTiming = (metric: string, value: number) => {
    trackPerformance(`${componentName}.${metric}`, value)
  }
  
  /**
   * Wrap async operations with error tracking
   */
  const withErrorTracking = async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> => {
    const startTime = performance.now()
    
    try {
      logBreadcrumb(`Starting ${operationName}`)
      const result = await operation()
      
      const duration = performance.now() - startTime
      trackTiming(operationName, duration)
      logBreadcrumb(`Completed ${operationName}`, { duration })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      logError(error as Error, {
        operation: operationName,
        duration
      })
      return null
    }
  }
  
  return {
    logBreadcrumb,
    logError,
    logMessage,
    trackTiming,
    withErrorTracking
  }
}