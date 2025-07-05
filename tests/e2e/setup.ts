import { test as setup } from '@playwright/test'

setup('create test data', async ({ request }) => {
  // Ensure test user exists
  await request.post('http://localhost:14001/api/login', {
    data: { username: 'testuser' }
  })

  // Create some test puzzles
  for (let i = 0; i < 3; i++) {
    await request.post('http://localhost:14001/api/puzzles/generate', {
      data: {
        type: 'sudoku4x4',
        difficulty: ['easy', 'medium', 'hard'][i],
        count: 1
      }
    })
  }
})