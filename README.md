# TRINETRA Frontend

Production-grade React + Vite frontend for the TRINETRA complaint management SaaS platform.

## Stack

- React 19 + TypeScript
- Vite
- TailwindCSS v4
- React Router
- Axios service layer
- Context API + store-backed auth session
- JWT authentication with role-based route protection

## Key Features

- Public complaint flows:
  - Home
  - Submit Complaint (anonymous or identity-included)
  - Track Complaint
- Authentication:
  - Admin login
  - Employee login
- Admin workspace:
  - Dashboard
  - Complaint management
  - Users management UI
  - Analytics
  - Settings
- Employee workspace:
  - Employee dashboard
  - My complaints
  - Submit complaint
- Evidence upload:
  - Multiple files
  - Drag and drop
  - Upload progress
  - Previews for images/videos
  - Supported formats: png, jpg, jpeg, mp4, pdf, docx
  - Max size per file: 20MB

## Project Structure

```text
src/
  components/
  layouts/
  pages/
  services/
  hooks/
  store/
  utils/
  types/
```

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
VITE_API_URL=https://backend-url/api
```

Production config template is included in `.env.production`.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Authentication & Routing

- Admin routes: `/admin/*` (requires `ADMIN` role)
- Employee routes: `/employee/*` (requires `EMPLOYEE` role)
- Tokens are stored in browser storage and injected in API requests via Axios interceptors.
- Unauthorized responses (401) trigger automatic session reset and login redirect.

## API Services

- `src/services/httpClient.ts` - Axios instance, interceptors, API error handling
- `src/services/authService.ts` - Admin/employee auth APIs
- `src/services/complaintService.ts` - Complaint submit/track/my-complaints/comment/evidence flows
- `src/services/uploadService.ts` - Evidence upload + progress callbacks
- `src/services/adminService.ts` - Admin complaint retrieval and status update flows

## Deployment (Vercel)

- Ensure `VITE_API_URL` is configured in Vercel environment variables.
- Build command: `npm run build`
- Output directory: `dist`

## Notes

- GitHub push is not performed automatically by this environment.
- If you want, I can next generate a commit plan and exact git commands for clean push.
