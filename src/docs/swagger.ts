export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Users Service API',
    description: 'Microservice dedicated to user management, authentication, credential verification, and security.',
    version: '5.0.1',
  },
  servers: [
    {
      url: '/',
      description: 'Current server environment',
    },
  ],
  paths: {
    '/healthcheck': {
      get: {
        summary: 'Service healthcheck',
        description: 'Returns the health status of the service, database and external dependencies.',
        responses: {
          200: {
            description: 'Service is operational.',
          },
          503: {
            description: 'Service is unavailable.',
          },
        },
      },
    },
    '/api/healthcheck': {
      get: {
        summary: 'Service healthcheck',
        description: 'Returns the health status of the service, database and external dependencies.',
        responses: {
          200: {
            description: 'Service is operational.',
          },
          503: {
            description: 'Service is unavailable.',
          },
        },
      },
    },
    '/api': {
      get: {
        summary: 'Service healthcheck',
        description: 'Returns the current operational status of the service.',
        responses: {
          200: {
            description: 'Service is live and operational.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    healthcheck: {
                      type: 'string',
                      example: 'live',
                    },
                  },
                  required: ['healthcheck'],
                },
              },
            },
          },
        },
      },
    },
    '/api/tokens': {
      post: {
        summary: 'Authenticate user',
        description: 'Authenticates a user with username (or email) and password, returning a signed JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateTokenDto',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Successfully authenticated. Bearer token returned in the response body.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    Authorization: {
                      type: 'string',
                      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                    RefreshToken: {
                      type: 'string',
                      example: 'ad7e04392e999fe722eb486569ccd8a6d26a3a806842bda76589089f25bb2bab3855e6931017f134',
                    },
                  },
                  required: ['Authorization', 'RefreshToken'],
                },
              },
            },
          },
          400: {
            description: 'Bad request: validation error or invalid payload.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized: invalid credentials.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/refresh-token': {
      post: {
        summary: 'Refresh session',
        description: 'Refreshes an expired access token using a valid refresh token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RefreshTokenDto',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Successfully refreshed token.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    Authorization: { type: 'string', example: 'Bearer eyJhbGci...' },
                    RefreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid or expired refresh token',
          },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'Logout session',
        description: 'Revokes a refresh token, ending the session.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LogoutDto',
              },
            },
          },
        },
        responses: {
          204: {
            description: 'Successfully logged out.',
          },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        summary: 'Request password reset',
        description: 'Initiates password recovery. If the email exists, a password reset link/token is generated.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ForgotPasswordDto',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Success message confirming that if the account exists, instructions were sent.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'If the email exists, a password reset link has been sent.',
                    },
                  },
                  required: ['message'],
                },
              },
            },
          },
          400: {
            description: 'Bad request: validation error or invalid email payload.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        summary: 'Reset password',
        description: 'Resets user password using a valid and non-expired reset token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ResetPasswordDto',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Password successfully updated.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Password successfully reset.',
                    },
                  },
                  required: ['message'],
                },
              },
            },
          },
          400: {
            description: 'Bad request: invalid or expired reset token, or password too short.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/magic-link/request': {
      post: {
        summary: 'Request magic login link',
        description: 'Initiates passwordless login. If the email exists, a magic login link is sent to the user.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RequestMagicLinkDto',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Success message confirming that if the account exists, instructions were sent.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'If the email exists, a magic login link has been sent.',
                    },
                  },
                  required: ['message'],
                },
              },
            },
          },
          400: {
            description: 'Bad request: validation error.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/magic-link/login': {
      post: {
        summary: 'Login with magic link',
        description: 'Authenticates a user using a valid magic login token, returning standard JWT access and refresh tokens.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginWithMagicLinkDto',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Successfully authenticated. Access token and Refresh token returned.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    Authorization: {
                      type: 'string',
                      example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    },
                    RefreshToken: {
                      type: 'string',
                      example: 'ad7e04392e999fe722eb486569ccd8a6d26a3a806842bda76589089f25bb2bab3855e6931017f134',
                    },
                  },
                  required: ['Authorization', 'RefreshToken'],
                },
              },
            },
          },
          401: {
            description: 'Unauthorized: invalid or expired magic login token.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/users': {
      post: {
        summary: 'Create user',
        description: 'Registers a new user account with hashed password and email verification key.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserDto',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          400: {
            description: 'Bad request: validation failure.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          409: {
            description: 'Conflict: user with this email or username already exists.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      get: {
        summary: 'List users',
        description: 'Retrieves a paginated list of users with optional text search. Requires Bearer JWT token.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'search',
            in: 'query',
            description: 'Text search term to match against user name, username, or email.',
            required: false,
            schema: {
              type: 'string',
            },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (1-indexed). Defaults to 1.',
            required: false,
            schema: {
              type: 'integer',
              default: 1,
            },
          },
          {
            name: 'size',
            in: 'query',
            description: 'Page size for pagination. Defaults to 10.',
            required: false,
            schema: {
              type: 'integer',
              default: 10,
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of items to return (alias for size).',
            required: false,
            schema: {
              type: 'integer',
            },
          },
          {
            name: 'skip',
            in: 'query',
            description: 'Number of items to skip for offset-based pagination.',
            required: false,
            schema: {
              type: 'integer',
            },
          },
        ],
        responses: {
          200: {
            description: 'Paginated user list retrieved successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer', example: 1 },
                        size: { type: 'integer', example: 10 },
                        pages: { type: 'integer', example: 1 },
                        total: { type: 'integer', example: 1 },
                      },
                      required: ['page', 'size', 'pages', 'total'],
                    },
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/User',
                      },
                    },
                  },
                  required: ['meta', 'data'],
                },
              },
            },
          },
          400: {
            description: 'Bad request: unsafe regex or invalid query parameter.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized: missing or invalid Bearer token.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        summary: 'Get user by ID',
        description: 'Retrieves user details by their unique identifier. Requires Bearer JWT token.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Unique identifier of the user (MongoDB ObjectId).',
            required: true,
            schema: {
              type: 'string',
              example: '60d0fe4f5311236168a109ca',
            },
          },
        ],
        responses: {
          200: {
            description: 'User details retrieved successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized: missing or invalid Bearer token.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          404: {
            description: 'Not found: user does not exist.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      patch: {
        summary: 'Update user profile',
        description: 'Updates specified fields (name, email, username) of an existing user. Can only be performed by the account owner.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Unique identifier of the user.',
            required: true,
            schema: {
              type: 'string',
              example: '60d0fe4f5311236168a109ca',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateUserDto',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User updated successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          400: {
            description: 'Bad request: validation failure.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized: invalid token or token does not match user ID (only the owner can update).',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          404: {
            description: 'Not found: user does not exist.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          409: {
            description: 'Conflict: username or email is already taken.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete user',
        description: 'Deletes a user account. Can only be performed by the account owner.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Unique identifier of the user.',
            required: true,
            schema: {
              type: 'string',
              example: '60d0fe4f5311236168a109ca',
            },
          },
        ],
        responses: {
          204: {
            description: 'User deleted successfully. No content returned.',
          },
          401: {
            description: 'Unauthorized: invalid token or token does not match user ID.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          404: {
            description: 'Not found: user does not exist.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}/password': {
      put: {
        summary: 'Update user password',
        description: 'Updates the password for a user after verifying their current password. Can only be performed by the account owner.',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Unique identifier of the user.',
            required: true,
            schema: {
              type: 'string',
              example: '60d0fe4f5311236168a109ca',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateUserPasswordDto',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Password updated successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Password updated',
                    },
                  },
                  required: ['message'],
                },
              },
            },
          },
          400: {
            description: 'Bad request: validation failure.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized: invalid token, wrong current password, or not the account owner.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          404: {
            description: 'Not found: user does not exist.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/verifications': {
      post: {
        summary: 'Verify user email',
        description: 'Validates and verifies a user email address using the verification key generated during creation.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateVerificationDto',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Email verified successfully.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'string',
                      example: 'Email verified',
                    },
                  },
                  required: ['success'],
                },
              },
            },
          },
          400: {
            description: 'Bad request: validation error or email already verified.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          401: {
            description: 'Unauthorized: wrong verification key.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          404: {
            description: 'Not found: user does not exist.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT Bearer token in format: Bearer <token>',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier of the user (MongoDB ObjectId string)',
            example: '60d0fe4f5311236168a109ca',
          },
          name: {
            type: 'string',
            description: 'Full name of the user',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Unique email address',
            example: 'john@example.com',
          },
          username: {
            type: 'string',
            description: 'Unique username',
            example: 'johndoe',
          },
          isEmailVerified: {
            type: 'boolean',
            description: 'Indicates whether the email address has been verified',
            example: false,
          },
          roles: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Assigned roles for access control',
            example: ['user'],
          },
        },
        required: ['id', 'name', 'email', 'username', 'isEmailVerified', 'roles'],
      },
      CreateUserDto: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Full name of the user',
            example: 'John Doe',
          },
          username: {
            type: 'string',
            description: 'Unique username',
            example: 'johndoe',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Valid email address',
            example: 'john@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            description: 'Password (minimum 8 characters)',
            example: 'securePassword123',
          },
          roles: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Optional roles assigned to the user',
            example: ['user'],
          },
        },
        required: ['name', 'username', 'email', 'password'],
      },
      UpdateUserDto: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'New full name of the user',
            example: 'John Doe',
          },
          username: {
            type: 'string',
            description: 'New unique username',
            example: 'johndoe',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'New email address',
            example: 'john@example.com',
          },
        },
      },
      UpdateUserPasswordDto: {
        type: 'object',
        properties: {
          currentPassword: {
            type: 'string',
            format: 'password',
            description: 'Current account password for validation',
            example: 'oldPassword123',
          },
          newPassword: {
            type: 'string',
            format: 'password',
            minLength: 8,
            description: 'New password (minimum 8 characters)',
            example: 'newSecurePassword123',
          },
        },
        required: ['currentPassword', 'newPassword'],
      },
      CreateTokenDto: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            description: 'Registered username or email address',
            example: 'johndoe',
          },
          password: {
            type: 'string',
            format: 'password',
            description: 'Account password',
            example: 'securePassword123',
          },
        },
        required: ['username', 'password'],
      },
      RefreshTokenDto: {
        type: 'object',
        properties: {
          refreshToken: {
            type: 'string',
            description: 'The refresh token obtained during login',
          },
        },
        required: ['refreshToken'],
      },
      LogoutDto: {
        type: 'object',
        properties: {
          refreshToken: {
            type: 'string',
            description: 'The refresh token to revoke',
          },
        },
        required: ['refreshToken'],
      },
      CreateVerificationDto: {
        type: 'object',
        properties: {
          user_id: {
            type: 'string',
            description: 'User ID to verify',
            example: '60d0fe4f5311236168a109ca',
          },
          type: {
            type: 'string',
            enum: ['email'],
            description: 'Verification type (must be "email")',
            example: 'email',
          },
          key: {
            type: 'string',
            description: 'Secret verification key generated during user creation',
            example: 'c8b1a8d0-5d6e-4e78-9f23-8e7c10b1a2c3',
          },
        },
        required: ['user_id', 'type', 'key'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message description',
            example: 'Invalid credentials',
          },
        },
        required: ['error'],
      },
      RequestMagicLinkDto: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john@example.com',
          },
        },
        required: ['email'],
      },
      LoginWithMagicLinkDto: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'Magic login token received via email',
            example: 'd3b07384d113edec49eaa6238ad5ff00',
          },
        },
        required: ['token'],
      },
      ForgotPasswordDto: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john@example.com',
          },
        },
        required: ['email'],
      },
      ResetPasswordDto: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'Reset password token received via email',
            example: 'd3b07384d113edec49eaa6238ad5ff00',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
            description: 'New password (minimum 8 characters)',
            example: 'newSecurePassword123',
          },
        },
        required: ['token', 'password'],
      },
    },
  },
}
