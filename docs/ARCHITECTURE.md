# Architecture Documentation

Comprehensive architecture guide for Memo Maker.

## System Overview

Memo Maker is a full-stack application that transforms meeting audio recordings into structured memos using AI.

```
┌─────────────┐
│   Clients   │  (Web App, Mobile Apps)
└──────┬──────┘
       │
       │ HTTPS
       ▼
┌─────────────────────────────────────────┐
│         Load Balancer / CDN             │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐   ┌─────────────┐
│  Next.js    │   │  Fastify    │
│  Frontend   │   │   Backend   │
│  (Vercel)   │   │  (Railway)  │
└─────────────┘   └──────┬──────┘
                         │
            ┌────────────┼───────────┐
            ▼            ▼           ▼
      ┌──────────┐ ┌─────────┐ ┌────────┐
      │PostgreSQL│ │  Redis  │ │  S3    │
      │ Database │ │  Cache  │ │Storage │
      └──────────┘ └─────────┘ └────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │   BullMQ    │
                  │   Workers   │
                  └──────┬──────┘
                         │
                  ┌──────┴───────┐
                  ▼              ▼
            ┌──────────┐   ┌──────────┐
            │ OpenAI   │   │   AWS    │
            │ Whisper  │   │   S3     │
            │   API    │   │          │
            └──────────┘   └──────────┘
```

## Architecture Principles

### 1. Separation of Concerns
- **Frontend**: UI/UX, client state, user interactions
- **Backend API**: Business logic, validation, orchestration
- **Workers**: Long-running tasks, AI processing
- **Data Layer**: PostgreSQL (persistent), Redis (ephemeral)

### 2. Event-Driven Processing
- API receives upload → Enqueues job → Returns immediately
- Workers process asynchronously → Update status
- Frontend polls for updates → Shows real-time progress

### 3. Scalability
- **Stateless API**: Horizontally scalable
- **Worker Pool**: Scale independently based on queue depth
- **Database**: Connection pooling, read replicas (future)
- **Cache**: Redis for session data and job state

### 4. Security-First
- Authentication at every layer
- Encrypted secrets (AWS Secrets Manager in production)
- Rate limiting and DDoS protection
- Input validation and sanitization

## Backend Architecture

### Technology Stack

**Runtime & Framework:**
- Node.js 20 LTS (performance, stability)
- TypeScript 5.x (type safety)
- Fastify 4.x (65k req/sec, 70% faster than Express)

**Data Layer:**
- PostgreSQL 15+ (relational data, ACID compliance)
- Prisma ORM (type-safe queries, migrations)
- Redis 7 (caching, job queue)

**Background Processing:**
- BullMQ (Redis-based job queue)
- Separate worker processes

**External Services:**
- OpenAI Whisper API (transcription)
- OpenAI GPT-4o-mini (memo generation)
- AWS S3 (audio storage)

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         HTTP Layer (Fastify)            │
│  - Routing                              │
│  - Middleware (auth, CORS, rate limit)  │
│  - Request/Response handling            │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│        Service Layer                    │
│  - Business logic                       │
│  - Validation                           │
│  - Authorization                        │
│  - Orchestration                        │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│       Data Access Layer (Prisma)        │
│  - Database queries                     │
│  - Transactions                         │
│  - Relationships                        │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│          Database (PostgreSQL)          │
└─────────────────────────────────────────┘
```

### Service Architecture

**Core Services:**

1. **AuthService** (`src/services/auth.service.ts`)
   - User registration and login
   - JWT token generation and validation
   - Password hashing with bcrypt
   - Refresh token rotation

2. **MemoService** (`src/services/memo.service.ts`)
   - CRUD operations for memos
   - Subscription limit checking
   - Status management
   - Authorization checks

3. **StorageService** (`src/services/storage.service.ts`)
   - S3 upload/download
   - Presigned URL generation
   - File deletion

4. **TranscriptionService** (`src/services/transcription.service.ts`)
   - OpenAI Whisper API integration
   - Audio transcription
   - Cost estimation

5. **MemoGenerationService** (`src/services/memo-generation.service.ts`)
   - GPT-4 prompt engineering
   - Structured output generation
   - Zod schema validation

### Background Worker Architecture

```
┌──────────────────────────────────────────┐
│            Job Queue (Redis)             │
│  ┌────────────┐      ┌────────────┐     │
│  │Transcription│      │    Memo    │     │
│  │   Queue     │      │ Generation │     │
│  │             │      │   Queue    │     │
│  └────────────┘      └────────────┘     │
└────────┬──────────────────┬──────────────┘
         │                  │
    ┌────▼────┐        ┌────▼────┐
    │Transcri-│        │  Memo   │
    │ption    │        │Generation│
    │ Worker  │        │ Worker  │
    │(2 conc.)│        │(3 conc.)│
    └─────────┘        └─────────┘
