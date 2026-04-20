const request = require('supertest')
const app = require('../../src/config/app')

describe('Health check', () => {
  it('responds with healthy status', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
