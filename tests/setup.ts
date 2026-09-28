import { MongoMemoryServer } from 'mongodb-memory-server'

import mongoose from 'mongoose'
import { afterAll, beforeEach, vi } from 'vitest'
import 'reflect-metadata'

const mongod = await MongoMemoryServer.create()
const uri = mongod.getUri()

process.env.DATABASE_URI = uri

await mongoose.connect(uri)

beforeEach(() => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})
