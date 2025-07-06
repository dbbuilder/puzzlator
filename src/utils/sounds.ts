// Sound utilities with base64 encoded simple sounds
// These are very basic generated tones as placeholders

// Success sound - A pleasant ascending tone
export const SUCCESS_SOUND_DATA = 'data:audio/wav;base64,UklGRoQFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWAFAACAgICAgICAgICAgICAgICAgICAgICAgIGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKDg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGhoaGh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqK';

// Error sound - A lower, brief tone
export const ERROR_SOUND_DATA = 'data:audio/wav;base64,UklGRoQDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWADAACAfn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4CBgoOEhYaHiImKi4yNjo+QkZKTlJWWl5iZmpucnZ6foKGio6SlpqeoqaqrrK2ur7CxsrO0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w==';

// Create and cache audio elements
let successAudio: HTMLAudioElement | null = null;
let errorAudio: HTMLAudioElement | null = null;

export function playSuccessSound() {
  try {
    if (!successAudio) {
      successAudio = new Audio(SUCCESS_SOUND_DATA);
      successAudio.volume = 0.3;
    }
    successAudio.currentTime = 0;
    successAudio.play().catch(() => {
      // Ignore autoplay errors
    });
  } catch (error) {
    console.log('Could not play success sound');
  }
}

export function playErrorSound() {
  try {
    if (!errorAudio) {
      errorAudio = new Audio(ERROR_SOUND_DATA);
      errorAudio.volume = 0.3;
    }
    errorAudio.currentTime = 0;
    errorAudio.play().catch(() => {
      // Ignore autoplay errors
    });
  } catch (error) {
    console.log('Could not play error sound');
  }
}

// Preload sounds
export function preloadSounds() {
  successAudio = new Audio(SUCCESS_SOUND_DATA);
  successAudio.volume = 0.3;
  
  errorAudio = new Audio(ERROR_SOUND_DATA);
  errorAudio.volume = 0.3;
}