```

**Worker Process Flow:**

1. **Transcription Worker**:
   ```
   Poll queue → Download audio from S3 →
   Call Whisper API → Save transcript →
   Update usage → Enqueue memo generation job
   ```

2. **Memo Generation Worker**:
   ```
   Poll queue → Fetch transcript →
   Call GPT-4 API → Validate output →
   Save memo content → Update status to COMPLETED
   ```

### Database Schema

**Core Tables:**

```sql
-- Users and authentication
User (id, email, passwordHash, name, role, createdAt)
RefreshToken (id, token, userId, expiresAt)
Subscription (id, userId, tier, monthlyMinutes, minutesUsed)

-- Memos and content
Memo (id, userId, title, date, status, audioUrl, memoContent, ...)
Transcript (id, memoId, text, segments, language)
```

**Indexes:**
- `User.email` (unique)
- `Memo.userId, Memo.date` (composite, DESC)
- `RefreshToken.token` (unique)
- `RefreshToken.expiresAt` (for cleanup)

**Relations:**
```
User ──1:N── Memo
User ──1:1── Subscription
User ──1:N── RefreshToken
Memo ──1:1── Transcript
```

## Frontend Architecture

### Technology Stack

**Framework:**
- Next.js 14 (App Router, React Server Components)
- React 18.2
- TypeScript 5.x

**State Management:**
- React Query (server state, caching, auto-refetch)
- Zustand (client state - planned)
- React Context (auth state)

**Styling:**
- Tailwind CSS (utility-first)
- class-variance-authority (component variants)
- CSS variables for theming

**Forms & Validation:**
- react-hook-form (performant forms)
- Zod (runtime validation)
- @hookform/resolvers (integration)

### Architecture Patterns

**1. Server Components (RSC)**
- Used for static layouts and pages
- Benefits: Smaller bundle, faster initial load
- Example: Layout, metadata

**2. Client Components**
- Interactive UI, hooks, event handlers
- Marked with `'use client'`
- Example: Forms, modals, interactive lists

**3. Context Providers**
- Auth state management
- React Query configuration
- Theme provider (planned)

### Component Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page (redirects to /memos)
│   ├── login/             # Login page
│   ├── register/          # Register page
│   └── (dashboard)/       # Protected route group
│       ├── layout.tsx     # Dashboard layout with nav
│       └── memos/         # Memo pages
│
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── layout/            # Layout components
│   │   ├── Header.tsx
│   │   └── ProtectedRoute.tsx
│   └── memos/             # Feature-specific components
│       └── MemoCard.tsx
│
├── contexts/              # React contexts
│   └── AuthContext.tsx
│
├── lib/
│   ├── api/              # API client
│   │   ├── client.ts     # Type-safe HTTP client
│   │   └── types.ts      # API types
│   └── utils.ts          # Utility functions
│
└── tests/                # Test utilities
    ├── setup.ts          # Test configuration
    └── helpers.tsx       # Test helpers
```

### Data Flow

```
User Action
    │
    ▼
Component Event Handler
    │
    ▼
React Query Mutation
    │
    ▼
API Client (Axios)
    │
    ▼
Backend API
    │
    ▼
API Client Response
    │
    ▼
React Query Cache Update
    │
    ▼
Component Re-render
```

### API Client Design

**Type-Safe Client:**
```typescript
class ApiClient {
  private client: AxiosInstance
  private accessToken: string | null

  // Automatic token injection
  // Automatic error handling
  // Type-safe methods

  async login(data: LoginRequest): Promise<AuthTokens>
  async createMemo(data: CreateMemoRequest): Promise<MemoResponse>
  // ...
}
```

**Features:**
- Axios interceptors for auth and errors
- Automatic token refresh (planned)
- Type safety with TypeScript
- Centralized error handling

## Security Architecture

### Authentication Flow

