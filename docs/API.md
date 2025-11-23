# API Documentation

Complete API reference for Memo Maker backend.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-api.railway.app`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Access tokens expire after 15 minutes. Use the refresh token to obtain a new access token.

## Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

## Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_ERROR` | 401 | Invalid or expired token |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_ERROR` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SUBSCRIPTION_LIMIT_EXCEEDED` | 403 | Monthly usage limit reached |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Validation:**
- Email: Valid email format
- Password: Minimum 8 characters
- Name: Optional, max 200 characters

**Response:** `201 Created`
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "clx_1234...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Notes:**
- Automatically creates a FREE subscription with 120 minutes/month
- User is automatically logged in after registration
- Password is hashed with bcrypt (10 rounds)

---

### Login

Authenticate user and receive tokens.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
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

**Error Responses:**
- `401 AUTHENTICATION_ERROR`: Invalid credentials

---

### Refresh Access Token

Get a new access token using a refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "clx_1234..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "clx_5678...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

**Notes:**
- Old refresh token is automatically rotated (invalidated)
- Refresh tokens expire after 7 days

---

### Logout

Revoke a refresh token.

**Endpoint:** `POST /api/auth/logout`
**Authentication:** Required

**Request Body:**
```json
{
  "refreshToken": "clx_1234..."
}
```

**Response:** `204 No Content`

---

### Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /api/auth/me`
**Authentication:** Required

