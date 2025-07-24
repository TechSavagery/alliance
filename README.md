# Alliance - Team Building Games Platform

A comprehensive multiplayer team building platform designed to strengthen workplace collaboration through engaging games. Built with Next.js, Colyseus, Babylon.js, and PostgreSQL.

## 🎮 Features

### Platform Features
- **User Account System**: Username-based accounts with comprehensive user tracking
- **Team Management**: Create and manage teams with role-based permissions
- **Game Scheduling**: Schedule recurring team building sessions
- **Comprehensive Analytics**: Track individual and team performance metrics
- **Achievement System**: Unlock achievements and milestones
- **Real-time Communication**: Built-in chat and team coordination tools

### Games
- **Alliance Defense (Shooter)**: Team-based defense game with three roles:
  - **Gunners**: Primary damage dealers with enhanced shooting capabilities
  - **Engineers**: Build and repair structures, create defensive barriers
  - **Medics**: Heal teammates and provide team support
- **Coming Soon**: Puzzle games, strategy games, and more

### Technical Features
- **Real-time Multiplayer**: Powered by Colyseus game server
- **3D Graphics**: Babylon.js-powered game engine
- **Scalable Architecture**: Docker-based containerized deployment
- **Database Analytics**: PostgreSQL with comprehensive stat tracking
- **Modern UI**: Responsive design with Tailwind CSS and Framer Motion

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   Frontend      │    │   Game Server    │    │   Database      │
│   (Next.js)     │◄──►│   (Colyseus)     │◄──►│   (PostgreSQL)  │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │                 │
                         │   Nginx         │
                         │   (Reverse      │
                         │    Proxy)       │
                         │                 │
                         └─────────────────┘
```

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 80, 3000, 2567, and 5432 available

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/alliance.git
cd alliance
```

### 2. Environment Configuration
Create environment files:

**`.env`** (root directory):
```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=alliance_user
DB_PASSWORD=alliance_password
DB_NAME=alliance

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Node Environment
NODE_ENV=development

# URLs
NEXT_PUBLIC_SERVER_URL=http://localhost:2567
NEXT_PUBLIC_WS_URL=ws://localhost:2567
```

### 3. Start the Platform
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access the Platform
- **Main Platform**: http://localhost
- **Game Server Monitor**: http://localhost/colyseus (development only)
- **Database**: localhost:5432

## 🛠️ Development Setup

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Game Server Development
```bash
cd game-server
npm install
npm run start
```

### Database Management
```bash
# View logs
docker-compose logs postgres

# Access database directly
docker-compose exec postgres psql -U alliance_user -d alliance

# Backup database
docker-compose exec postgres pg_dump -U alliance_user alliance > backup.sql

# Restore database
docker-compose exec -T postgres psql -U alliance_user alliance < backup.sql
```

## 🎯 Game Development

### Adding New Games

1. **Create Game Room**:
```typescript
// game-server/src/rooms/YourGameRoom.ts
import { Room, Client } from "colyseus";
import { YourGameState } from "./schema/YourGameState";

export class YourGameRoom extends Room<YourGameState> {
  onCreate(options: any) {
    this.setState(new YourGameState());
    // Game logic here
  }
}
```

2. **Register in Arena Config**:
```typescript
// game-server/src/arena.config.ts
gameServer.define('your_game', YourGameRoom);
```

3. **Add to Frontend**:
```typescript
// frontend/src/pages/index.tsx
{
  id: 'your_game',
  name: 'Your Game Name',
  description: 'Game description',
  minPlayers: 2,
  maxPlayers: 6,
  duration: '20-30 min',
  difficulty: 'Medium',
  icon: YourIcon,
  available: true
}
```

## 🔧 Configuration

### Environment Variables

#### Game Server
```env
NODE_ENV=production|development
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
JWT_SECRET=your-secret-key
PORT=2567
```

#### Frontend
```env
NODE_ENV=production|development
NEXT_PUBLIC_SERVER_URL=http://your-server:2567
NEXT_PUBLIC_WS_URL=ws://your-server:2567
```

### Game Configuration
Games can be configured via the database or environment variables:

```typescript
// Example game config
{
  maxPlayers: 4,
  gameSpeed: 60, // FPS
  enemySpawnRate: 3000, // milliseconds
  difficultyScaling: 1.2,
  allowedRoles: ['gunner', 'engineer', 'medic']
}
```

## 📊 Analytics & Monitoring

### User Analytics
- Individual performance tracking
- Skill rating calculations
- Achievement progress
- Learning curve analysis

### Team Analytics
- Team performance metrics
- Collaboration effectiveness
- Communication patterns
- Leadership emergence

### Game Analytics
- Session success rates
- Difficulty progression
- Player engagement metrics
- Retention analysis

## 🚀 Deployment

### Production Deployment

1. **Update Environment Variables**:
```env
NODE_ENV=production
JWT_SECRET=secure-random-secret-key
DB_PASSWORD=secure-database-password
```

2. **SSL Configuration**:
```bash
# Add SSL certificates to nginx/ssl/
nginx/ssl/
├── alliance.crt
└── alliance.key
```

3. **Deploy**:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### AWS EC2 Deployment

1. **Launch EC2 Instance**:
   - Recommended: t3.medium or larger
   - Security groups: Allow ports 80, 443, 22

2. **Install Docker**:
```bash
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

3. **Clone and Deploy**:
```bash
git clone https://github.com/your-org/alliance.git
cd alliance
docker-compose up -d --build
```

### Database Migrations

```bash
# Create migration
npm run typeorm migration:create -- -n YourMigrationName

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

## 🧪 Testing

### Running Tests
```bash
# Game server tests
cd game-server
npm test

# Frontend tests
cd frontend
npm test

# Load testing
cd game-server
npm run loadtest
```

### Load Testing
```bash
# Test with multiple clients
npx @colyseus/loadtest loadtest/shooter.ts --room shooter_game --numClients 10
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- TypeScript for all new code
- ESLint configuration provided
- Prettier for formatting
- Conventional commits preferred

## 📈 Roadmap

### Phase 1 (Current)
- [x] User authentication system
- [x] Team management
- [x] Shooter game implementation
- [x] Basic analytics
- [x] Docker deployment

### Phase 2
- [ ] Puzzle-based team games
- [ ] Advanced analytics dashboard
- [ ] Mobile app support
- [ ] Team scheduling system
- [ ] Integration with Slack/Teams

### Phase 3
- [ ] AI-powered team insights
- [ ] Custom game builder
- [ ] Enterprise features
- [ ] Advanced reporting
- [ ] Multi-tenant support

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.alliance-platform.com](https://docs.alliance-platform.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/alliance/issues)
- **Discord**: [Alliance Community](https://discord.gg/alliance)
- **Email**: support@alliance-platform.com

## 🏆 Acknowledgments

- Built with [Colyseus](https://colyseus.io/) for multiplayer architecture
- UI powered by [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- 3D graphics with [Babylon.js](https://www.babylonjs.com/)
- Database management with [TypeORM](https://typeorm.io/)

---

**Alliance** - Building stronger teams through play 🎮