import http from 'node:http'

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import pino from 'pino-http'
import swaggerUi from 'swagger-ui-express'

import { options } from '../../config'
import { swaggerDocument } from '../../docs/swagger'
import router, { healthcheckController } from './router'

const app = express()

app.use(cors())
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
)
app.use(pino(options))
app.use(express.json())

app.get('/docs/swagger.json', (_req, res) => {
  res.status(200).json(swaggerDocument)
})
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.get('/api/docs/swagger.json', (_req, res) => res.redirect('/docs/swagger.json'))
app.get('/api/docs', (_req, res) => res.redirect('/docs'))

app.get('/healthcheck', (req, res) => healthcheckController.get(req, res))
app.use('/api', router)

// Global Error Handler
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  req.log?.error(err)

  const error = err as Error & { status?: number, statusCode?: number, code?: number }

  if (error.name === 'MongoServerError' && error.code === 11000) {
    return res.status(409).json({ error: 'Duplicate key error' })
  }

  return res.status(error.status || error.statusCode || 500).json({
    error: error.message || 'Internal Server Error',
  })
})

export const server = http.createServer(app)
export { app }
