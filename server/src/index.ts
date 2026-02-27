// File: src/index.ts
import express from 'express'
import http from 'http'
import { injectMiddleware } from './middlewares'
import { injectRoutes } from './routes'
import { prismaService } from './service/prismaService'
import { WebSocketService } from './service/websocketService'
import { setupConnection } from './utils/connection'

const app = express()

injectMiddleware(app)

// Create HTTP server for Socket.IO
const server = http.createServer(app)

// Initialize WebSocket service with improved options
const webSocketService = new WebSocketService(server)

// Add Socket.IO connection debug logging
webSocketService.io.engine.on('connection', (socket: any) => {
  console.log(`Socket engine connected: ${socket.id}`)
})

webSocketService.io.engine.on('connection_error', (err: any) => {
  console.error(`Socket engine connection error: ${err.message}`)
})

// Log socket events
webSocketService.io.use((socket: any, next: any) => {
  console.log(`New socket connection attempt: ${socket.id}`)
  next()
})

// Make WebSocket service available to the request objects
// This allows controllers to use the WebSocket service
app.use((req: any, res, next) => {
  req.webSocketService = webSocketService
  next()
})

// Add special route to check WebSocket server status
app.get('/socket.io-status', (req, res) => {
  res.json({
    status: 'active',
    engine: webSocketService.io ? 'active' : 'not initialized',
    connections: webSocketService.io?.sockets?.sockets?.size || 0,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// WebSocket health check endpoint - important for App Engine health checks
app.get('/health', (req, res) => {
  res.status(200).send('Aktive!')
})

// Add a WebSocket status endpoint for debugging
app.get('/api/websocket-status', (req, res) => {
  const engineStats: {
    connections: number
    activeTransports: Record<string, number>
  } = {
    connections: 0,
    activeTransports: {},
  }

  // Count connections and gather transport stats
  if (webSocketService.io) {
    const sockets = webSocketService.io.sockets.sockets
    engineStats.connections = sockets.size

    // Count transports
    sockets.forEach((socket: any) => {
      const transport = socket.conn.transport.name
      if (transport in engineStats.activeTransports) {
        engineStats.activeTransports[transport]++
      } else {
        engineStats.activeTransports[transport] = 1
      }
    })
  }

  res.json({
    status: 'active',
    environment: process.env.NODE_ENV,
    engine: 'socket.io',
    connections: engineStats.connections,
    transports: engineStats.activeTransports,
    serverTime: new Date().toISOString(),
    clientInfo: {
      ip: req.headers['x-forwarded-for'] || req.ip,
      protocol: req.headers['x-forwarded-proto'] || req.protocol,
      host: req.headers.host,
    },
  })
})

// Use the routes
injectRoutes(app)

// Setup connection to Solana
setupConnection()

// Start the Express server.
// Note: We now try connecting to the database and running migrations,
// but if these fail we log the error and continue to start the server.
const PORT = process.env.PORT || 8080

;(async function startServer() {
  await prismaService.testConnection()

  // Use the HTTP server instead of app.listen
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`)
    console.log(
      `WebSocket server initialized. Environment: ${process.env.NODE_ENV}`,
    )
    console.log(`Server started at: ${new Date().toISOString()}`)
    console.log(`WebSocket enabled: ${process.env.WEBSOCKET_ENABLED || 'true'}`)
  })
})()
