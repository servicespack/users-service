import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { User } from '../../domain/entities/user.entity'
import { UserNotFoundError } from '../../domain/errors'
import {
  createGrpcServer,
  getProtoPath,
  startGrpcServer,
  stopGrpcServer,
} from './server'

describe('gRPC Server Integration', () => {
  let server: grpc.Server
  let client: any
  let boundPort: number

  const mockUser = new User({
    id: 'user-grpc-1',
    name: 'gRPC Tester',
    email: 'grpc@example.com',
    username: 'grpctester',
    password: 'password',
    isEmailVerified: true,
    roles: ['admin', 'user'],
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  })

  const mockGetUserByIdUseCase = {
    execute: vi.fn(),
  } as any

  const mockListUsersUseCase = {
    execute: vi.fn(),
  } as any

  beforeAll(async () => {
    server = createGrpcServer({
      getUserByIdUseCase: mockGetUserByIdUseCase,
      listUsersUseCase: mockListUsersUseCase,
    })

    boundPort = await startGrpcServer(server, 0)

    const protoPath = getProtoPath()
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    })
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
    const UsersService = protoDescriptor.users.v1.UserService

    client = new UsersService(
      `127.0.0.1:${boundPort}`,
      grpc.credentials.createInsecure(),
    )
  })

  afterAll(async () => {
    client?.close()
    await stopGrpcServer(server)
  })

  it('should resolve proto path', () => {
    const protoPath = getProtoPath()
    expect(protoPath).toContain('users.proto')
  })

  it('should create gRPC server with default options when no options are provided', () => {
    const defaultServer = createGrpcServer()
    expect(defaultServer).toBeInstanceOf(grpc.Server)
  })

  it('should reject startGrpcServer when bindAsync fails', async () => {
    const mockServer = {
      bindAsync: vi.fn((_addr, _creds, callback) => {
        callback(new Error('Bind failed'), 0)
      }),
    } as unknown as grpc.Server

    await expect(startGrpcServer(mockServer, 50051)).rejects.toThrow('Bind failed')
  })

  it('should call forceShutdown when tryShutdown encounters an error', async () => {
    const mockServer = {
      tryShutdown: vi.fn((callback) => {
        callback(new Error('Shutdown error'))
      }),
      forceShutdown: vi.fn(),
    } as unknown as grpc.Server

    await stopGrpcServer(mockServer)

    expect(mockServer.forceShutdown).toHaveBeenCalled()
  })

  it('should call GetUserById and receive user response via gRPC', async () => {
    mockGetUserByIdUseCase.execute.mockResolvedValue(mockUser)

    const response = await new Promise<any>((resolve, reject) => {
      client.GetUserById({ id: 'user-grpc-1' }, (error: any, res: any) => {
        if (error) {
          return reject(error)
        }
        resolve(res)
      })
    })

    expect(response).toEqual({
      id: 'user-grpc-1',
      name: 'gRPC Tester',
      email: 'grpc@example.com',
      username: 'grpctester',
      is_email_verified: true,
      roles: ['admin', 'user'],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    })
  })

  it('should return NOT_FOUND error when user is not found', async () => {
    mockGetUserByIdUseCase.execute.mockRejectedValue(new UserNotFoundError())

    await expect(
      new Promise<any>((resolve, reject) => {
        client.GetUserById({ id: 'unknown-id' }, (error: any, res: any) => {
          if (error) {
            return reject(error)
          }
          resolve(res)
        })
      }),
    ).rejects.toMatchObject({
      code: grpc.status.NOT_FOUND,
    })
  })

  it('should call ListUsers and receive paginated response via gRPC', async () => {
    mockListUsersUseCase.execute.mockResolvedValue({
      data: [mockUser],
      meta: {
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      },
    })

    const response = await new Promise<any>((resolve, reject) => {
      client.ListUsers({ page: 1, size: 10, search: '' }, (error: any, res: any) => {
        if (error) {
          return reject(error)
        }
        resolve(res)
      })
    })

    expect(response).toEqual({
      users: [
        {
          id: 'user-grpc-1',
          name: 'gRPC Tester',
          email: 'grpc@example.com',
          username: 'grpctester',
          is_email_verified: true,
          roles: ['admin', 'user'],
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      size: 10,
      pages: 1,
    })
  })
})