**Response:** `200 OK`
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "subscription": {
      "tier": "FREE",
      "monthlyMinutes": 120,
      "minutesUsed": 45
    }
  }
}
```

---

### Change Password

Change user's password.

**Endpoint:** `POST /api/auth/change-password`
**Authentication:** Required

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response:** `204 No Content`

**Error Responses:**
- `401 AUTHENTICATION_ERROR`: Current password incorrect
- `400 VALIDATION_ERROR`: New password doesn't meet requirements

---

## Memo Endpoints

### Create Memo

Create a new memo (without audio).

**Endpoint:** `POST /api/memos`
**Authentication:** Required

**Request Body:**
```json
{
  "title": "Team Standup - Dec 15",
  "date": "2024-01-15T10:00:00.000Z",
  "participants": ["Alice", "Bob", "Charlie"]
}
```

**Validation:**
- Title: Required, 1-200 characters
- Date: Optional, ISO 8601 format
- Participants: Optional, array of strings

**Response:** `201 Created`
```json
{
  "memo": {
    "id": "clx...",
    "userId": "clx...",
    "title": "Team Standup - Dec 15",
    "date": "2024-01-15T10:00:00.000Z",
    "duration": null,
    "participants": ["Alice", "Bob", "Charlie"],
    "audioUrl": null,
    "audioStorageKey": null,
    "status": "UPLOADING",
    "memoContent": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `403 SUBSCRIPTION_LIMIT_EXCEEDED`: Monthly minutes limit reached

---

### Upload Audio

Upload audio file for transcription.

**Endpoint:** `POST /api/memos/:memoId/audio`
**Authentication:** Required
**Content-Type:** `multipart/form-data`

**Request:**
- Field name: `file`
- Supported formats: MP3, WAV, M4A, MP4
- Max size: 100 MB

**Response:** `200 OK`
```json
{
  "message": "Audio uploaded successfully. Transcription started.",
  "audioUrl": "https://s3.amazonaws.com/.../audio.mp3"
}
```

**Notes:**
- Automatically triggers background transcription job
- Status changes: UPLOADING → TRANSCRIBING
- Audio is stored in S3

**Error Responses:**
- `404 NOT_FOUND`: Memo not found
- `403 AUTHORIZATION_ERROR`: Not memo owner
- `400 VALIDATION_ERROR`: Invalid file type or size

---

### Get Presigned Upload URL

Get presigned URL for direct S3 upload (alternative to multipart upload).

**Endpoint:** `POST /api/memos/:memoId/audio/upload-url`
**Authentication:** Required

**Response:** `200 OK`
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "key": "memos/clx.../audio-1234567890.mp3"
}
```

**Notes:**
- URL expires in 1 hour
- Client uploads directly to S3 using PUT request
- More efficient for large files

---

### List Memos

Get user's memos with optional filtering.

**Endpoint:** `GET /api/memos`
**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status (UPLOADING, TRANSCRIBING, GENERATING, COMPLETED, FAILED)
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Sort field (date, createdAt, updatedAt)
- `sortOrder` (optional): asc or desc (default: desc)

**Example:**
```
GET /api/memos?status=COMPLETED&limit=10&sortBy=date&sortOrder=desc
```

**Response:** `200 OK`
```json
{
  "memos": [
    {
      "id": "clx...",
      "title": "Team Standup - Dec 15",
      "date": "2024-01-15T10:00:00.000Z",
      "duration": 1200,
      "participants": ["Alice", "Bob"],
      "status": "COMPLETED",
      "memoContent": {
        "summary": "Brief summary...",
        "keyPoints": ["Point 1", "Point 2"],
        "actionItems": [...],
        "decisions": [...]
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### Get Memo

Get single memo with full details.

**Endpoint:** `GET /api/memos/:memoId`
**Authentication:** Required

**Response:** `200 OK`
```json
{
  "memo": {
    "id": "clx...",
    "userId": "clx...",
    "title": "Team Standup - Dec 15",
    "date": "2024-01-15T10:00:00.000Z",
    "duration": 1200,
    "participants": ["Alice", "Bob", "Charlie"],
    "audioUrl": "https://s3.amazonaws.com/.../audio.mp3",
    "status": "COMPLETED",
    "memoContent": {
      "summary": "Team discussed Q1 goals and project deadlines...",
      "keyPoints": [
        "Launch date set for March 15th",
        "Need additional resources for frontend team",
        "Budget approved for new hires"
      ],
      "actionItems": [
        {
          "task": "Hire 2 frontend developers",
          "owner": "Alice",
          "dueDate": "2024-02-01",
          "priority": "high"
        },
        {
          "task": "Prepare Q1 roadmap presentation",
          "owner": "Bob",
          "dueDate": "2024-01-20",
          "priority": "medium"
        }
      ],
      "decisions": [
        "Approved budget increase for Q1",
        "Decided to use React for new features"
      ],
      "nextSteps": [
        "Schedule interviews with frontend candidates",
        "Review roadmap with stakeholders"
      ]
    },
    "transcript": {
      "id": "clx...",
      "memoId": "clx...",
      "text": "Full transcript text...",
      "segments": [
        {
          "id": 0,
          "start": 0.0,
          "end": 5.2,
          "text": "Good morning everyone, let's get started."
        },
        {
          "id": 1,
          "start": 5.2,
          "end": 12.8,
          "text": "First item on the agenda is the Q1 launch date."
        }
      ],
      "language": "en"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `404 NOT_FOUND`: Memo not found
- `403 AUTHORIZATION_ERROR`: Not memo owner

---

### Update Memo

Update memo metadata.

**Endpoint:** `PATCH /api/memos/:memoId`
**Authentication:** Required

**Request Body:**
```json
{
  "title": "Updated Title",
  "participants": ["Alice", "Bob", "Dave"]
}
```

**Response:** `200 OK`
```json
{
  "memo": {
    "id": "clx...",
    "title": "Updated Title",
    "participants": ["Alice", "Bob", "Dave"],
    ...
  }
}
```

**Notes:**
- Cannot update: status, audioUrl, memoContent, transcript
- Only title, date, and participants can be updated

---

### Delete Memo

Delete a memo and associated audio.

**Endpoint:** `DELETE /api/memos/:memoId`
**Authentication:** Required

**Response:** `204 No Content`

**Notes:**
- Deletes memo, transcript, and audio from S3
- Action is irreversible

---

### Get Audio Download URL

Get presigned URL to download audio file.

**Endpoint:** `GET /api/memos/:memoId/audio/download-url`
**Authentication:** Required

**Response:** `200 OK`
```json
{
  "downloadUrl": "https://s3.amazonaws.com/...",
  "expiresAt": "2024-01-15T11:00:00.000Z"
}
```

**Notes:**
- URL expires in 1 hour
- Returns 404 if memo has no audio

---

## Memo Status Flow

```
UPLOADING ──> TRANSCRIBING ──> GENERATING ──> COMPLETED
    │
    └──────────> FAILED (if any step fails)
```

**Status Descriptions:**
- `UPLOADING`: Initial state, waiting for audio upload
- `TRANSCRIBING`: Audio is being transcribed by OpenAI Whisper
- `GENERATING`: Memo content is being generated by GPT-4
- `COMPLETED`: Processing complete, memo ready
- `FAILED`: Processing failed (see errorMessage field)

---

## Rate Limiting

**Limits:**
- 100 requests per minute per IP
- Returns `429 RATE_LIMIT_EXCEEDED` when exceeded
- Rate limit headers included in response:
  - `X-RateLimit-Limit`: Maximum requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Pagination

List endpoints support pagination with these query parameters:

- `limit`: Number of results (default: 20, max: 100)
- `offset`: Number of results to skip (default: 0)

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "hasMore": true
  }
}
```

---

## Webhooks (Planned)

Future feature to receive notifications when memo processing completes.

---

## API Versioning

Current version: `v1` (implicit)

Future versions will be prefixed: `/api/v2/...`

---

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Create memo
curl -X POST http://localhost:3000/api/memos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Meeting","participants":["Alice","Bob"]}'

# Upload audio
curl -X POST http://localhost:3000/api/memos/MEMO_ID/audio \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@audio.mp3"
```

### Using Postman

Import the Postman collection (coming soon) for easy API testing.

---

## Support

For API issues:
- Check the [Troubleshooting Guide](../DEPLOYMENT.md#troubleshooting)
- Review [error codes](#common-error-codes)
- Open a GitHub issue
