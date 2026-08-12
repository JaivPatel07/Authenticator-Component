# Complete Feature Documentation
### Django + React + SQL Authentication System

## Project Overview

This project is a **production-ready Authentication System** built with:
- **Backend**: Python + Django + SQLite (upgradeable to PostgreSQL)
- **Frontend**: React + Vite + JavaScript
- **Authentication**: JWT (JSON Web Tokens) via `djangorestframework-simplejwt`

The system supports **6 ways** a user can authenticate:
1. Standard signup with email & password
2. Login with email & password + OTP (Two-Factor)
3. Forgot Password (email reset link)
4. Continue with Google (OAuth 2.0)
5. Continue with GitHub (OAuth 2.0)
6. Persistent sessions using JWT refresh tokens

---

## All API Endpoints

| Method | Endpoint | What it does | Protected? |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register/` | Create new user account | No |
| `POST` | `/api/login/` | Step 1 of login — validates credentials, sends OTP | No |
| `POST` | `/api/login/verify/` | Step 2 of login — verifies OTP, returns JWT tokens | No |
| `POST` | `/api/logout/` | Blacklists refresh token | Yes |
| `GET` | `/api/user/` | Returns current logged-in user data | Yes |
| `POST` | `/api/token/refresh/` | Gets a new Access Token using Refresh Token | No |
| `POST` | `/api/password-reset/` | Sends password reset link to email | No |
| `POST` | `/api/password-reset-confirm/` | Validates token and updates password | No |
| `POST` | `/api/auth/google/` | Exchanges Google OAuth code for JWT tokens | No |
| `POST` | `/api/auth/github/` | Exchanges GitHub OAuth code for JWT tokens | No |

---

## All Frontend Pages (Routes)

| URL Path | Component File | What it does |
| :--- | :--- | :--- |
| `/login` | `Auth/authenticate.jsx` | Login form (Step 1: credentials, Step 2: OTP) |
| `/register` | `Auth/register.jsx` | Signup form |
| `/forgot-password` | `Auth/ForgotPassword.jsx` | Enter email to receive reset link |
| `/reset-password/:uid/:token` | `Auth/ResetPasswordConfirm.jsx` | Enter new password |
| `/auth/callback/google` | `api/oauth.js (OAuthCallback)` | Handles Google OAuth redirect |
| `/auth/callback/github` | `api/oauth.js (OAuthCallback)` | Handles GitHub OAuth redirect |

---

## Feature 1: User Registration (Signup)

### What it does
Allows a new user to create an account with a username, email, and password.

### Tools used
| Tool | Role |
| :--- | :--- |
| `RegisterSerializer` (DRF) | Validates input, checks for duplicate email/username, hashes password |
| `User.objects.create_user()` | Django method that stores user securely with a hashed password |
| `useState`, `useNavigate` (React) | Manage form state and redirect after success |
| `axios` | Sends the `POST` request to `/api/register/` |

### How data flows
```
[User fills form] → [axios POST /api/register/] → [RegisterSerializer validates] 
  → [User saved to DB] → [201 Response] → [React redirects to /login after 2s]
```

### Files involved
- `frontend/src/Auth/register.jsx` — the signup form UI
- `backend/userauth/views.py` → `registerView` class
- `backend/userauth/serializers.py` → `RegisterSerializer` class

---

## Feature 2: Login with OTP (Two-Factor Authentication)

### What it does
Login is a **two-step process**. First, credentials are verified. Then a 6-digit one-time code is sent to the user's email and must be entered to complete login.

### Tools used
| Tool | Role |
| :--- | :--- |
| `LoginSerializer` | Validates email and password using Django's `authenticate()` |
| `random.randint(100000, 999999)` | Generates the 6-digit OTP code |
| `OTP` model (Django DB) | Stores the OTP with user, code, `created_at`, and `is_used` flag |
| `django.core.mail.send_mail` | Sends OTP email (prints to console in development) |
| `RefreshToken.for_user()` (simplejwt) | Generates JWT tokens after OTP is verified |
| `useRef` (React) | Manages auto-focus between the 6 OTP input boxes |

### How data flows
```
Step 1: [Login Form] → POST /api/login/ → [Validate credentials] → [Generate OTP] 
          → [Save OTP to DB] → [Email OTP] → [Return {otp_required: true}]