```
1. User registers/logs in
   └─> Backend validates credentials
       └─> Generates JWT access token (15min)
           └─> Generates refresh token (7 days)
               └─> Returns both to client

2. Client stores tokens in localStorage
   └─> Includes access token in Authorization header

3. Backend validates JWT on protected routes
   └─> Checks signature, expiration
       └─> Extracts user ID from payload
           └─> Attaches user to request object

4. Access token expires
   └─> Client calls /api/auth/refresh
       └─> Backend validates refresh token
           └─> Rotates refresh token
               └─> Returns new access + refresh tokens
```

### Security Measures

**Authentication:**
- bcrypt password hashing (10 rounds)
- JWT with RS256 signing (asymmetric)
- Short-lived access tokens (15 min)
- Refresh token rotation
- Secure token storage

**API Security:**
- Helmet.js (security headers)
- CORS with whitelist
- Rate limiting (100 req/min)
- Input validation with Zod
- SQL injection prevention (Prisma parameterized queries)

**Infrastructure:**
- TLS 1.3 encryption
- Environment variable secrets
- AWS Secrets Manager (production)
- S3 private buckets with presigned URLs
- No credentials in code/git

## Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────┐
│         Vercel Edge Network             │
│  - Next.js Frontend                     │
│  - Global CDN                           │
│  - Automatic HTTPS                      │
└──────────────┬──────────────────────────┘
               │
               │ API Calls
               ▼
┌─────────────────────────────────────────┐
│           Railway Platform              │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Fastify    │  │   Worker     │   │
│  │   Server     │  │   Process    │   │
│  │              │  │              │   │
│  │ (Auto-scale) │  │ (2 replicas) │   │
│  └───────┬──────┘  └──────┬───────┘   │
│          │                 │           │
│  ┌───────▼─────────────────▼───────┐  │
│  │     PostgreSQL Database         │  │
│  │     (Managed, Auto-backup)      │  │
│  └─────────────────────────────────┘  │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │     Redis (Managed)             │  │
│  │     - Job Queue                 │  │
│  │     - Session Cache             │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘

External Services:
- AWS S3 (Audio Storage)
- OpenAI API (AI Processing)
```

### Scaling Strategy

**Horizontal Scaling:**
- API servers: Auto-scale based on CPU/memory
- Workers: Scale based on queue depth
- Database: Read replicas (future)

**Caching Strategy:**
- Redis for session data
- React Query cache on frontend
- S3 + CloudFront CDN for audio (planned)

**Performance Optimizations:**
- Database connection pooling
- Lazy loading on frontend
- Image optimization (Next.js)
- Gzip compression

## Testing Architecture

### Test Pyramid

```
        ┌─────────────┐
        │   E2E Tests │  Planned (Playwright)
        │  (Critical  │
        │    Paths)   │
        └─────────────┘
       ┌───────────────┐
       │  Integration  │   React Query + Components
       │     Tests     │   Auth Flow, Memo Creation
       └───────────────┘
      ┌─────────────────┐
      │   Unit Tests    │    UI Components, Services
      │   (55 backend   │    Business Logic
      │   47 frontend)  │
      └─────────────────┘
```

### Testing Strategy

**Backend:**
- Vitest for unit/integration
- Testcontainers for real PostgreSQL/Redis
- Supertest for API endpoint testing
- Coverage: 80% overall, 100% auth

**Frontend:**
- Vitest + jsdom environment
- React Testing Library
- Mock API client
- Coverage: 70% overall

**CI/CD:**
- GitHub Actions on every PR
- Parallel test execution
- Automated coverage reporting

## Monitoring & Observability

### Logging

**Structured Logging (Pino):**
```typescript
logger.info({
  userId,
  memoId,
  duration
}, 'Memo transcription completed')
```

**Log Levels:**
- `error`: Errors requiring attention
- `warn`: Warnings, degraded performance
- `info`: Important events
- `debug`: Detailed debug info (dev only)

### Metrics (Planned)

- Request latency (p50, p95, p99)
- Error rates by endpoint
- Queue depth and processing time
- AI API costs and usage
- Database query performance

### Monitoring Stack (Planned)

- Sentry (error tracking)
- Railway metrics (infra monitoring)
- Custom dashboard (usage analytics)

## Future Architecture Enhancements

### Phase 2: Mobile Apps
- React Native with Expo
- Shared API client with web
- Native audio recording
- Offline support

### Phase 3: Real-time Features
- WebSocket support
- Live transcription
- Real-time collaboration

### Phase 4: Advanced Features
- Self-hosted Whisper (cost optimization)
- Multi-language support
- Custom AI model fine-tuning
- Team workspaces

## References

- [API Documentation](./API.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
