import jwt from 'jsonwebtoken'
import supertest from 'supertest'
import {
  afterAll,
  describe,
  expect,
  it,
} from 'vitest'

import { server } from '../../src/infrastructure/http/server'
import { mockUser } from '../__mocks__/user'

describe('users (e2e)', () => {
  let token: string

  afterAll(() => {
    server.close()
  })

  const user = mockUser()

  it('should create an user', async () => {
    const { body } = await supertest(server)
      .post('/api/users')
      .send(user)
      .expect('Content-Type', /json/)
      .expect(201)

    expect(body.roles).toEqual(['user'])

    const { body: tokenBody } = await supertest(server)
      .post('/api/tokens')
      .send({
        username: user.username,
        password: user.password,
      })

    token = tokenBody.Authorization
  })

  it('should create an user with custom roles', async () => {
    const adminUser = {
      ...mockUser(),
      roles: ['admin'],
    }

    const { body } = await supertest(server)
      .post('/api/users')
      .send(adminUser)
      .expect(201)

    expect(body.roles).toEqual(['admin'])
  })

  it('should not create user with duplicate email/username (409 Conflict)', async () => {
    await supertest(server)
      .post('/api/users')
      .send(user)
      .expect('Content-Type', /json/)
      .expect(409)
      .expect((res) => {
        expect(res.body.error).toBe('Duplicate key error')
      })
  })

  it('should list a page of users', async () => {
    const { body } = await supertest(server)
      .get('/api/users')
      .set('Authorization', token)
      .expect(200)

    expect(body).toMatchObject({
      meta: {
        page: expect.any(Number),
        size: expect.any(Number),
        total: expect.any(Number),
      },
      data: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: user.name,
          username: user.username.toLowerCase(),
          email: user.email.toLowerCase(),
        }),
      ]),
    })
  })

  it('should return 401 when no token is provided', async () => {
    await supertest(server)
      .get('/api/users')
      .expect(401)
      .expect((res) => {
        expect(res.body.error).toBe('No token provided')
      })
  })

  it('should return 401 when an invalid token is provided', async () => {
    await supertest(server)
      .get('/api/users')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401)
  })

  it('should list users with search query', async () => {
    const { body } = await supertest(server)
      .get(`/api/users?search=${user.username}`)
      .set('Authorization', token)
      .expect(200)

    expect(body.data).toBeInstanceOf(Array)
  })

  it('should detail the user', async () => {
    const id = jwt.decode(token.split(' ')[1])?.sub

    const { body } = await supertest(server)
      .get(`/api/users/${id}`)
      .set('Authorization', token)
      .expect(200)

    expect(body).toMatchObject({
      name: user.name,
      email: user.email.toLowerCase(),
      username: user.username.toLowerCase(),
      roles: ['user'],
    })
  })

  it('should return 400 Bad Request on missing fields when creating user', async () => {
    await supertest(server)
      .post('/api/users')
      .send({})
      .expect(400)
  })

  it('should update the user', async () => {
    const id = jwt.decode(token.split(' ')[1])?.sub

    const { body } = await supertest(server)
      .patch(`/api/users/${id}`)
      .set('Authorization', token)
      .send({ name: 'Updated Name' })
      .expect(200)

    expect(body.name).toBe('Updated Name')
  })

  it('should return 400 Bad Request on invalid email format when updating user', async () => {
    const id = jwt.decode(token.split(' ')[1])?.sub

    await supertest(server)
      .patch(`/api/users/${id}`)
      .set('Authorization', token)
      .send({ email: 'invalid-email' })
      .expect(400)
  })

  it('should return 401 Unauthorized when updating another user', async () => {
    const otherUser = mockUser()
    let otherToken = ''

    // Create other user
    await supertest(server).post('/api/users').send(otherUser).expect(201)

    // Login with other user
    const { body } = await supertest(server)
      .post('/api/tokens')
      .send({ username: otherUser.username, password: otherUser.password })

    otherToken = body.Authorization

    const id = jwt.decode(token.split(' ')[1])?.sub

    await supertest(server)
      .patch(`/api/users/${id}`)
      .set('Authorization', otherToken)
      .send({ name: 'Hacked Name' })
      .expect(401)
  })

  it('should return 401 Unauthorized when deleting another user', async () => {
    const otherUser = mockUser()

    // Create other user
    await supertest(server).post('/api/users').send(otherUser).expect(201)

    // Login with other user
    const { body } = await supertest(server)
      .post('/api/tokens')
      .send({ username: otherUser.username, password: otherUser.password })

    const otherToken = body.Authorization

    const id = jwt.decode(token.split(' ')[1])?.sub

    await supertest(server)
      .delete(`/api/users/${id}`)
      .set('Authorization', otherToken)
      .expect(401)
  })

  it('should delete the user', () => {
    const id = jwt.decode(token.split(' ')[1])?.sub

    return supertest(server)
      .delete(`/api/users/${id}`)
      .set('Authorization', token)
      .expect(204)
  })

  it('should return 404 when detailing a non-existent user', async () => {
    const id = jwt.decode(token.split(' ')[1])?.sub

    await supertest(server)
      .get(`/api/users/${id}`)
      .set('Authorization', token)
      .expect(404)
      .expect((res) => {
        expect(res.body.error).toBe('User not found')
      })
  })

  it('should return 404 when updating a non-existent user', async () => {
    const id = jwt.decode(token.split(' ')[1])?.sub

    await supertest(server)
      .patch(`/api/users/${id}`)
      .set('Authorization', token)
      .send({ name: 'Hacked Name' })
      .expect(404)
      .expect((res) => {
        expect(res.body.error).toBe('User not found')
      })
  })
})