Step 2: [OTP boxes filled] → POST /api/login/verify/ → [Find valid OTP in DB] 
          → [Mark OTP as used] → [Return JWT access + refresh tokens]
          → [React saves tokens] → [Redirect to /dashboard]
```

### Files involved
- `frontend/src/Auth/authenticate.jsx` — login + OTP UI (switches between steps)
- `backend/userauth/models.py` → `OTP` model
- `backend/userauth/views.py` → `loginView`, `OTPVerifyView`

---

## Feature 3: Forgot Password (Email Reset Link)

### What it does
Allows a user to reset their password if they forgot it, by receiving a secure link via email.

### Tools used
| Tool | Role |
| :--- | :--- |
| `default_token_generator` (Django) | Creates a cryptographically secure, single-use token |
| `urlsafe_base64_encode(force_bytes(user.pk))` | Encodes the user's ID safely for use in a URL |
| `send_mail()` (Django) | Sends the reset link email |
| `console.EmailBackend` | Development setting — prints email to terminal instead of sending |
| `urlsafe_base64_decode`, `force_str` | Decodes the user ID back from the URL on confirmation |
| `user.set_password(password)` | Securely updates the user's password in the database |
| `useParams` (React) | Reads `uid` and `token` from the URL in `ResetPasswordConfirm.jsx` |

### How data flows
```
[Enter email] → POST /api/password-reset/ → [Generate token + encode uid] 
  → [Email link to user] → [User opens link]
  → POST /api/password-reset-confirm/ {uidb64, token, new_password}
  → [Decode uid, validate token] → [Set new password] → [Redirect to /login]
```

### Files involved
- `frontend/src/Auth/ForgotPassword.jsx` — email input form
- `frontend/src/Auth/ResetPasswordConfirm.jsx` — new password form
- `backend/userauth/views.py` → `RequestPasswordResetView`, `ConfirmPasswordResetView`

---

## Feature 4: Social Login — Google OAuth 2.0

### What it does
Allows users to log in using their existing Google account. No password needed.

### Tools used
| Tool | Role |
| :--- | :--- |
| **Google Cloud Console** | Where you register your app and get `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |
| `getGoogleAuthUrl()` (oauth.js) | Builds the redirect URL to Google's authorization page |
| `urllib.request` (Python stdlib) | Makes HTTP requests to Google's token and userinfo APIs — no extra packages needed |
| `User.objects.get_or_create(email=...)` | Finds existing user or creates a new account automatically |
| `OAuthCallback.jsx` | React component that reads the `?code=` from the URL and calls the backend |

### How data flows
```
[Click "Continue with Google"] → [Redirect to Google OAuth page]
  → [User approves] → [Google redirects to /auth/callback/google?code=XYZ]
  → [OAuthCallback reads code] → POST /api/auth/google/ {code}
  → [Django calls Google token API] → [Get access_token]
  → [Django calls Google userinfo API] → [Get email, name]
  → [get_or_create User in DB] → [Return JWT tokens]
  → [React saves tokens] → [Redirect to /dashboard]
```

### Environment variables needed
```
# Backend .env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Frontend .env
VITE_GOOGLE_CLIENT_ID=...
```

### Files involved
- `frontend/src/api/oauth.js` → `getGoogleAuthUrl()`, `OAuthCallback`
- `frontend/src/api/axios.js` → `googleLogin()`
- `backend/userauth/views.py` → `GoogleLoginView`

---

## Feature 5: Social Login — GitHub OAuth 2.0

### What it does
Allows users to log in using their existing GitHub account. No password needed.

### Tools used
| Tool | Role |
| :--- | :--- |
| **GitHub Developer Settings** | Where you register your app and get `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` |
| `getGitHubAuthUrl()` (oauth.js) | Builds the redirect URL to GitHub's authorization page |
| `urllib.request` | Makes HTTP requests to GitHub's token and user APIs |
| `/user/emails` GitHub API | Fetches user's verified primary email (GitHub users can have private emails) |
| `User.objects.get_or_create(email=...)` | Finds existing user or creates account automatically |

