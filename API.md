# PasteBin REST API Documentation

The PasteBin platform provides a complete RESTful API to programmatically create, retrieve, search, and manage code and text snippets with workspace and company domain scoping.

## Base URL
```
http://localhost:4000/api
```

## Authentication

All snippet endpoints require a valid Supabase Bearer token passed in the `Authorization` header:

```http
Authorization: Bearer <YOUR_SESSION_TOKEN>
```

### CLI Quick Login
Use the interactive CLI tool:
```bash
$ ./bin/pastebin login
Email: dev@company.com
Password: ••••••••••••
```

---

## Endpoints

### 1. User Login (for CLI / Scripts)
**Endpoint:** `POST /api/auth/login`  
**Content-Type:** `application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | User email address |
| `password` | `string` | **Yes** | Account password |

#### Sample Response (`200 OK`)
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": "uuid-1234",
    "email": "dev@company.com",
    "organization_id": "domain:company.com"
  }
}
```

---

### 2. Create a Paste
**Endpoint:** `POST /api/pastes`  
**Headers:** `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `content` | `string` | **Yes** | The snippet text or code (Max 500KB) |
| `title` | `string` | No | Snippet title (Default: `"Untitled Snippet"`) |
| `language` | `string` | No | Syntax highlighting: `"plaintext"`, `"cpp"`, `"python"`, `"java"`, `"javascript"`, `"html"`, `"sql"` |
| `ttl` | `string` | No | Expiration period: `"10m"`, `"1h"`, `"1d"`, `"1w"`, `"1m"`, `"never"` |
| `burn_after_reading` | `boolean` | No | If `true`, deletes paste immediately after 1 view |
| `is_private` | `boolean` | No | If `true`, hides paste from public Explore listing |
| `password` | `string` | No | Protect paste with a password (hashed with bcrypt) |
| `custom_id` | `string` | No | Custom short URL slug (3-32 alphanumeric characters, hyphens, underscores) |

#### Sample Response (`201 Created`)
```json
{
  "success": true,
  "paste": {
    "id": "a7x9q2",
    "title": "Notes Snippet",
    "content": "console.log('Hello World');",
    "language": "javascript",
    "is_private": false,
    "burn_after_reading": false,
    "is_password_protected": false,
    "expires_at": "2026-08-21T16:00:00.000Z",
    "delete_token": "f9a8b7c6d5e4f3a2b1c0d9e8",
    "url": "http://localhost:4000/paste/a7x9q2",
    "raw_url": "http://localhost:4000/api/pastes/a7x9q2/raw"
  }
}
```

---

### 3. Retrieve Paste Metadata & Content
**Endpoint:** `GET /api/pastes/:id`  
**Headers:** `Authorization: Bearer <TOKEN>`

#### Request Headers / Query Params
| Header / Query Param | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `x-paste-password` (Header) or `password` (Query) | `string` | Optional | Required only if paste is password protected |

---

### 4. Retrieve Raw Text Content
**Endpoint:** `GET /api/pastes/:id/raw`  
**Headers:** `Authorization: Bearer <TOKEN>`  
**Response Format:** `text/plain; charset=utf-8`

Ideal for command line tools (`curl`, `wget`) and shell piping:
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:4000/api/pastes/a7x9q2/raw
```

---

### 5. List Public Snippets
**Endpoint:** `GET /api/pastes`  
**Headers:** `Authorization: Bearer <TOKEN>`

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `page` | `number` | No | Page number (Default: `1`) |
| `limit` | `number` | No | Items per page (Default: `100`, Max: `500`) |
| `search` | `string` | No | Filter pastes by title or content substring |

---

### 6. Delete Paste
**Endpoint:** `DELETE /api/pastes/:id`  
**Headers:** `Authorization: Bearer <TOKEN>`, `x-delete-token: <SECRET_TOKEN>`

---

### 7. Health Check
**Endpoint:** `GET /api/health`
```json
{
  "status": "ok",
  "timestamp": "2026-08-20T12:00:00.000Z"
}
```
