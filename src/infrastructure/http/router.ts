import type { Request, Response } from 'express'
import process from 'node:process'
import express from 'express'
import mongoose from 'mongoose'

import { HealthcheckController } from '../../adapters/controllers/healthcheck.controller'
import { PasswordsController } from '../../adapters/controllers/passwords.controller'
import { RootController } from '../../adapters/controllers/root.controller'
import { TokensController } from '../../adapters/controllers/tokens.controller'
import { UsersController } from '../../adapters/controllers/users.controller'
import { VerificationsController } from '../../adapters/controllers/verifications.controller'
import { CreateTokenDto } from '../../adapters/dtos/create-token.dto'
import { CreateUserDto } from '../../adapters/dtos/create-user.dto'
import { CreateVerificationDto } from '../../adapters/dtos/create-verification.dto'
import { ForgotPasswordDto } from '../../adapters/dtos/forgot-password.dto'
import { LogoutDto } from '../../adapters/dtos/logout.dto'
import { RefreshTokenDto } from '../../adapters/dtos/refresh-token.dto'
import { ResetPasswordDto } from '../../adapters/dtos/reset-password.dto'
import { UpdateUserPasswordDto } from '../../adapters/dtos/update-user-password.dto'
import { UpdateUserDto } from '../../adapters/dtos/update-user.dto'
import auth from '../../adapters/middlewares/auth'
import { validator } from '../../adapters/middlewares/validator'
import { CreateTokenUseCase } from '../../application/use-cases/auth/create-token.use-case'
import { ForgotPasswordUseCase } from '../../application/use-cases/auth/forgot-password.use-case'
import { LogoutUseCase } from '../../application/use-cases/auth/logout.use-case'
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case'
import { ResetPasswordUseCase } from '../../application/use-cases/auth/reset-password.use-case'
import { HealthcheckUseCase } from '../../application/use-cases/healthcheck/healthcheck.use-case'
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case'
import { DeleteUserUseCase } from '../../application/use-cases/users/delete-user.use-case'
import { GetUserByIdUseCase } from '../../application/use-cases/users/get-user-by-id.use-case'
import { ListUsersUseCase } from '../../application/use-cases/users/list-users.use-case'
import { UpdateUserPasswordUseCase } from '../../application/use-cases/users/update-user-password.use-case'
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case'
import { VerifyEmailUseCase } from '../../application/use-cases/verifications/verify-email.use-case'
import { configuration } from '../../config'
import { RefreshTokenModel } from '../database/mongoose/models/refresh-token.model'
import { UserModel } from '../database/mongoose/models/user.model'
import { MongooseRefreshTokenRepository } from '../database/mongoose/repositories/mongoose-refresh-token.repository'
import { MongooseUserRepository } from '../database/mongoose/repositories/mongoose-user.repository'
import { HttpNotificationSender } from '../notifications/http-notification-sender'
import { Argon2PasswordHasher } from '../security/argon2-password-hasher'
import { JwtTokenProvider } from '../security/jwt-token-provider'

const router = express.Router()

// Infrastructure Adapters
const userRepository = new MongooseUserRepository(UserModel)
const refreshTokenRepository = new MongooseRefreshTokenRepository(RefreshTokenModel)
const passwordHasher = new Argon2PasswordHasher()
const tokenProvider = new JwtTokenProvider()
const notificationSender = new HttpNotificationSender({
  baseUrl: configuration.notifications.url,
  suppressErrors: configuration.environment !== 'production',
})

// Application Use Cases
const createUserUseCase = new CreateUserUseCase(userRepository, passwordHasher, notificationSender)
const listUsersUseCase = new ListUsersUseCase(userRepository)
const getUserByIdUseCase = new GetUserByIdUseCase(userRepository)
const updateUserUseCase = new UpdateUserUseCase(userRepository)
const updateUserPasswordUseCase = new UpdateUserPasswordUseCase(userRepository, passwordHasher)
const deleteUserUseCase = new DeleteUserUseCase(userRepository)
const createTokenUseCase = new CreateTokenUseCase(userRepository, passwordHasher, tokenProvider, refreshTokenRepository)
const refreshTokenUseCase = new RefreshTokenUseCase(refreshTokenRepository, tokenProvider, userRepository)
const logoutUseCase = new LogoutUseCase(refreshTokenRepository)
const verifyEmailUseCase = new VerifyEmailUseCase(userRepository)
const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, notificationSender)
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository, passwordHasher)

// Controllers
const rootController = new RootController()
const tokensController = new TokensController(createTokenUseCase, refreshTokenUseCase, logoutUseCase)
const usersController = new UsersController({
  createUserUseCase,
  listUsersUseCase,
  getUserByIdUseCase,
  updateUserUseCase,
  updateUserPasswordUseCase,
  deleteUserUseCase,
})
const verificationsController = new VerificationsController(verifyEmailUseCase)
const passwordsController = new PasswordsController({
  forgotPasswordUseCase,
  resetPasswordUseCase,
})

const checkDatabase = () => (mongoose.connection.readyState === 1 ? 'up' as const : 'down' as const)
async function checkNotifications(): Promise<'up' | 'down'> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)
    const res = await fetch(`${configuration.notifications.url.replace(/\/$/, '')}/api/healthcheck`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return res.ok ? 'up' : 'down'
  }
  catch {
    return 'down'
  }
}

const healthcheckUseCase = new HealthcheckUseCase({
  checkDatabase,
  checkNotifications,
  getUptime: () => process.uptime(),
})
export const healthcheckController = new HealthcheckController(healthcheckUseCase)

router.get('/', (req: Request, res: Response) => rootController.get(req, res))
router.get('/healthcheck', (req: Request, res: Response) => healthcheckController.get(req, res))

router.post('/tokens', [validator({ Dto: CreateTokenDto })], (req: Request, res: Response) => tokensController.create(req, res))
router.post('/auth/refresh-token', [validator({ Dto: RefreshTokenDto })], (req: Request, res: Response) => tokensController.refresh(req, res))
router.post('/auth/logout', [validator({ Dto: LogoutDto })], (req: Request, res: Response) => tokensController.logout(req, res))

router.post('/auth/forgot-password', [validator({ Dto: ForgotPasswordDto })], (req: Request, res: Response) => passwordsController.forgotPassword(req, res))
router.post('/auth/reset-password', [validator({ Dto: ResetPasswordDto })], (req: Request, res: Response) => passwordsController.resetPassword(req, res))

router.post('/users', [validator({ Dto: CreateUserDto })], (req: Request, res: Response) => usersController.create(req, res))
router.get('/users', [auth()], (req: Request, res: Response) => usersController.list(req, res))
router.get('/users/:id', [auth()], (req: Request, res: Response) => usersController.show(req, res))
router.patch('/users/:id', [auth({ onlyTheOwner: true }), validator({ Dto: UpdateUserDto })], (req: Request<any, any, any>, res: Response) => usersController.update(req, res))
router.put('/users/:id/password', [auth({ onlyTheOwner: true }), validator({ Dto: UpdateUserPasswordDto })], (req: Request<any, any, any>, res: Response) => usersController.updatePassword(req, res))
router.delete('/users/:id', [auth({ onlyTheOwner: true })], (req: Request, res: Response) => usersController.delete(req, res))

router.post('/verifications', [validator({ Dto: CreateVerificationDto })], (req: Request, res: Response) => verificationsController.create(req, res))

export default router
