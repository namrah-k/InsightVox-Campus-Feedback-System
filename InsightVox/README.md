InsightVox-Campus-Feedback-System

A campus complaint management platform — Students raise issues publicly with evidence; staff track, respond to, and resolve them. Every complaint gets a case file.




⚠️ Work in Progress — Core frontend UI is built. Backend (Node.js/Express + MongoDB), JWT authentication, and several key features are still under active development. Contributions and feedback are welcome.




Table of Contents


Overview
Current Status
Tech Stack
Project Structure
Features
Role Separation
Frontend Architecture
Planned / Incomplete
Getting Started
Data Model
Contributing



Overview

InsightVox is a two-sided platform for educational institutions:


Students post complaints (with optional photo/video evidence), vote on each other's posts, comment, and message staff privately.
Staff review all complaints, manage their status (Pending → In Progress → Resolved), respond publicly and privately, and delete inappropriate content.


The goal is to replace informal grievance channels (WhatsApp groups, verbal complaints) with a transparent, trackable, and accountable system.


Current Status

AreaStatusFrontend UI (Student)✅ CompleteFrontend UI (Staff)✅ CompleteShared component system✅ CompleteLight / Dark theme✅ CompleteExpress server scaffold🔧 In ProgressMongoDB schemas🔧 In ProgressJWT Authentication❌ Not yet implementedREST API routes❌ Not yet implementedFile upload (Multer)❌ Not yet implementedRole-based access control❌ Not yet implementedReal-time / polling❌ Not yet implemented


Tech Stack

Frontend


Vanilla HTML5, CSS3, JavaScript (ES2020+)
Font Awesome 6 (icons)
Montserrat (Google Fonts — typography)
Custom CSS variable system for theming


Backend (Planned)


Node.js + Express
MongoDB + Mongoose
JWT (jsonwebtoken) for auth
bcrypt for password hashing
Multer for file uploads



Project Structure

InsightVox/
│
├── client/                         Static frontend
│   ├── index.html                  Landing page (Student / Staff entry point)
│   │
│   ├── shared/                     Reusable across both roles
│   │   ├── style.css               Global design system (CSS variables, components)
│   │   ├── theme.js                Light/dark toggle + localStorage persistence
│   │   ├── api.js                  Centralised API client (Auth, Posts, Comments, Messages)
│   │   ├── nav.js                  Dynamic navbar injection
│   │   ├── posts-ui.js             Post card renderer + vote/delete event bindings
│   │   ├── post-details.js         Single post view + comment CRUD
│   │   └── chat-ui.js              Chat bubble renderer + image helpers
│   │
│   ├── student/
│   │   ├── login.html              Student login
│   │   ├── signup.html             Student registration
│   │   ├── home.html               Complaint feed (Trending / Recent tabs)
│   │   ├── home.js
│   │   ├── create-post.html        New complaint form (title, category, description, media)
│   │   ├── post-details.html       Single complaint + comments
│   │   ├── chat.html               Private messages with staff
│   │   └── chat.js
│   │
│   └── staff/
│       ├── login.html              Staff login
│       ├── signup.html             Staff registration (requires access code)
│       ├── dashboard.html          All complaints with filter + sort
│       ├── dashboard.js
│       ├── post-details.html       Complaint detail + staff reply
│       ├── chat.html               Private messages — one thread per student
│       └── chat.js
│
└── server/                         Backend (in progress)
    ├── server.js                   Express app entry point
    ├── .env.example
    ├── config/
    │   └── db.js                   MongoDB connection
    ├── models/                     Mongoose schemas (User, Post, Comment, Message)
    ├── middleware/                  JWT auth, role checks, Multer file upload
    ├── routes/                     /api/auth, /api/posts, /api/comments, /api/messages
    └── uploads/                    Uploaded media (runtime, gitignored)


Features

Student Side


Complaint Feed — view all complaints sorted by Trending (support − disagree score) or Recent
New Complaint — title, category (General / Facilities / Academics / Hostel / Cafeteria / Faculty Conduct / Harassment / Other), description, optional photo or video attachment
Voting — support 👍 or disagree 👎 on any post (one vote per user, switchable)
Comments — comment on any post; delete your own
Status tracking — see whether a complaint is Pending, In Progress, or Resolved
Private messaging — direct chat thread with the staff team
Image sharing in chat — attach photos in messages


Staff Side


Dashboard — all student complaints, filterable by status, sortable by Trending or Recent
Status control — update a complaint's status from the dashboard
Post detail — view full complaint with media, reply as staff in comments
Delete — remove any post or comment
Conversations — private message threads, one per student, with image support


