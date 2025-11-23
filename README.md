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
│   ├── src/
│   │   ├── app/         # Next.js 14 App Router pages
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts (Auth, etc.)
│   │   ├── lib/         # API client, utilities
│   │   └── tests/       # Test utilities & setup
│   └── package.json
│
├── mobile/              # React Native mobile app
│   └── (planned)
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

7. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev:frontend
   ```

The API will be available at `http://localhost:3000`
The web app will be available at `http://localhost:3001`

### Development Workflow

**Run API server:**
```bash
npm run dev:backend
```

**Run background workers (in separate terminal):**
```bash
npm run dev:worker -w backend
```

> **Note:** Both the API server and background workers must be running for full functionality. Workers process transcription and memo generation jobs.

**Run tests:**
```bash
npm test                    # All workspaces
npm run test:backend        # Backend only
npm run test:frontend       # Frontend only
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
  - Backend: 80% overall (55+ tests)
  - Frontend: 70% overall (47+ tests)
  - Security-critical code: 100% (auth, payments)

**Test Stack:**
- Vitest (unit & integration tests)
- Testcontainers (real PostgreSQL/Redis in backend tests)
- React Testing Library (component tests)
- Playwright (E2E tests - planned)
- Promptfoo (LLM evaluation - planned)

**Current Test Coverage:**
- ✅ Backend: 55+ tests covering auth, memos, AI services
- ✅ Frontend: 47 tests covering UI components and integration
- ✅ CI/CD: Automated testing on every PR

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

### Memo Endpoints

```
POST   /api/memos                      - Create new memo
POST   /api/memos/:id/audio            - Upload audio file
POST   /api/memos/:id/audio/upload-url - Get presigned upload URL
GET    /api/memos                      - List user's memos
GET    /api/memos/:id                  - Get single memo with transcript
PATCH  /api/memos/:id                  - Update memo
DELETE /api/memos/:id                  - Delete memo
GET    /api/memos/:id/audio/download-url - Get audio download URL
```

### Example: Create Memo and Upload Audio

**Step 1: Create memo**
```bash
curl -X POST http://localhost:3000/api/memos \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Standup - Dec 15",
    "participants": ["Alice", "Bob", "Charlie"]
  }'
```

Response:
```json
{
  "memo": {
    "id": "clx...",
    "title": "Team Standup - Dec 15",
    "status": "UPLOADING",
    "participants": ["Alice", "Bob", "Charlie"],
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Step 2: Upload audio file**
```bash
curl -X POST http://localhost:3000/api/memos/clx.../audio \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@meeting-audio.mp3"
```

Response:
```json
{
  "message": "Audio uploaded successfully. Transcription started.",
  "audioUrl": "https://s3.amazonaws.com/bucket/memos/clx.../audio.mp3"
}
```

**Step 3: Check memo status**

The system automatically:
1. Transcribes audio using OpenAI Whisper
2. Generates structured memo using GPT-4
3. Updates status: UPLOADING → TRANSCRIBING → GENERATING → COMPLETED

```bash
curl -X GET http://localhost:3000/api/memos/clx... \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response (when completed):
```json
{
  "memo": {
    "id": "clx...",
    "title": "Team Standup - Dec 15",
    "status": "COMPLETED",
    "duration": 1200,
    "memoContent": {
      "summary": "Team discussed Q1 goals and project deadlines.",
      "keyPoints": [
        "Launch date set for March 15th",
        "Need additional resources for frontend team"
      ],
      "actionItems": [
        {
          "task": "Hire 2 frontend developers",
          "owner": "Alice",
          "dueDate": "2024-02-01",
          "priority": "high"
        }
      ],
      "decisions": [
        "Approved budget increase for Q1"
      ]
    },
    "transcript": {
      "text": "Full transcript text...",
      "language": "en"
    }
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

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions including:
- Railway backend deployment
- Vercel frontend deployment
- Environment configuration
- CI/CD setup with GitHub Actions
- Monitoring and scaling strategies

## Contributing

1. Follow TDD methodology (tests before code)
2. Maintain test coverage thresholds
3. Run linting and type-checking before commits
4. Write clear commit messages
5. Update documentation for new features

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## License

MIT

## Support

For issues and questions, please open a GitHub issue.