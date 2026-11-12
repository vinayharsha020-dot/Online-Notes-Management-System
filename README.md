# Online Notes Management System

A web application for students to create, organize, update, and delete study notes, and upload or download study materials. The project uses a React frontend, an Express/Node.js backend, and Supabase for authentication, database storage, and file storage.

## Contents

- [Features](#features)
- [Technology stack: tool name and use](#technology-stack-tool-name-and-use)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Supabase setup](#supabase-setup)
- [Run the project on a new device](#run-the-project-on-a-new-device)
- [Quick execution: commands only](#quick-execution-commands-only)
- [Available commands](#available-commands)
- [API routes](#api-routes)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)

## Features

- Student registration and login using Supabase Authentication.
- Create, view, edit, and delete text notes.
- Organize notes by subject and category.
- Upload study materials in PDF, DOC, DOCX, TXT, JPG, and PNG formats (maximum 10 MB per file).
- Download uploaded materials using a temporary signed URL.
- User-specific note access, enforced through authenticated requests and Supabase Row Level Security (RLS).
- Responsive React interface with page navigation.

## Technology stack: tool name and use

| Tool / library | Where it is used | Why it is used |
|---|---|---|
| HTML5 | Frontend | Provides the basic structure of the web pages. |
| CSS3 | Frontend | Styles the pages, forms, dashboard, and responsive layout. |
| JavaScript | Frontend and backend | Implements application behaviour and server-side logic. |
| React | Frontend | Builds the user interface from reusable components. |
| React DOM | Frontend | Displays React components in the browser. |
| Vite | Frontend | Runs the development server and creates the production build. |
| React Router DOM | Frontend | Handles navigation between login, registration, dashboard, and note pages without full page reloads. |
| Axios | Frontend | Sends HTTP requests from the React application to the backend API. |
| Framer Motion | Frontend | Adds interface animations. |
| Lucide React | Frontend | Provides icons for the interface. |
| Node.js | Backend runtime | Runs JavaScript outside the browser. |
| Express | Backend | Creates the API server and defines routes for authentication and notes. |
| CORS | Backend | Allows the browser frontend (running on a different local port) to call the backend. |
| dotenv | Backend | Loads configuration values from the backend `.env` file. |
| Multer | Backend | Receives uploaded files and temporarily holds them in memory before sending them to Supabase Storage. |
| Supabase | Cloud service | Provides user authentication, PostgreSQL database, and file storage. |
| `@supabase/supabase-js` | Frontend and backend | Connects JavaScript code to Supabase services. |
| Nodemon | Backend development | Automatically restarts the backend when server files change. It is used by the `npm run dev` command. |

## Project structure

```text
Online-Notes-Management-System/
├── backend/
│   ├── config/             # Supabase client configuration
│   ├── controllers/        # Authentication and notes business logic
│   ├── middleware/         # Authentication checks and file upload validation
│   ├── routes/             # Backend API route definitions
│   ├── .env.example        # Example backend environment variables
│   ├── package.json        # Backend dependencies and commands
│   └── server.js           # Express server entry point
│
├── frontend/
│   ├── public/             # Static public assets
│   ├── src/
│   │   ├── assets/         # Images and other frontend assets
│   │   ├── config/         # Supabase frontend client
│   │   ├── context/        # Authentication state/context
│   │   ├── pages/          # Login, registration, dashboard, and note pages
│   │   ├── services/       # Axios API configuration
│   │   ├── App.jsx         # Main application and routes
│   │   └── main.jsx        # React entry point
│   ├── package.json        # Frontend dependencies and commands
│   └── vite.config.js      # Vite configuration
│
└── README.md
```

## Requirements

Install these on the new computer:

1. **Node.js (22 LTS recommended)** — includes npm, which installs JavaScript libraries and runs the project scripts. Use a Node.js version compatible with the installed Vite release (Node.js 20.19+ or 22.12+).
2. **Git** — only needed if you clone the project from GitHub.
3. **A Supabase account and project** — the application relies on Supabase for authentication, the `notes` table, and the `note-materials` Storage bucket.
4. **A code editor** such as Visual Studio Code (recommended, but optional).
5. **A modern browser** such as Chrome, Edge, or Firefox.

You do not need to install React, Express, Axios, or the other project libraries globally. The `npm install` commands below install them locally from each `package.json` file.

## Supabase setup

The application needs a Supabase project configured before it can run fully.

### 1. Create a Supabase project

- Create a project in the Supabase dashboard.
- Open **Project Settings → API** (or the API keys section in the current dashboard).
- Copy the project URL and the **publishable key** (or legacy `anon` key). The code reads these values as `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- Do not use a `service_role` or secret key in either environment file.

### 2. Create the `notes` table

Open **SQL Editor** in the Supabase dashboard and run the following SQL to create the table and user-level access policies expected by the backend:

```sql
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subject text not null,
  content text not null default '',
  category text default 'General',
  note_type text not null default 'text',
  file_name text,
  file_path text,
  file_size bigint,
  mime_type text,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Users can view their own notes"
on public.notes for select to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own notes"
on public.notes for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own notes"
on public.notes for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own notes"
on public.notes for delete to authenticated
using (auth.uid() = user_id);
```

If you already have a `notes` table, compare its columns and policies before running this SQL. Do not create a second table with a different schema.

### 3. Create the Storage bucket

- Open **Storage** in Supabase.
- Create a bucket named exactly `note-materials`.
- Keep it **Private**. The backend creates short-lived signed download URLs.
- Add the following Storage policies (or equivalent policies in the Storage policy editor) so authenticated users can manage files only inside their own user-ID folder:

```sql
create policy "Users can upload files to their own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'note-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read files in their own folder"
on storage.objects for select to authenticated
using (
  bucket_id = 'note-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete files in their own folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'note-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

The backend uploads files under a path beginning with the signed-in user's Supabase user ID. These policies restrict access to that user's folder.

### 4. Configure email authentication

The registration endpoint uses Supabase email/password sign-up. Depending on your Supabase Authentication settings, users may need to verify their email before logging in. Configure the project's site URL and allowed redirect URLs in Supabase Authentication settings if you use email confirmation or password-reset links.

## Run the project on a new device

### Step 1: Get the source code

Either clone the GitHub repository:

```bash
git clone https://github.com/vinayharsha020-dot/Online-Notes-Management-System.git
cd Online-Notes-Management-System
```

Or download the repository ZIP from GitHub and extract it. Open a terminal in the extracted project root (the folder containing `backend` and `frontend`).

### Step 2: Install Node.js

Install Node.js 22 LTS from the official Node.js website, then open a new terminal and check:

```bash
node -v
npm -v
```

Confirm Node.js is at least `20.19` (or `22.12` for the Node 22 line). If the commands are not recognized, restart the terminal after installing Node.js.

### Step 3: Configure the backend environment

Open a terminal in the project root and run:

```bash
cd backend
```

Create a file named `.env` in the `backend` folder. You can copy `.env.example` and edit it, or create it manually with:

```env
PORT=5000
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Replace the example values with the URL and publishable/anon key from your own Supabase project. Do not include quotation marks unless your value requires them. Save the file.

Install backend libraries:

```bash
npm install
```

Start the backend:

```bash
npm run dev
```

Expected message:

```text
Server running on port 5000
```

Leave this terminal running. To check the API, open `http://localhost:5000/` in a browser. To check the database connection, open `http://localhost:5000/api/health` after creating the table and configuring Supabase.

### Step 4: Configure the frontend environment

Open a **second terminal**. From the project root, run:

```bash
cd frontend
```

Create a file named `.env` inside the `frontend` folder with:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Use the same Supabase project URL and publishable/anon key as the backend. The frontend Supabase client reads these variables. Save the file.

Install frontend libraries:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Vite will display a local URL, usually:

```text
http://localhost:5173/
```

Open that URL in your browser. Keep both backend and frontend terminals running while using the application.

### Step 5: Test the application

1. Open the frontend URL shown by Vite (normally `http://localhost:5173/`).
2. Register a user with a valid email and a password of at least 8 characters.
3. If email confirmation is enabled in Supabase, verify the email before logging in.
4. Log in with the registered account.
5. Create a text note and confirm it appears on the dashboard.
6. Upload a supported file (maximum 10 MB) and test its download.
7. Edit and delete a note to check the remaining operations.


## Quick execution: commands only

Use this section when Node.js is already installed and your Supabase environment files are already configured on this device.

### 1. Clone the project

```powershell
git clone https://github.com/vinayharsha020-dot/Online-Notes-Management-System.git
cd Online-Notes-Management-System
```

### 2. Backend — Terminal 1

```powershell
cd backend
npm install
npm run dev
```

### 3. Frontend — Terminal 2

```powershell
cd Online-Notes-Management-System/frontend
npm install
npm run dev
```

### 4. Open the application

```text
http://localhost:5173/
```

Keep both terminals running while using the application.

**Before running on another device:** Copy your existing `backend/.env` and `frontend/.env` files to the matching folders on that device using a secure method. `.env` files are not stored in GitHub, so cloning the repository will not download them. Do not paste secret values into this README or commit the `.env` files.


## Available commands

Run these commands from the relevant folder.

### Backend (`backend/`)

| Command | Purpose |
|---|---|
| `npm install` | Installs backend dependencies from `package.json` / `package-lock.json`. |
| `npm run dev` | Starts the backend with Nodemon and restarts it when files change. |
| `npm start` | Starts the backend normally with Node.js. |

### Frontend (`frontend/`)

| Command | Purpose |
|---|---|
| `npm install` | Installs frontend dependencies. |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Creates an optimized production build in `frontend/dist/`. |
| `npm run preview` | Previews the production build locally after running the build command. |
| `npm run lint` | Runs Oxlint on the frontend source. |

## API routes

The backend runs at `http://localhost:5000` and exposes these routes:

| Method | Endpoint | Purpose | Authentication |
|---|---|---|---|
| `GET` | `/` | Confirms that the API server is running. | No |
| `GET` | `/api/health` | Checks that the backend can query the Supabase `notes` table. | No |
| `POST` | `/api/auth/register` | Registers a user with email and password. | No |
| `POST` | `/api/auth/login` | Logs in a user and returns the Supabase session. | No |
| `POST` | `/api/notes` | Creates a text note. | Yes |
| `GET` | `/api/notes` | Lists the signed-in user's notes. | Yes |
| `PUT` | `/api/notes/:id` | Updates a note. | Yes |
| `DELETE` | `/api/notes/:id` | Deletes a note and attempts to remove its uploaded file. | Yes |
| `POST` | `/api/notes/upload` | Uploads a supported study material. | Yes |
| `GET` | `/api/notes/:id/download` | Returns a temporary signed download URL. | Yes |

Authenticated note requests require a valid Supabase access token in the `Authorization: Bearer <token>` header. The frontend Axios service adds this token after login.

## Troubleshooting

| Problem | What to check |
|---|---|
| `node` or `npm` is not recognized | Install Node.js, restart the terminal, and run `node -v` and `npm -v` again. |
| `npm install` fails | Check your internet connection and Node.js version. Run the command inside the correct `backend` or `frontend` folder. |
| Backend says Supabase environment variables are missing | Confirm `backend/.env` exists and contains `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Restart the backend after editing it. |
| Frontend Supabase values are undefined | Confirm `frontend/.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Restart Vite after editing it. |
| Browser reports a network/API error | Make sure the backend is running on port 5000 and the frontend is using the configured local URL. |
| `/api/health` reports a database error | Check the Supabase URL/key, `notes` table, and database permissions/RLS policies. |
| File upload fails | Check that the `note-materials` bucket exists, Storage policies are set, the file type is allowed, and the file is no larger than 10 MB. |
| Login fails after registration | Check whether Supabase email verification is required and whether the account has been verified. |
| Port 5000 or 5173 is already in use | Stop the other process using that port, or configure a different port. Note: the frontend API base URL is currently hard-coded to `http://localhost:5000/api` in `frontend/src/services/api.js`, so changing the backend port also requires updating that file. |

## Security notes

- Never commit `.env` files, passwords, private keys, or Supabase `service_role` / secret keys.
- The frontend uses a publishable/anon key. This key is designed to be used in client applications, but database and Storage security must be enforced with correct RLS and Storage policies.
- Keep the Storage bucket private and use signed URLs for downloads.
- If a real secret key was ever committed to a public repository, rotate it in Supabase immediately. Removing a file in a later commit does not remove the secret from Git history.
- Keep `node_modules` out of Git. Each device should run `npm install` separately using the package lock files.

## License

No project license has been specified. Unless a license is added, normal copyright restrictions apply.

## Only Commands

### Clone the project

```bash
git clone https://github.com/vinayharsha020-dot/Online-Notes-Management-System.git
cd Online-Notes-Management-System
```

### Backend (Terminal 1)

```bash
cd backend
npm install
npm run dev
```

### Frontend (Terminal 2 — from the project root)

```bash
cd frontend
npm install
npm run dev
```

### Open the application

```text
http://localhost:5173/
```

### Push future changes to GitHub

```bash
git add .
git commit -m "Update project"
git push origin main
```
