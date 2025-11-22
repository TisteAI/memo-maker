# Memo Maker

AI-powered meeting memo generation application that records conversations, transcribes audio, and generates structured memos.

## Features

- 🎤 Real-time audio recording from phone/laptop microphone
- 📝 AI-powered transcription using OpenAI Whisper
- 🤖 Intelligent memo generation with GPT-4
- 🔐 Secure authentication with JWT
- 📱 Cross-platform support (iOS, Android, Web)
- ☁️ Cloud storage for audio files
- 📊 Usage tracking and subscription management

## Architecture

### Tech Stack

**Frontend:**
- React Native (Expo) for mobile apps
- Next.js 14+ for web application
- TypeScript, Zustand, React Query
- shadcn/ui + Tailwind CSS

**Backend:**
- Node.js 20 LTS + TypeScript
- Fastify 4.x (high-performance web framework)
- PostgreSQL 15+ with Prisma ORM
- Redis for caching and job queues
- BullMQ for background job processing

**AI/ML:**
- OpenAI Whisper API (transcription)
- OpenAI GPT-4o-mini (memo generation)
- Promptfoo (LLM evaluation)

**Infrastructure:**
- Railway (MVP deployment)
- AWS S3 + CloudFront (audio storage + CDN)
- Docker + Docker Compose (local development)

### Project Structure

```
memo-maker/
├── backend/              # Node.js + Fastify API
│   ├── src/
│   │   ├── config/      # Environment configuration
│   │   ├── db/          # Database client
│   │   ├── middleware/  # Auth, error handling
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── tests/       # Test utilities
│   │   └── utils/       # Shared utilities
│   ├── prisma/          # Database schema & migrations
│   └── package.json
│
├── frontend-web/        # Next.js web application
│   └── (coming soon)
│
├── mobile/              # React Native mobile app
│   └── (coming soon)
│
├── docker-compose.yml   # Local development services
└── package.json         # Monorepo root
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose
- OpenAI API key (for transcription and memo generation)

### Quick Setup (< 10 minutes)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/memo-maker.git
   cd memo-maker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. **Start local services (PostgreSQL, Redis, LocalStack):**
   ```bash
   npm run docker:up
   ```

5. **Run database migrations:**
   ```bash
   npm run db:migrate -w backend
   ```

6. **Start the backend server:**
   ```bash
   npm run dev:backend
   ```

The API will be available at `http://localhost:3000`

### Development Workflow

**Run all services:**
```bash
npm run dev
```

**Run tests:**
```bash
npm test                    # All workspaces
npm run test:backend        # Backend only
npm run test:coverage       # With coverage report
```

**Database management:**
```bash
npm run db:studio -w backend    # Open Prisma Studio
npm run db:migrate -w backend   # Run migrations
npm run db:seed -w backend      # Seed test data
```

**Linting and type-checking:**
```bash
npm run lint
npm run type-check
```

## Testing Strategy

This project follows **Test-Driven Development (TDD)** methodology:

- ✅ Tests MUST be written BEFORE implementation
- ✅ Red-Green-Refactor cycle mandatory
- ✅ Coverage requirements:
  - Backend: 80% overall
  - Frontend: 70% overall
  - Security-critical code: 100% (auth, payments)

**Test Stack:**
- Vitest (unit & integration tests)
- Testcontainers (real PostgreSQL/Redis in tests)
- Playwright (E2E tests)
- Promptfoo (LLM evaluation)

**Running tests:**
```bash
npm run test:watch -w backend   # Watch mode
npm run test:unit -w backend    # Unit tests only
npm run test:integration        # Integration tests
npm run test:coverage           # Generate coverage report
```

## API Documentation

### Authentication Endpoints

```
POST   /api/auth/register        - Create new user account
POST   /api/auth/login           - Login with email/password
POST   /api/auth/refresh         - Refresh access token
POST   /api/auth/logout          - Logout (revoke refresh token)
GET    /api/auth/me              - Get current user info
POST   /api/auth/change-password - Change password
```

### Example: Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

Response:
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

### Example: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "clx_1234...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

## Database Schema

### Core Models

- **User**: User accounts with authentication
- **Subscription**: Subscription tiers and usage tracking
- **Memo**: Meeting recordings and metadata
- **Transcript**: AI-generated transcriptions
- **RefreshToken**: JWT refresh token management

See `backend/prisma/schema.prisma` for full schema.

## Security

- 🔒 Password hashing with bcrypt (10 rounds)
- 🎫 JWT authentication (15-min access token, 7-day refresh token)
- 🔄 Automatic token rotation on refresh
- 🛡️ Helmet.js security headers
- 🚦 Rate limiting (100 requests/minute)
- 🔐 TLS 1.3 encryption (production)
- 🗝️ AWS Secrets Manager for production secrets

## Cost Optimization

**Estimated costs:**
- MVP (100 users): ~$1,000/month
- Scale (10k users): ~$10,000/month
- Enterprise (100k users): ~$12,000/month (self-hosted Whisper)

**Self-hosting Whisper becomes cost-effective at ~$20k/month API costs**

## Contributing

1. Follow TDD methodology (tests before code)
2. Maintain test coverage thresholds
3. Run linting and type-checking before commits
4. Write clear commit messages
5. Update documentation for new features

## License

MIT

## Support

For issues and questions, please open a GitHub issue.