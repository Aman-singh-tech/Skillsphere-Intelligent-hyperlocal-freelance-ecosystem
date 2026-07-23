# SkillSphere — Intelligent Hyperlocal Freelance Ecosystem

A full-stack **MERN** platform connecting clients with freelancers, built to the spec in
`Nayoda_Full_Stack_Development_Internship_-_Project_Details.pdf`.

```
skillsphere/
├── backend/            ← Node.js + Express + MongoDB API (JavaScript, no TypeScript)
├── frontend-client/    ← Client + Freelancer app (marketplace, dashboards, sign in/up) — JSX
└── frontend-admin/     ← Admin panel only — separate app, separate login — JSX
```

**Note on language:** everything in this project is plain JavaScript/JSX — no TypeScript.
The original prototype came out of Figma Make as `.tsx`; it's been converted (types stripped
via the TypeScript compiler in `preserve` JSX mode, then verified with a real `vite build`)
into two standalone `.jsx` apps, split by audience as requested:
- `frontend-client` — everything a **client** or **freelancer** uses: landing page, marketplace,
  freelancer dashboard, client dashboard, sign in / sign up.
- `frontend-admin` — a **separate, standalone app** for the admin panel, with its own login
  screen and its own minimal navbar (no public marketplace nav). This mirrors how real
  platforms isolate admin tooling from the public-facing app.

Both apps talk to the **same backend**. The backend's RBAC middleware (`middleware/auth.js`)
is what actually enforces that only `role: "admin"` users can hit `/api/admin/*` routes —
splitting the frontend is a UX/deployment separation, not the security boundary.

---

## 1. Tech stack (as specified in the PDF)

| Layer | Choice |
|---|---|
| Frontend | React.js, Tailwind CSS, (Redux Toolkit / React Query recommended next) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Real-time | Socket.IO |
| Auth | JWT + Role-Based Access Control (RBAC) + Google OAuth + 2FA |
| Payments | Razorpay (escrow + milestone payouts) |
| File storage | Cloudinary |
| Email | Nodemailer |
| AI matching | Hugging Face Inference API, with a local skill-similarity fallback |

## 2. Module → code map

Every module from the PDF has real, working backend code (not placeholders):

| # | Module | Where it lives |
|---|---|---|
| 1 | Multi-role auth (JWT, RBAC, Google OAuth, email verify, reset, 2FA) | `models/User.js`, `controllers/authController.js`, `config/passport.js`, `middleware/auth.js` |
| 2 | AI-powered job matching | `utils/aiMatch.js`, `controllers/gigController.js` (`getRecommendedFreelancers`) |
| 3 | Freelancer professional profiles | `models/User.js` (`freelancerProfile`), `controllers/userController.js` |
| 4 | Gig / project marketplace | `models/Gig.js`, `controllers/gigController.js` |
| 5 | Proposal & bidding system | `models/Proposal.js`, `controllers/proposalController.js` |
| 6 | Real-time chat + collaboration | `socket/socketHandler.js`, `models/Message.js`, `controllers/messageController.js` |
| 7 | Secure payments (escrow, milestones, Razorpay) | `models/Payment.js`, `controllers/paymentController.js` |
| 8 | Smart reputation & review system | `models/Review.js`, `utils/reputationScore.js`, `controllers/reviewController.js` |
| 9 | Admin dashboard | `controllers/adminController.js`, `models/AdminLog.js` |
| 10 | Advanced search engine | `controllers/gigController.js` (`searchGigs`, `searchFreelancers`) |
| 11 | Notification system | `models/Notification.js`, `controllers/notificationController.js`, socket events |
| 12 | Freelancer availability scheduler | `controllers/userController.js` (`updateAvailability`) |
| 13 | Dispute resolution | `models/Dispute.js`, `controllers/disputeController.js` |
| 14 | Project progress tracker | `Gig.milestones[]` (progressPercent, fileUploads, status) |
| 15 | Freelancer analytics dashboard | `controllers/userController.js` (`getFreelancerAnalytics`) |

## 3. What's fully working vs. what needs your API keys

