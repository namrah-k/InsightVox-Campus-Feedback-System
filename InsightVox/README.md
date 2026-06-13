# InsightVox

A student complaint platform. Students can post complaints (with photos or
videos), comment, support/disagree with posts, and message staff privately.
Staff can review every complaint, change its status, reply, and delete
posts/comments. Everything is stored permanently in MongoDB, and student vs
staff areas are fully separated by login role.

---

## What's in this project

```
InsightVox/
├── server/                 Node.js + Express + MongoDB API
│   ├── server.js           App entry point
│   ├── .env.example         Copy to .env and fill in your values
│   ├── config/db.js         MongoDB connection
│   ├── models/              User, Post, Comment, Message schemas
│   ├── middleware/           JWT auth, role checks, file upload (multer)
│   ├── routes/               auth, posts, comments, messages
│   └── uploads/              Uploaded complaint images/videos (created at runtime)
└── client/                  Static frontend (served by the same server)
    ├── shared/               Shared CSS/JS: theme, API client, navbar, post cards, chat
    ├── student/              Student login/signup, feed, new complaint, details, chat
    ├── staff/                Staff login/signup, dashboard, details, chat
    └── index.html            Landing page (choose Student or Staff)
```

The old scattered files you uploaded (`home.html`, `chat.html`, `post.html`,
`Post.js`, etc. — several of which still had unresolved Git merge-conflict
markers and used `localStorage` as a "database") have been replaced by this
structure. The visual style (Montserrat font, the `#2f4156` / `#c8d9e6` blue
palette, the chat bubble layout) was kept and extended with a full light/dark
theme.

---

## 1. Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** — either:
  - a local MongoDB server (`mongodb://127.0.0.1:27017`), or
  - a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (cloud)

## 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/insightvox
JWT_SECRET=some-long-random-string
JWT_EXPIRES_IN=7d
STAFF_SIGNUP_CODE=pick-a-secret-code
PORT=5000
```

- `MONGO_URI` — where MongoDB lives (local or Atlas connection string).
- `JWT_SECRET` — any long random string; used to sign login tokens.
- `STAFF_SIGNUP_CODE` — share this **only** with real staff. Anyone signing
  up at `/staff/signup.html` must enter this code, which is how students are
  prevented from creating staff accounts.

Start the server:

```bash
npm run start    # production
# or
npm run dev      # auto-restarts on file changes (nodemon)
```

The server serves **both** the API (`/api/...`) and the frontend (`client/`)
on the same port, so the whole site runs from one URL:

```
http://localhost:5000
```

> **Don't open the HTML files with "Live Server" / port 5500 instead of the
> command above.** All pages use absolute paths like `/shared/style.css` and
> `/student/home.html`, which assume `client/` is the site root. If you do
> want to use Live Server for quick frontend tweaks, point its root folder at
> `client/` (not the project root or a subfolder) — otherwise you'll see
> "Cannot GET /student/..." errors. Either way, `npm run dev` in `server/`
> must also be running, since that's what serves the API the pages call.

## 3. Using the site

1. Open `http://localhost:5000` — choose **Student** or **Staff**.
2. **Students**: sign up at `/student/signup.html`, then log in.
   - Post a complaint (title, category, description, optional photo/video)
   - Support 👍 / Disagree 👎 on any post (one vote per user, switchable)
   - Comment on posts, delete your own posts/comments
   - View **Trending** (highest support − disagree, then most-commented) or
     **Recent**
   - Message staff privately in **Messages**
3. **Staff**: sign up at `/staff/signup.html` using the `STAFF_SIGNUP_CODE`
   from your `.env`, then log in.
   - See **all** complaints, filter by status, sort by trending/recent
   - Change a complaint's status (Pending / In Progress / Resolved)
   - Reply as staff in the comments, delete any post/comment
   - Reply privately to individual students in **Messages**

### Role separation

- Each account has a `role` of `student` or `staff`, stored in the database
  and encoded into its login token (JWT).
- Every page calls `requireRole('student')` or `requireRole('staff')` on
  load — if you're logged in as the wrong role (or not logged in), you're
  redirected to the correct login page.
- The **API itself** also enforces this (e.g. only `staff` can change a
  post's status; only `student` accounts can create posts; a student can
  only fetch their own chat thread). The frontend checks are for UX — the
  backend checks are what actually keep the areas separate.

## 4. Light / dark mode

Click the sun/moon toggle in the top-right of the navbar on any page. The
choice is remembered (stored in the browser) and applied instantly via CSS
variables defined in `client/shared/style.css`.

## 5. Data model summary

- **User**: name, email, hashed password, role (`student`/`staff`), department
- **Post** (complaint): title, description, category, optional media
  (image/video), author, status, arrays of users who supported/disagreed
- **Comment**: text, author, linked post
- **Message**: a private chat message between a student and "the staff team",
  tagged with the sender's role

"Trending" is computed as `supports − disagrees` (ties broken by comment
count, then recency).

## 6. Notes & next steps

- Uploaded images/videos are stored on disk in `server/uploads/` and served
  at `/uploads/<filename>`. For production, consider moving this to cloud
  storage (e.g. S3/Cloudinary) instead of the local filesystem.
- Passwords are hashed with bcrypt; never stored in plain text.
- The staff signup code is a simple shared-secret approach suitable for a
  small institution. For larger deployments, consider an admin-managed
  invite system instead.
