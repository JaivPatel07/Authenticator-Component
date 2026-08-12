# Setup Guide for Django + React Authenticator

This guide will help you set up the backend and frontend for the authentication project. Everything is explained in simple words so anyone can follow along!

## 1. Setting up the Backend (Django)

The backend is responsible for storing user data and managing security (like verifying passwords).

1. **Open the `backend` folder** in your terminal.
2. **Create a virtual environment**: This keeps all the Python packages needed for this project separate from your computer's system.
   ```bash
   python -m venv .venv
   ```
3. **Activate the virtual environment**:
   - On Windows: `.venv\Scripts\activate`
   - On Mac/Linux: `source .venv/bin/activate`
4. **Install the required packages**:
   ```bash
   pip install -r requirements.txt
   ```
5. **Set up the Environment Variables**: 
   - Rename the `.env.example` file to `.env`.
   - Open it and change the values if needed (especially `SECRET_KEY` for production).
6. **Run Database Migrations**: This will create the necessary tables in your database (like `users` table).
   ```bash
   python manage.py migrate
   ```
7. **Start the server**:
   ```bash
   python manage.py runserver
   ```
   *Your backend is now running at http://localhost:8000!*

## 2. Setting up the Frontend (React)

The frontend is what the user sees in the browser.

1. **Open the `frontend` folder** in a new terminal window.
2. **Install node modules**:
   ```bash
   npm install
   ```
3. **Set up the Environment Variables**:
   - Rename the `.env.example` file to `.env`.
   - Make sure `VITE_API_BASE_URL` points to your backend URL (usually `http://localhost:8000/api/`).
4. **Start the React app**:
   ```bash
   npm run dev
   ```
   *Your frontend is now running at http://localhost:5173!*

## 3. How the Signup Component Works

The **Signup Component** (located in `frontend/src/Auth/register.jsx`) allows new users to create an account. Here is a simple breakdown of how it works:

- **State Management**: It remembers what the user typed in (username, email, password) using React's `useState`. It also keeps track of whether it is currently "loading" (talking to the backend) and any success/error messages.
- **Form Submission**: When a user clicks "Register", it first checks if all fields are filled out and if the password is at least 8 characters long.
- **API Call**: If the form is valid, it sends the data securely to the Django backend using our `registerUser` function (located in `frontend/src/api/axios.js`).
- **Redirection**: If the backend says the registration was successful, the component shows a success message and then uses `useNavigate` from `react-router-dom` to automatically redirect the user to the Login page after 2 seconds.
- **Error Handling**: If the backend says something is wrong (like "email already exists"), the component catches the error and displays it beautifully on the screen for the user to see.

## 4. How the Forgot Password Flow Works (and How to Test it Locally)

We added a complete, secure password reset flow. Since this is a local setup, we configured Django to print emails directly to your terminal screen instead of attempting to send a real email.

### How to Test it Locally:
1. Make sure both backend and frontend are running.
2. Go to `http://localhost:5173/login` and click **Forgot password?** (or navigate directly to `http://localhost:5173/forgot-password`).
3. Enter the email address of an account you previously registered, then click **Send Reset Link**.
4. Look at the **terminal/console window where your Django backend is running**. You will see the email printed in text format.
5. Find the link in the printed email text that looks like: `http://localhost:5173/reset-password/MTg/crr68t-1d9c394c8e715201b138e682d3ea964a`.
6. Copy that link and open it in your browser.
7. Enter your new password, click **Reset Password**, and you will be redirected back to the login page after 2 seconds.

## 5. How OTP (2-Factor) Login Works

We added two-step login verification to protect accounts even if someone's password is stolen.

### What happens when you login:
1. Enter your email and password on `/login`. If credentials are correct, the backend generates a random 6-digit code, saves it to the `OTP` database table (expires in 5 minutes), and sends it via email (printed to the backend console in development).
2. The login screen automatically switches to a **6-box OTP verification screen**.
3. Enter the 6-digit code found in your backend console. The boxes auto-advance as you type, and you can also paste the code directly.
4. Click **Verify & Login**. The backend checks the code is valid and unused, marks it as used, and then returns your JWT session tokens — completing the login.

### How to test locally:
1. Go to `http://localhost:5173/login` and enter your credentials.
2. Watch the **backend terminal console** — you will see the OTP printed there.
3. Enter the code in the 6-digit input boxes on screen.
4. You will be logged in and redirected to `/dashboard`.

## 6. How Social Login Works (Google & GitHub)

We added "Continue with Google" and "Continue with GitHub" buttons on the login and register pages. This uses the **OAuth 2.0** protocol.

### Steps to Activate (You Must Do This Once):

**For Google:**
1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Create a project → APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Set **Authorized redirect URI** to: `http://localhost:5173/auth/callback/google`
4. Copy your **Client ID** and **Client Secret**
5. Add them to `backend/.env`: `GOOGLE_CLIENT_ID=...` and `GOOGLE_CLIENT_SECRET=...`
6. Add Client ID to `frontend/.env`: `VITE_GOOGLE_CLIENT_ID=...`

**For GitHub:**
1. Go to [https://github.com/settings/applications/new](https://github.com/settings/applications/new)
2. Set **Authorization callback URL** to: `http://localhost:5173/auth/callback/github`
3. Copy your **Client ID** and **Client Secret**
4. Add them to `backend/.env`: `GITHUB_CLIENT_ID=...` and `GITHUB_CLIENT_SECRET=...`
5. Add Client ID to `frontend/.env`: `VITE_GITHUB_CLIENT_ID=...`

### How it works after setup:
1. User clicks "Continue with Google" → browser is redirected to Google's login page.
2. User approves the access request on Google.
3. Google redirects back to `http://localhost:5173/auth/callback/google?code=XYZ`.
4. React picks up the `code` from the URL, sends it to `POST /api/auth/google/`.
5. Django exchanges the code with Google for the user's email and name.
6. Django finds the user in the database (or creates a new account automatically).
7. Django returns JWT tokens → React saves them and redirects to `/dashboard`.

Enjoy your fully production-ready authenticator with social login!