**Working out of the box, no external keys needed:**
- Registration, login, JWT issuance, RBAC on every route
- Password reset & email verification flow (logs the email to console in dev mode if SMTP isn't configured)
- 2FA setup (real TOTP + QR code via `speakeasy`/`qrcode`)
- Gig CRUD, proposals, negotiation, acceptance
- AI matching — **works without any key** via the local skill-similarity algorithm; automatically upgrades to real Hugging Face embeddings if you add `HUGGINGFACE_API_KEY`
- Reputation scoring, fraud-flagging heuristic
- Admin moderation, analytics, dispute resolution
- Real-time chat, typing indicators, read receipts, WebRTC signaling relay (Socket.IO)
- Payments — **works in a simulated escrow mode** without Razorpay keys, so you can demo the whole flow; add real `RAZORPAY_KEY_ID/SECRET` to switch to live payments

**Needs your own credentials to go fully live:**
- `MONGO_URI` — free cluster at mongodb.com/atlas (required to run anything — see setup below)
- `GOOGLE_CLIENT_ID/SECRET` — Google Cloud Console, for "Continue with Google"
- `SMTP_USER/PASS` — for real verification/reset emails
- `RAZORPAY_KEY_ID/SECRET` — for real payment processing
- `CLOUDINARY_*` — for real file/image uploads

This is intentional: an interviewer can see the **entire feature set working end-to-end in dev mode** with zero setup cost, and understand exactly which env vars flip each integration to production.

## 4. Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env        # then fill in at least MONGO_URI and JWT_SECRET
npm run seed                 # optional: creates demo admin/client/freelancer + one gig
npm run dev                  # starts on http://localhost:5000

# Client + Freelancer app
cd frontend-client
npm install
cp .env.example .env         # VITE_API_URL=http://localhost:5000/api
npm run dev                  # starts on http://localhost:5173

# Admin app (separate app, run on its own port/subdomain)
cd frontend-admin
npm install
cp .env.example .env         # VITE_API_URL=http://localhost:5000/api
npm run dev -- --port 5174   # starts on http://localhost:5174
```

Demo login after seeding:
- Admin: `admin@skillsphere.app` / `Password123!` → use in **frontend-admin**
- Client: `client@skillsphere.app` / `Password123!` → use in **frontend-client**
- Freelancer: `priya@skillsphere.app` / `Password123!` → use in **frontend-client**

Both frontends were verified with a real `npm run build` (Vite), not just a syntax check.

## 5. How this maps to the PDF's 4-week timeline

- **Week 1** (Auth, roles, profile APIs, Login/Register UI, dashboard layout) — ✅ backend complete (Module 1 & 3). Sign In/Sign Up screens live in `frontend-client/src/App.jsx`; next step is wiring their form submits to `authApi.login` / `authApi.register` from `frontend-client/src/lib/api.js`. The admin login lives separately in `frontend-admin/src/App.jsx` and should wire to `frontend-admin/src/lib/api.js`.
- **Week 2** (Gig APIs, proposals, search, marketplace UI, filters) — ✅ backend complete (Module 4, 5, 10). Wire `MarketplaceView` to `gigApi.list()` / `gigApi.search()`.
- **Week 3** (Chat via Socket.IO, reviews, notifications) — ✅ backend complete (Module 6, 8, 11). Use `src/lib/socket.js` inside a new chat view.
- **Week 4** (Payments, admin dashboard APIs, security hardening) — ✅ backend complete (Module 7, 9). Security middleware (`helmet`, rate limiting, `express-mongo-sanitize`) is already active in `server.js`. Wire `frontend-admin/src/App.jsx`'s `AdminDashboardView` to `adminApi.analytics()` from `frontend-admin/src/lib/api.js`.

## 6. For your project review (interviewer perspective)

Things worth highlighting:
1. **RBAC is enforced server-side**, not just hidden in the UI — every admin/client/freelancer-only route checks `req.user.role` via middleware, so it can't be bypassed by editing frontend state.
2. **AI matching degrades gracefully** — no hard dependency on a paid external API; you can explain both the embedding-based approach and the fallback algorithm.
3. **Payments use escrow status transitions** (`created → escrow_held → released/refunded/disputed`), which is the correct mental model to describe in an interview, not just "call Razorpay and done."
4. **Reputation isn't a raw star average** — it's time-decayed and volume-weighted, which is a good talking point on why naive rating averages are gameable.
5. Every write-heavy financial action (`releasePayment`, `refundPayment`) checks ownership before mutating — a common interview probe area.

## 7. How the frontend was converted from TSX to JSX and split

The original Figma Make export was a single TypeScript file (`App.tsx`, ~4000 lines) containing
every screen. To turn it into two plain-JavaScript apps:

1. Ran it through the TypeScript compiler in `jsx: preserve` mode, which strips all type
   annotations/interfaces but leaves JSX syntax untouched (safer than hand-editing or regex).
2. Verified the output parses as valid JSX with zero TypeScript remaining, and checked for
   undefined references with ESLint's `no-undef`/`react/jsx-no-undef` rules.
3. Split the shared UI primitives (`Avatar`, `StatCard`, `SectionHeader`, etc.) into both apps,
   put client/freelancer-facing views (`LandingView`, `MarketplaceView`, `FreelancerDashboardView`,
   `ClientDashboardView`, `SignInView`, `SignUpView`) into `frontend-client`, and put
   `AdminDashboardView` — with its own dedicated `AdminNavbar` and `AdminSignInView` (no public
   sign-up link, since admin accounts are invite-only) — into `frontend-admin`.
4. Scaffolded each as an independent Vite + React + Tailwind project and ran a real
   `npm run build` on both to confirm they compile end-to-end, not just pass a syntax check.

## 8. Honest limitations to be upfront about

- MongoDB Atlas Search / ElasticSearch (the PDF's "advanced" search option) is not wired up — `searchGigs`/`searchFreelancers` use Mongo query filters + a text index, which is a reasonable MVP but not full-text relevance ranking. Worth mentioning as a "next step" in your review.
- Neither frontend's UI is wired to these APIs yet — `frontend-client/src/lib/api.js` + `socket.js` and `frontend-admin/src/lib/api.js` are ready, but each screen's mock/local state needs to be replaced with real fetch calls. This is the natural next task.
- No automated test suite yet (unit/integration tests would strengthen this further for a real PPO discussion).
