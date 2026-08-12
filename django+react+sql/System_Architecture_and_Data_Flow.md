# System Architecture, Packages, and Data Flow Guide

This document explains **what** we installed, **why** we installed it, and **how** data transfers back and forth between your React frontend and Django backend.

---

## 1. Summary of What We Did (Our Work)
We upgraded a basic authentication component into a fully production-ready setup with:
* **Securing Settings**: Removed hardcoded passwords/keys from code into a `.env` file.
* **Dynamically Linking Frontend**: API base URL loaded from environment variables.
* **Signup with Redirect**: Signup redirects to login automatically after 2 seconds.
* **Forgot Password**: Secure token-based email reset link flow.
* **OTP Two-Factor Login**: 6-digit code sent via email on every login for extra security.
* **Social Login**: OAuth 2.0 login with Google and GitHub.
* **Documentation**: Comprehensive setup and architecture guides.

---

## 2. What We Installed & Why

| Package | What it does (in simple terms) | Why we need it |
| :--- | :--- | :--- |
| **Django** | The web framework | The core engine of our backend server. |
| **djangorestframework** | Django REST Framework (DRF) | Helps us build clean APIs that return JSON data. |
| **djangorestframework-simplejwt** | JWT Token handler | Issues secure access + refresh tokens after login. |
| **django-cors-headers** | CORS Manager | Allows React (port 5173) to call Django (port 8000) without browser security blocks. |
| **gunicorn** | Production Web Server | Replaces Django's dev server for production deployments. |
| **psycopg2-binary** | PostgreSQL adapter | Allows switching from SQLite to PostgreSQL in production. |

**Frontend packages used:**
| Package | What it does |
| :--- | :--- |
| **axios** | Sends HTTP requests from React to Django; also handles auth headers via interceptors. |
| **react-router-dom** | Manages page routing (`/login`, `/register`, `/forgot-password`, etc.). |

---

## 3. How Data Transfers (Data Flow)

### A. The Signup Flow (Registration)
1. User fills `register.jsx` form and clicks "Register".
2. Frontend validates fields and password length.
3. `POST /api/register/` is sent with `{username, email, password}`.
4. Django serializer validates, hashes the password, and saves a new `User` row.
5. Returns `201 Created` → React shows success and redirects to `/login` after 2s.

```
[Register Form] ──POST──> [Django RegisterView] ──> [RegisterSerializer] ──> [DB: User table]
                                                                                      │
[Redirect to /login] <── [React setState] <── [201 JSON Response] <───────────────────┘
```

---

### B. The Forgot Password Flow
1. User enters email on `/forgot-password`.
2. `POST /api/password-reset/` → Django generates a token using `default_token_generator` + encodes user ID as `uidb64`.
3. Email is sent (console output in dev) with link: `/reset-password/<uidb64>/<token>`.
4. User opens link → `ResetPasswordConfirm.jsx` mounts, reads `uid` + `token` from URL.
5. User enters new password → `POST /api/password-reset-confirm/` with `{uidb64, token, password}`.
6. Django decodes the ID, validates the token, hashes the new password and saves it.
7. React redirects to `/login`.

---

### C. The OTP Two-Factor Login Flow
1. User enters email + password on `/login`.
2. `POST /api/login/` → Django validates credentials, generates a random 6-digit OTP.
3. OTP is saved in the `OTP` database table with `is_used=False` and `created_at` timestamp.
4. Email is sent (console output in dev) with the OTP code.
5. Backend returns `{otp_required: true, email}` — **no JWT tokens yet**.
6. React switches the login screen to a 6-box OTP input UI.
7. User enters code → `POST /api/login/verify/` with `{email, otp}`.
8. Django finds OTP record, checks it is unused and within 5 minutes, marks it as used.
9. Django returns JWT tokens → React saves them and redirects to `/dashboard`.

```
[Login Form] ──POST──> [loginView] ──generates──> [OTP record in DB] ──emails──> [Console/Email]
                            │
                    {otp_required: true}
                            │
                    [OTP Verify Form] ──POST──> [OTPVerifyView] ──validates──> [OTP DB record]
                                                                                       │
                    [Redirect /dashboard] <── [Save tokens] <── [JWT tokens returned] ─┘
```

---

### D. The Social Login Flow (Google / GitHub OAuth 2.0)
1. User clicks "Continue with Google" → browser is redirected to Google's OAuth page.
2. User approves access on Google/GitHub.
3. Provider redirects back to `/auth/callback/google?code=XYZ`.
4. `OAuthCallback.jsx` reads `code` from URL → calls `POST /api/auth/google/` with `{code}`.
5. Django uses Python's `urllib` to call Google's token endpoint and exchange the code for an access token.
6. Django calls Google's user info API to get the user's email and name.
7. Django does `User.objects.get_or_create(email=...)` — finds existing user or auto-creates one.
8. Django returns JWT tokens → React saves them and redirects to `/dashboard`.

```
[Click Google Button] ──redirect──> [Google OAuth Page] ──(user approves)──> [Google redirects with ?code=]
                                                                                            │
[Redirect /dashboard] <── [Save JWT tokens] <── [GET user info] <── [Django exchanges code]
```

---

## 4. How JWT Authentication Works (Token Exchange)

After login (via password+OTP or social), the user receives two tokens:

| Token | Lifetime | Purpose |
| :--- | :--- | :--- |
| **Access Token** | 5 minutes | Sent in every API request header to prove identity |
| **Refresh Token** | 24 hours | Used to silently get a new Access Token when it expires |

Every API request made by React automatically attaches the Access Token via an Axios interceptor:
```http
Authorization: Bearer <your_access_token>
```
Django's `JWTAuthentication` middleware validates this token on every protected route. If expired or invalid, it returns `401 Unauthorized`.
