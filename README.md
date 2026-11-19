# ABES Flix

A full-stack streaming platform inspired by Netflix. Built with Node.js, Express, and AWS DynamoDB.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (vanilla, no frameworks)
- **Backend**: Node.js, Express
- **Database**: AWS DynamoDB (on-demand, region `ap-south-1`)
- **Auth**: bcrypt password hashing, JWT-based sessions

## Project Structure

```
abes-flix/
  server.js              Express backend (auth APIs, static file serving)
  package.json           Dependencies and scripts
  public/
    index.html           Landing page (Netflix-style hero, features, FAQ accordion)
    login.html           Sign-in page (floating labels, credentials verification)
    signup.html          Registration page (strength indicator, validation)
    home.html            Streaming dashboard (billboard hero, category rows)
```

## Prerequisites

- Node.js v18 or higher
- AWS CLI configured with active credentials
- AWS account with DynamoDB permissions in `ap-south-1`

## Setup

### 1. Create the DynamoDB table

```bash
aws dynamodb create-table \
  --table-name AbesFlixUsers \
  --attribute-definitions AttributeName=email,AttributeType=S \
  --key-schema AttributeName=email,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
npm start
```

The app runs at `http://localhost:3002`.

## API Endpoints

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| POST | `/api/signup` | Register a new user | No |
| POST | `/api/login` | Authenticate existing user | No |
| GET | `/api/me` | Fetch authenticated user profile | Yes (Bearer token) |

### Signup Request

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}
```

### Login Request

```json
{
  "email": "jane@example.com",
  "password": "securepassword"
}
```

### Response (both signup and login)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "email": "jane@example.com",
    "fullName": "Jane Doe"
  }
}
```

## Database Schema

**Table**: `AbesFlixUsers`

| Field | Type | Description |
|-------|------|-------------|
| email | String (PK) | User email address |
| password | String | bcrypt-hashed password |
| fullName | String | User display name |
| createdAt | String | ISO 8601 timestamp |

## Auth Flow

1. User registers via the signup form with full name, email, and password.
2. Server verifies input criteria and hashes the password using bcrypt (12 rounds).
3. Record is written to DynamoDB table `AbesFlixUsers`.
4. Server issues a signed JWT token (7-day validity).
5. Token and user profile details are stored in `localStorage`.
6. Subsequent protected views check token validity against `/api/me`.
7. Sign out removes credentials from `localStorage` and redirects to the landing page.

## Pages

- **Landing** (`/`) -- Netflix-inspired theme, hero email CTA, device highlights, and interactive FAQ accordion.
- **Sign In** (`/login.html`) -- Dark card layout with floating input labels and error messaging.
- **Sign Up** (`/signup.html`) -- Account setup form with real-time password strength meter.
- **Dashboard** (`/home.html`) -- Billboard hero player preview, dynamic category rows, original titles, and account controls.

## License

MIT
