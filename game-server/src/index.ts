/**
 * IMPORTANT: 
 * ---------
 * Do not manually edit this file if you'd like to use Colyseus Arena
 * 
 * If you're self-hosting (without Arena), you can manually instantiate a
 * Colyseus Server as documented here: 👉 https://docs.colyseus.io/server/api/#constructor-options 
 */
import { listen } from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import express from "express";
import cors from "cors";

// Import database and services
import { initializeDatabase, closeDatabase } from "./database/dataSource";
import { AuthService } from "./services/AuthService";

// Import room configurations
import app from "./arena.config";

const port = Number(process.env.PORT || 2567);

// Initialize database before starting server
async function bootstrap() {
  try {
    // Initialize database connection
    await initializeDatabase();
    console.log("🗄️  Database initialized successfully");

    // Start the game server
    const gameServer = await listen(app, port);
    console.log(`🎮 Alliance game server is listening on port ${port}`);

    // Add authentication middleware to express app
    const authService = new AuthService();
    
    // Add CORS middleware
    gameServer.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com'] 
        : ['http://localhost:3000', 'http://localhost'],
      credentials: true
    }));

    // Authentication routes
    gameServer.post('/auth/register', async (req, res) => {
      try {
        const result = await authService.register(req.body);
        res.status(result.success ? 201 : 400).json(result);
      } catch (error) {
        console.error('Registration endpoint error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });

    gameServer.post('/auth/login', async (req, res) => {
      try {
        const result = await authService.login(req.body);
        res.status(result.success ? 200 : 401).json(result);
      } catch (error) {
        console.error('Login endpoint error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });

    gameServer.post('/auth/verify', async (req, res) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          return res.status(401).json({ valid: false, message: 'No token provided' });
        }
        
        const result = await authService.verifyToken(token);
        res.status(result.valid ? 200 : 401).json(result);
      } catch (error) {
        console.error('Token verification endpoint error:', error);
        res.status(500).json({ valid: false, message: 'Internal server error' });
      }
    });

    gameServer.post('/auth/refresh', async (req, res) => {
      try {
        const { token } = req.body;
        const result = await authService.refreshToken(token);
        res.status(result.success ? 200 : 401).json(result);
      } catch (error) {
        console.error('Token refresh endpoint error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });

    gameServer.get('/auth/user/:username', async (req, res) => {
      try {
        const user = await authService.getUserByUsername(req.params.username);
        if (user) {
          res.json({ success: true, user });
        } else {
          res.status(404).json({ success: false, message: 'User not found' });
        }
      } catch (error) {
        console.error('Get user endpoint error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });

    // Health check endpoint
    gameServer.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
          database: 'connected',
          gameServer: 'running'
        }
      });
    });

    // Add monitor middleware (development only)
    if (process.env.NODE_ENV !== 'production') {
      gameServer.use('/colyseus', monitor());
      gameServer.use('/', playground);
    }

    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      try {
        await gameServer.gracefullyShutdown();
        await closeDatabase();
        console.log('✅ Server shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

    process.on('SIGINT', async () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      try {
        await gameServer.gracefullyShutdown();
        await closeDatabase();
        console.log('✅ Server shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('💥 Uncaught Exception:', error);
      try {
        await gameServer.gracefullyShutdown();
        await closeDatabase();
      } catch (shutdownError) {
        console.error('❌ Error during emergency shutdown:', shutdownError);
      }
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      try {
        await gameServer.gracefullyShutdown();
        await closeDatabase();
      } catch (shutdownError) {
        console.error('❌ Error during emergency shutdown:', shutdownError);
      }
      process.exit(1);
    });

    console.log('🚀 Alliance platform is ready for team building!');
    console.log(`📊 Monitor: http://localhost:${port}/colyseus`);
    console.log(`🎮 Playground: http://localhost:${port}`);

  } catch (error) {
    console.error('💥 Failed to start Alliance platform:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();