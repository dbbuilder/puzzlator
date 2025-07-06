// Version information
export const APP_VERSION = '0.3.1'
export const BUILD_TIME = new Date().toISOString()
export const BUILD_NUMBER = Date.now()

// Environment info
export const VERSION_INFO = {
  version: APP_VERSION,
  buildTime: BUILD_TIME,
  buildNumber: BUILD_NUMBER,
  environment: import.meta.env.MODE,
  production: import.meta.env.PROD,
  baseUrl: import.meta.env.BASE_URL
}

export function getVersionString(): string {
  return `v${APP_VERSION} (${BUILD_NUMBER})`
}

export function getBuildInfo(): string {
  const date = new Date(BUILD_TIME)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}