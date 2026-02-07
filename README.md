# ENCORE – Concert Journal

A full-stack app for tracking concert tickets and memories. Log shows you’ve been to, add photos, videos, and notes, and keep Spotify and YouTube playlists in one place.
Live Demo: [https://encore-vault.vercel.app/](https://encore-vault.vercel.app/)

## Features

- **Tickets** – Add and edit concert details (artist, venue, date, seat, section)
- **Memories** – Upload photos and videos, write notes for each concert
- **Calendar** – See concerts by date with a visual calendar
- **Sharing** – Share entries with others via a link
- **Spotify & YouTube** – Attach playlists to concerts
- **Account** – Sign up, log in, change password, delete account

## Tech Stack

| Layer    | Stack                          |
|----------|---------------------------------|
| Frontend | React, TypeScript, React Router |
| Backend  | Node.js, Express                |
| Database | MongoDB (Atlas)                 |
| Auth     | JWT, bcrypt                     |
| Storage  | AWS S3 (or local disk)          |

## Project Structure

```
project_concert/
├── frontend/          # React app (Vercel)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styling/
│   │   └── config/
│   └── public/
├── backend/           # Express API (Railway)
│   ├── routes/
│   ├── models/
│   └── utils/
└── README.md
```

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- (Optional) AWS S3 for media uploads

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/concert?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
```

Optional (for S3 uploads):

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_REGION=us-east-1
```

To use local disk instead of S3:

```env
USE_LOCAL_STORAGE=true
```

Start the server:

```bash
npm run dev
# or: node index.js
```

Backend runs at `http://127.0.0.1:4000`.

### 2. Frontend

```bash
cd frontend
npm install
```

Optional – create `frontend/.env` to point at a different backend:

```env
REACT_APP_API_URL=http://127.0.0.1:4000
```

Start the app:

```bash
npm start
```

Frontend runs at `http://127.0.0.1:3000`.

## Deployment

### Frontend (Vercel)

1. Connect the repo and set the root to `frontend`.
2. Add environment variable:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** your backend URL (e.g. `https://your-app.up.railway.app`)
3. Deploy.

### Backend (Railway)

1. Create a new service and connect the repo.
2. Set **Root Directory** to `backend`.
3. Add environment variables:
   - `MONGO_URI` – MongoDB Atlas connection string
   - `JWT_SECRET` – secret for JWT signing
   - (Optional) `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_REGION` for S3
4. Deploy.

### MongoDB Atlas

1. **Network Access** – Add `0.0.0.0/0` so Railway can connect.
2. **Database User** – Create a user with read/write access.
3. **Connection String** – Use the “Connect your application” URI as `MONGO_URI`.

## API Overview

| Method | Endpoint             | Description        |
|--------|----------------------|--------------------|
| POST   | `/api/auth/signup`   | Create account     |
| POST   | `/api/auth/login`    | Log in             |
| GET    | `/api/auth`          | Auth health check  |
| GET    | `/api/concerts/my_tickets` | User’s tickets (auth) |
| POST   | `/api/concerts/ticket`     | Create ticket (auth) |
| PUT    | `/api/concerts/ticket/:id` | Update ticket (auth) |
| GET    | `/api/concerts/share/:token` | Shared tickets    |
| POST   | `/api/upload/:ticketId`    | Upload media (auth, legacy) |
| POST   | `/api/upload/presign`      | Get presigned S3 URL (auth) |
| POST   | `/api/upload/complete`     | Register S3 uploads (auth)  |

## Async Media Upload (Production)

Large files can crash the backend if buffered in memory. The app uses **direct-to-S3 uploads** when S3 is configured:

1. Frontend requests a presigned PUT URL from the backend.
2. Frontend uploads the file directly to S3 (no backend buffering).
3. Frontend notifies the backend to create the memory record.

When S3 is not configured (local disk), the legacy multipart upload flow is used.

### S3 CORS for Direct Uploads

If using direct uploads, configure CORS on your S3 bucket:

1. AWS Console → S3 → your bucket → **Permissions** → **CORS**
2. Add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-app.vercel.app"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Replace `your-app.vercel.app` with your actual frontend domain.

## Scripts

### Backend

- `npm start` – run server
- `npm run dev` – run with nodemon

### Frontend

- `npm start` – dev server
- `npm run build` – production build
- `npm test` – run tests

## License

ISC
