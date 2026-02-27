import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { join } from 'path'

export const injectMiddleware = (app: express.Express) => {
  app.use(express.json({ limit: '10mb' }))
  app.use('/', express.static(join(__dirname + '/../public')))
  app.use(compression())
  app.use(helmet())
  app.use(
    morgan(
      '[:date[clf]] - :method :url :status :res[content-length] - :response-time ms'
    )
  )

  // Set trust proxy for App Engine environment
  // This is critical to make WebSockets work behind App Engine's proxy
  app.set('trust proxy', true)

  // Add CORS middleware with expanded options for WebSocket
  const corsOptions = {
    origin: '*', // Or restrict to specific origins in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Forwarded-Proto',
      'X-Requested-With',
      'Accept',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours for preflight cache
  }
  app.use(cors(corsOptions))
}
