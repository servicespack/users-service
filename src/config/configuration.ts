import { plainToInstance } from 'class-transformer'
import { ConfigurationDto } from './configuration.dto'

const {
  DATABASE_URI,
  HTTP_SERVER_PORT,
  GRPC_SERVER_PORT,
  NODE_ENV,
  NOTIFICATIONS_API_URL,
  TOKEN_SECRET,
  TOKEN_EXPIRATION,
} = process.env

const configuration = plainToInstance(ConfigurationDto, {
  environment: NODE_ENV || 'development',
  database: {
    uri: DATABASE_URI || 'mongodb://localhost:27017/users-service',
  },
  servers: {
    http: {
      port: HTTP_SERVER_PORT || '3000',
    },
    grpc: {
      port: GRPC_SERVER_PORT || '50051',
    },
  },
  auth: {
    jwtSecret: TOKEN_SECRET || 'abcdef',
    jwtExpiration: TOKEN_EXPIRATION || '60',
  },
  notifications: {
    url: NOTIFICATIONS_API_URL || 'http://localhost:3001',
  },
} as ConfigurationDto)

export { configuration }