Shared


Light / Dark mode — toggle in navbar, persisted to localStorage
Role guard — every page calls requireRole('student' | 'staff') on load and redirects if the role doesn't match
Polling — chat pages poll the API every 8 seconds for new messages



Role Separation

Accounts carry a role field (student or staff) stored in the database and signed into the JWT.

CapabilityStudentStaffPost a complaint✅❌Vote on posts✅❌Comment✅✅Delete own posts/comments✅✅Delete any post/comment❌✅Change complaint status❌✅See all complaints❌✅Private chat with staff✅✅See all student threads❌✅

The frontend requireRole() check is for UX redirection. The backend API middleware will enforce the same rules independently — frontend checks alone are never trusted.

Staff accounts additionally require a STAFF_SIGNUP_CODE (set in .env) at registration, preventing students from self-registering as staff.


Frontend Architecture

The client is a traditional multi-page app served as static files. There is no bundler or framework dependency.

Shared API client (shared/api.js) — all fetch calls live here, organised into namespaces:

Auth.login()         Auth.signup()
Posts.list()         Posts.create()       Posts.vote()        Posts.delete()
Comments.list()      Comments.create()    Comments.delete()
Messages.thread()    Messages.send()      Messages.conversations()

Every page imports api.js and calls requireRole(role) before doing anything else. If the JWT is missing, invalid, or the wrong role, the user is redirected to the correct login page.

Shared UI (posts-ui.js, chat-ui.js, post-details.js) — rendering helpers that both student and staff pages reuse. Post cards, vote buttons, comment lists, and chat bubbles are all generated here.

Theming — shared/style.css defines a set of CSS custom properties (--bg, --surface, --text-primary, --accent, etc.). theme.js toggles a data-theme="dark" attribute on <html> and persists the preference.


Planned / Incomplete

The following are architected and partially stubbed but not yet functional:


server/ — Express app with routes, models, and middleware is scaffolded but the implementation is not complete. The frontend API calls will 404 until this is done.
JWT auth — api.js is written to attach a Bearer token from localStorage, but the /api/auth endpoints don't exist yet.
MongoDB schemas — User, Post, Comment, Message are designed (see Data Model below) but not implemented.
File uploads — the frontend sends FormData with a media field; the Multer middleware to receive and store it is not yet written.
Trending algorithm — the frontend requests ?sort=trending; the backend query (supports.length - disagrees.length, tie-broken by comment count then recency) is not yet implemented.
Notifications — unread message indicators are not yet implemented.
Search / filtering by category — UI exists on the dashboard; backend query param not yet wired.



Getting Started


The backend is not yet functional. These steps describe the intended setup once the server is complete.



Prerequisites


Node.js 18+
npm
MongoDB (local or Atlas)


Installation

bash# Clone the repo
git clone https://github.com/your-org/insightvox.git
cd insightvox

# Install backend dependencies
cd server
npm install

# Configure environment
cp .env.example .env

Edit server/.env:

envMONGO_URI=mongodb://127.0.0.1:27017/insightvox
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
STAFF_SIGNUP_CODE=your-secret-staff-code
PORT=5000

Running

bash# From /server
npm run dev        # development (nodemon, auto-restart)
npm run start      # production

The server will serve both the API (/api/...) and the static frontend (client/) on the same port:

http://localhost:5000


Important: do not open HTML files directly or with a Live Server pointed at the project root. All asset paths are absolute (e.g. /shared/style.css) and assume client/ is the document root. If you use a dev server for frontend-only work, point it at the client/ directory.




Data Model

User
  name        String
  email       String (unique)
  password    String (bcrypt hash)
  role        "student" | "staff"
  department  String (optional)

Post
  title       String (max 150)
  description String
  category    String (enum)
  mediaUrl    String (optional — path to uploaded file)
  mediaType   "image" | "video"
  author      → User
  status      "pending" | "in-progress" | "resolved"
  supports    [→ User]   (array of user IDs who supported)
  disagrees   [→ User]   (array of user IDs who disagreed)
  createdAt   Date

Comment
  text        String
  author      → User
  post        → Post
  createdAt   Date

Message
  text        String
  image       String (optional base64 or URL)
  sender      → User
  senderRole  "student" | "staff"
  student     → User   (always the student side of the thread)
  createdAt   Date

Trending score = supports.length − disagrees.length, ties broken by comment count then createdAt descending.
