# LinkSnap — URL Shortener

A full-stack SaaS web application that converts long URLs into clean, shareable short links. Built with React, Node.js, MongoDB, and Firebase, featuring user authentication, click analytics, and a premium upgrade system.

![Stack](https://img.shields.io/badge/Frontend-React.js-61DAFB?logo=react)
![Stack](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=nodedotjs)
![Stack](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb)
![Stack](https://img.shields.io/badge/Auth-Firebase-FFCA28?logo=firebase)
![Stack](https://img.shields.io/badge/Payments-Razorpay-02042B?logo=razorpay)

---

## Live Demo

| Service | URL |
|---|---|
| Frontend | https://url-shortener-frontend-gelc.onrender.com |
| Backend | https://url-shortener-full.onrender.com |

---

## Features

- **URL Shortening** — Paste any long URL and get a short link instantly
- **Custom Short Codes** — Optionally define your own slug (e.g. `/my-launch`)
- **Google Authentication** — One-click sign-in via Firebase OAuth
- **Click Analytics** — Track how many times each link has been visited
- **Personal Dashboard** — View, copy, and delete all your shortened links
- **Usage Limits** — Free tier with a cap; premium removes all restrictions
- **Premium Upgrade** — Seamless payment flow via Razorpay (test mode)
- **Glassmorphism UI** — Dark-mode interface with frosted glass cards and cyan/purple gradients

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, JavaScript (ES6+), CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | Firebase (Google OAuth) |
| Payments | Razorpay |
| Deployment | Render |

---

## Project Structure

```
url-shortener/
├── backend/
│   ├── models/
│   │   └── User.js          # User schema (email, premium status, URL count)
│   ├── server.js            # Express server and API routes
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx          # Main application logic and UI
    │   ├── App.css          # Glassmorphism component styles
    │   └── index.css        # Global styles and resets
    ├── public/
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- A MongoDB Atlas cluster
- A Firebase project with Google Auth enabled
- A Razorpay account (test mode is fine)

### 1. Clone the repository

```bash
git clone https://github.com/adrita24/url-shortener.git
cd url-shortener
```

### 2. Configure environment variables

Create a `.env` file inside `backend/`:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Create a `.env` file inside `frontend/` (or update `firebaseConfig` in `App.jsx`):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

### 3. Start the backend

```bash
cd backend
npm install
node server.js
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173` by default.

---

## How It Works

```
User submits URL
       │
       ▼
POST /shorten  ──►  Validate input
                        │
                        ├── New user? → Create user in DB
                        ├── Free tier? → Check usage limit
                        │
                        ▼
               Generate short code (random or custom)
                        │
                        ▼
               Save to MongoDB: { originalUrl, shortCode, userEmail, clicks: 0 }
                        │
                        ▼
               Return short URL to frontend

Visiting short URL:
GET /:code  ──►  Look up shortCode  ──►  Increment clicks  ──►  301 Redirect
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/shorten` | Create a new short URL |
| `GET` | `/:code` | Redirect to original URL and increment click count |
| `GET` | `/urls/:email` | Fetch all URLs for a user |
| `DELETE` | `/urls/:id` | Delete a URL by ID |
| `POST` | `/upgrade` | Upgrade user to premium |

---

## Usage Flow

1. Sign in with Google
2. Paste a long URL into the input field
3. Optionally enter a custom short code
4. Click **Shorten** — your link is ready
5. View all links in your **Profile Dashboard**
6. Monitor click counts and copy or delete links as needed
7. Hit your free-tier limit? Upgrade to **Premium** via Razorpay

---

## UI Design

The interface uses a dark glassmorphism theme throughout:

- Frosted glass cards with `backdrop-filter: blur`
- Cyan and purple gradient accents
- Smooth hover transitions and glow effects
- Clean, SaaS-style layout optimised for both desktop and mobile

---

## Roadmap

- [ ] Advanced analytics (referrer, geography, device breakdown)
- [ ] QR code generation for each link
- [ ] Link expiry with configurable TTL
- [ ] Custom domain support
- [ ] Improved animation and micro-interactions

---

## License

This project is built for educational, portfolio, and demonstration purposes.  
You are free to modify and extend it for personal or academic use.