### How data flows
```
[Click "Continue with GitHub"] → [Redirect to GitHub OAuth page]
  → [User approves] → [GitHub redirects to /auth/callback/github?code=XYZ]
  → [OAuthCallback reads code] → POST /api/auth/github/ {code}
  → [Django calls GitHub token API] → [Get access_token]
  → [Django calls GitHub user + emails API] → [Get email, login name]
  → [get_or_create User in DB] → [Return JWT tokens]
  → [React saves tokens] → [Redirect to /dashboard]
```

### Environment variables needed
```
# Backend .env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Frontend .env
VITE_GITHUB_CLIENT_ID=...
```

### Files involved
- `frontend/src/api/oauth.js` → `getGitHubAuthUrl()`, `OAuthCallback`
- `frontend/src/api/axios.js` → `githubLogin()`
- `backend/userauth/views.py` → `GitHubLoginView`

---

## Feature 6: JWT Session Management

### What it does
After any login method (password+OTP or social), the user receives two tokens that keep them logged in without having to login again every 5 minutes.

### Tools used
| Tool | Role |
| :--- | :--- |
| `djangorestframework-simplejwt` | Generates, validates, and blacklists JWT tokens |
| `RefreshToken.for_user(user)` | Creates both the Access and Refresh token for a given user |
| `localStorage` (browser) | Stores tokens client-side in React |
| Axios interceptor in `api.jsx` | Automatically adds `Authorization: Bearer <token>` to every request |
| `AuthContext.jsx` | React context that provides `login()`, `logout()`, and `user` state globally |
| `ProtectedRoute.jsx` | Wrapper component that redirects to `/login` if user is not authenticated |
| `TokenRefreshView` (DRF) | Django endpoint (`/api/token/refresh/`) that returns a new Access Token |

### Token lifetime
| Token | Expires in | Stored in |
| :--- | :--- | :--- |
| Access Token | 5 minutes | `localStorage` |
| Refresh Token | 24 hours | `localStorage` |

---

## All Files Created / Modified

### Backend Files
| File | What was changed |
| :--- | :--- |
| `config/settings.py` | `.env` loader, CORS, JWT settings, email backend, OAuth credentials |
| `userauth/models.py` | Added `OTP` model |
| `userauth/serializers.py` | Existing `RegisterSerializer`, `LoginSerializer`, `UserSerializer` |
| `userauth/views.py` | Added all views: register, login, OTP verify, logout, user, password reset (x2), Google, GitHub |
| `userauth/urls.py` | All 10 API routes registered |
| `requirements.txt` | Created with all backend dependencies |
| `.env.example` | Template for all environment variables |

### Frontend Files
| File | What was changed |
| :--- | :--- |
| `src/api/axios.js` | All API helper functions: register, login, verifyOTP, google/github login, password reset |
| `src/api/oauth.js` | Created: OAuth URL builders + OAuthCallback component |
| `src/services/api.jsx` | Axios instance with dynamic `baseURL` and auth interceptor |
| `src/Auth/authenticate.jsx` | Full rewrite: 2-step login (credentials → OTP) + social buttons |
| `src/Auth/register.jsx` | Added social login buttons + redirect after registration |
| `src/Auth/ForgotPassword.jsx` | Created: email input form for password reset |
| `src/Auth/ResetPasswordConfirm.jsx` | Created: new password entry form |
| `src/Auth/AuthContext.jsx` | login/logout context — unchanged but relied upon |
| `src/Routes.jsx` | Added routes for forgot-password, reset-password, oauth callbacks |
| `.env.example` | Created: template for frontend environment variables |

---

## Database Tables Used

| Table | Fields | Purpose |
| :--- | :--- | :--- |
| `userauth_user` | id, username, email, password (hashed), is_verified, phone_number, updated_at | Stores all users |
| `userauth_otp` | id, user_id, code, created_at, is_used | Stores OTP codes during login |

---

## Environment Variables Reference

### Backend `backend/.env`
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
FRONTEND_URL=http://localhost:5173
```

### Frontend `frontend/.env`
```
VITE_API_BASE_URL=http://localhost:8000/api/
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GITHUB_CLIENT_ID=your-github-client-id
VITE_FRONTEND_URL=http://localhost:5173
```
