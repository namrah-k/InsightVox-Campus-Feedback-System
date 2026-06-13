# InsightVox — Campus Feedback Platform

> A campus complaint management platform — Students raise issues publicly with evidence; staff track, respond to, and resolve them. Every complaint gets a case file.

> ⚠️ **Work in Progress** — Core frontend UI is built. Backend (Node.js/Express + MongoDB), JWT authentication, and several key features are still under active development. Contributions and feedback are welcome.

---

## Table of Contents

- [Overview](#overview)
- [Current Status](#current-status)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Role Separation](#role-separation)
- [Frontend Architecture](#frontend-architecture)
- [Planned / Incomplete](#planned--incomplete)
- [Getting Started](#getting-started)
- [Data Model](#data-model)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

InsightVox is a two-sided platform for educational institutions:

- **Students** post complaints (with optional photo/video evidence), vote on each other's posts, comment, and message staff privately.
- **Staff** review all complaints, manage their status (Pending → In Progress → Resolved), respond publicly and privately, and delete inappropriate content.

The goal is to replace informal grievance channels (WhatsApp groups, verbal complaints) with a transparent, trackable, and accountable system.

---

## Current Status

| Area | Status |
|---|---|
| Frontend UI — Student | ✅ Complete |
| Frontend UI — Staff | ✅ Complete |
| Shared component system | ✅ Complete |
| Light / Dark theme | ✅ Complete |
| Express server scaffold | 🔧 In Progress |
| MongoDB schemas | 🔧 In Progress |
| JWT Authentication | ❌ Not yet implemented |
| REST API routes | ❌ Not yet implemented |
| File upload (Multer) | ❌ Not yet implemented |
| Role-based access control | ❌ Not yet implemented |

---

## Tech Stack

**Frontend**

- Vanilla HTML5, CSS3, JavaScript (ES2020+)
- Font Awesome 6 (icons)
- Montserrat via Google Fonts

**Backend (Planned)**

- Node.js + Express
- MongoDB + Mongoose
- JWT (jsonwebtoken) for auth
- bcrypt for password hashing
- Multer for file uploads

---

## Project Structure

```
InsightVox/
├── client/
│   ├── index.html                  Landing page (Student / Staff entry point)
│   │
│   ├── shared/                     Reused across both roles
│   │   ├── style.css               Global design system (CSS variables, components)
│   │   ├── theme.js                Light/dark toggle + localStorage persistence
│   │   ├── api.js                  Centralised API client (Auth, Posts, Comments, Messages)
│   │   ├── nav.js                  Dynamic navbar injection
│   │   ├── posts-ui.js             Post card renderer + vote/delete event bindings
│   │   ├── post-details.js         Single post view + comment CRUD
│   │   └── chat-ui.js              Chat bubble renderer + image helpers
│   │
│   ├── student/
│   │   ├── login.html
│   │   ├── signup.html
│   │   ├── home.html               Complaint feed (Trending / Recent tabs)
│   │   ├── home.js
│   │   ├── create-post.html        New complaint form
│   │   ├── post-details.html       Single complaint + comments
│   │   ├── chat.html               Private messages with staff
│   │   └── chat.js
│   │
│   └── staff/
│       ├── login.html
│       ├── signup.html             Requires staff access code
│       ├── dashboard.html          All complaints with filter + sort
│       ├── dashboard.js
│       ├── post-details.html       Complaint detail + staff reply
│       ├── chat.html               All student message threads
│       └── chat.js
│
└── server/
    ├── server.js                   Express entry point
    ├── .env.example
    ├── config/db.js                MongoDB connection
    ├── models/                     Mongoose schemas (User, Post, Comment, Message)
    ├── middleware/                  JWT auth, role checks, Multer
    ├── routes/                     /api/auth, /api/posts, /api/comments, /api/messages
    └── uploads/                    Uploaded media at runtime (gitignored)
```

---

## Features

### Student

- Complaint feed sorted by **Trending** (support − disagree score) or **Recent**
- Submit complaints with title, category, description, and optional photo/video
- Vote support 👍 or disagree 👎 on posts (one per user, switchable)
- Comment on posts, delete your own comments
- Track complaint status: Pending / In Progress / Resolved
- Private chat with staff, including image sharing

### Staff

- Dashboard showing all complaints, filterable by status and sortable by Trending or Recent
- Update complaint status inline
- Reply as staff in comments, delete any post or comment
- Private message threads — one per student, with image support

### Shared

- Light / Dark mode toggle, persisted to localStorage
- Role guard on every page — wrong role redirects to the correct login
- Chat pages poll the API every 8 seconds for new messages

---

## Role Separation

| Capability | Student | Staff |
|---|:---:|:---:|
| Post a complaint | ✅ | ❌ |
| Vote on posts | ✅ | ❌ |
| Comment | ✅ | ✅ |
| Delete own content | ✅ | ✅ |
| Delete any content | ❌ | ✅ |
| Change complaint status | ❌ | ✅ |
| View all complaints | ❌ | ✅ |
| Private chat | ✅ | ✅ |
| View all student threads | ❌ | ✅ |

Staff accounts also require a `STAFF_SIGNUP_CODE` at registration, preventing students from self-registering as staff.

> The frontend `requireRole()` check handles UX redirection. The backend middleware will enforce the same rules independently — frontend checks are never trusted on their own.

---

## Frontend Architecture

No bundler, no framework. The client is a traditional multi-page app served as static files.

**Shared API client (`shared/api.js`)** organises all fetch calls into namespaces:

```js
Auth.login()              Auth.signup()
Posts.list()              Posts.create()       Posts.vote()       Posts.delete()
Comments.list()           Comments.create()    Comments.delete()
Messages.thread()         Messages.send()      Messages.conversations()
```

Every page imports `api.js` and calls `requireRole('student' | 'staff')` before anything else. If the JWT is missing, invalid, or the wrong role, the user is redirected immediately.

**Shared renderers** (`posts-ui.js`, `chat-ui.js`, `post-details.js`) generate post cards, vote buttons, comment lists, and chat bubbles — reused by both student and staff pages.

**Theming** — `style.css` defines CSS custom properties (`--bg`, `--surface`, `--text-primary`, `--accent`, etc.). `theme.js` toggles `data-theme="dark"` on `<html>` and saves the preference.

---

## Planned / Incomplete

The following are designed and partially stubbed but not yet functional:

- **Backend API** — Express routes are scaffolded but not implemented. Frontend `api.js` calls will 404 until this is done.
- **JWT auth** — `api.js` attaches a `Bearer` token from localStorage; the `/api/auth` endpoints do not exist yet.
- **MongoDB schemas** — `User`, `Post`, `Comment`, `Message` are designed (see Data Model) but not coded.
- **File uploads** — frontend sends `FormData` with a `media` field; Multer middleware is not yet written.
- **Trending sort** — frontend passes `?sort=trending`; the backend query (`supports − disagrees`, tie-broken by comment count then recency) is not implemented.
- **Unread indicators** — notification badges for new messages are not yet built.
- **Category filter** — UI exists on the dashboard; backend query param is not wired.

---

## Getting Started

> The backend is not yet functional. These steps describe the intended setup once the server is complete.

### Prerequisites

- Node.js 18+
- npm
- MongoDB — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)

### Install

```bash
git clone https://github.com/your-org/insightvox.git
cd insightvox/server
npm install
cp .env.example .env
```

Edit `server/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/insightvox
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
STAFF_SIGNUP_CODE=your-secret-staff-code
PORT=5000
```

### Run

```bash
npm run dev      # development — auto-restarts on changes (nodemon)
npm run start    # production
```

Open `http://localhost:5000`. The server serves both the API and the frontend from a single port.

> Do not open HTML files directly or through a Live Server pointed at the project root. All asset paths are absolute (e.g. `/shared/style.css`) and expect `client/` to be the document root.

---

## Data Model

```
User
  name         String
  email        String (unique)
  password     String (bcrypt hash)
  role         "student" | "staff"
  department   String (optional)

Post
  title        String (max 150 chars)
  description  String
  category     "General" | "Facilities" | "Academics" | "Hostel" |
               "Cafeteria" | "Faculty" | "Harassment" | "Other"
  mediaUrl     String (optional)
  mediaType    "image" | "video"
  author       → User
  status       "pending" | "in-progress" | "resolved"
  supports     [→ User]
  disagrees    [→ User]
  createdAt    Date

Comment
  text         String
  author       → User
  post         → Post
  createdAt    Date

Message
  text         String
  image        String (optional)
  sender       → User
  senderRole   "student" | "staff"
  student      → User  (always the student side of the thread)
  createdAt    Date
```

**Trending score** = `supports.length − disagrees.length`, ties broken by comment count, then `createdAt` descending.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Frontend changes go in `client/`, backend in `server/`
4. Match the existing style — no bundler, no TypeScript (yet), plain ES modules in the browser
5. Open a pull request with a clear description of what's done and what's still pending

**Most needed right now:**

- Express route implementations (`/api/auth`, `/api/posts`, `/api/comments`, `/api/messages`)
- Mongoose model definitions
- Multer middleware for media uploads
- JWT `authenticate` and `requireRole` middleware

---

## License

MIT
