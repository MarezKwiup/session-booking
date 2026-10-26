# Session Booking API

A REST API where teachers publish available time slots, users book them, and completed sessions appear in the user's history.

Built with **Node.js, TypeScript, Express 5, MongoDB and Mongoose**. Request validation uses **zod**.

---

## Contents

- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Testing with Postman](#testing-with-postman)
- [Project structure](#project-structure)
- [Technical choices](#technical-choices)
- [Assumptions and spec interpretations](#assumptions-and-spec-interpretations)
- [Trade-offs and what I'd do next](#trade-offs-and-what-id-do-next)

---

## Quick start

**Prerequisites:** Node.js 20+, and MongoDB 5.0+ (a free MongoDB Atlas cluster or a local `mongod`).

```bash
git clone https://github.com/MarezKwiup/session-booking
cd session-booking-system
npm install

cp .env.example .env          # then set MONGODB_URI
npm run db:sync-indexes       # creates the collections' indexes
npm run dev                   # http://localhost:3000
```

Check that it's up:

```bash
curl localhost:3000/health
# {"status":"ok","db":"up"}
```

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Starts the server with hot reload (`tsx watch`) |
| `npm run build` | Compiles TypeScript to `dist/` |
| `npm start` | Runs the compiled build |
| `npm run typecheck` | Type-checks without emitting |
| `npm run db:sync-indexes` | Builds the indexes defined on the models and prints them |

---

## Environment variables

All configuration comes from environment variables. They are validated with zod at startup, so the process exits immediately with a clear message if any is missing or invalid.

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | yes | — | Connection string, including the database name, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/session_booking` |
| `PORT` | no | `3000` | HTTP port |
| `NODE_ENV` | no | `development` | `development` / `production` / `test`. Stack traces are only returned in development. |
| `DEFAULT_TIMEZONE` | no | `UTC` | IANA timezone that defines a calendar day for `GET /sessions/available` when the request doesn't pass `timezone`, e.g. `Asia/Kolkata` |

---

## API reference

### Response format

Successful responses:

```json
{ "success": true, "data": { } }
```

Errors all have the same shape. `details` is present for validation errors:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [{ "location": "body", "field": "email", "message": "Invalid email" }]
  }
}
```

### Endpoints

| # | Method | Path | Success | Errors |
|---|---|---|---|---|
| – | GET | `/health` | 200 | 503 if the DB is down |
| 1 | POST | `/users` | 201 | 400, 409 |
| – | POST | `/teachers` | 201 | 400, 409 |
| 2 | POST | `/sessions` | 201 | 400, 404, 409 |
| 3 | GET | `/sessions/available?dateTimestamp=&timezone=` | 200 | 400 |
| 4 | POST | `/sessions/:id/book` | 200 | 400, 404, 409 |
| 5 | PATCH | `/sessions/:id/complete` | 200 | 400, 404, 409 |
| 6 | GET | `/users/:id/sessions` | 200 | 400, 404 |

**Status code meanings:**
- **400:** malformed input, such as invalid JSON, a failed validation, or a malformed ObjectId.
- **404:** a well-formed id that doesn't exist.
- **409:** the request conflicts with current state: a duplicate email, an overlapping slot, or a status transition that isn't allowed.

### 1. Create user: `POST /users`

```json
{ "fullName": "Vardan Sharma", "email": "vardan@example.com", "phone": "+91 98765 43210" }
```

- Email is unique. It is case-insensitive because it is lowercased before saving, so `Vardan@x.com` and `vardan@x.com` count as the same.
- Returns **201** with the created user, or **409** if the email is taken.

### Create teacher: `POST /teachers` (supporting endpoint)

```json
{ "fullName": "Asha Rao", "email": "asha@example.com", "specialization": "Mathematics", "experience": 6 }
```

`experience` is in years. Returns **201**, or **409** if the email is taken.

### 2. Create session: `POST /sessions`

```json
{ "teacherId": "<teacherId>", "startTime": "2026-10-26T10:00:00+05:30", "endTime": "2026-10-26T11:00:00+05:30" }
```

- `startTime` and `endTime` can be ISO-8601 strings or Unix timestamps, in seconds or milliseconds.
- The status defaults to `AVAILABLE`.
- Errors:
  - **400** if `endTime <= startTime`.
  - **404** if the teacher doesn't exist.
  - **409** if the slot overlaps another session of the same teacher.

### 3. Available sessions: `GET /sessions/available`

| Query param | Required | Description |
|---|---|---|
| `dateTimestamp` | yes | Any moment on the wanted day: a Unix timestamp in seconds or milliseconds, or an ISO string |
| `timezone` | no | IANA timezone that defines "the day". Defaults to `DEFAULT_TIMEZONE` |

```
GET /sessions/available?dateTimestamp=1792989000000&timezone=Asia/Kolkata
```

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "...",
      "teacher": { "_id": "...", "fullName": "Asha Rao", "email": "asha@example.com", "specialization": "Mathematics", "experience": 6 },
      "startTime": "2026-10-26T04:30:00.000Z",
      "endTime": "2026-10-26T05:30:00.000Z",
      "status": "AVAILABLE",
      "createdAt": "..."
    }
  ]
}
```

Returns `AVAILABLE` sessions starting on that calendar day, sorted by `startTime`, with teacher details embedded. This is implemented with an aggregation pipeline.

### 4. Book session: `POST /sessions/:id/book`

```json
{ "userId": "<userId>" }
```

- Sets the status to `BOOKED` and associates the user.
- Errors:
  - **404** if the user or session doesn't exist.
  - **409** if the session isn't `AVAILABLE`. The message includes the current status.

### 5. Complete session: `PATCH /sessions/:id/complete`

- Sets the status to `COMPLETED` and sets `completedAt`.
- Errors: **404** if the session doesn't exist, **409** if it isn't `BOOKED`.

### 6. User's sessions: `GET /users/:id/sessions`

```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "fullName": "Vardan Sharma", "email": "vardan@example.com", "phone": "+91 98765 43210" },
    "upcomingSessions": [ { "_id": "...", "teacher": { }, "startTime": "...", "endTime": "...", "status": "BOOKED", "completedAt": null } ],
    "completedSessions": [ { "_id": "...", "teacher": { }, "startTime": "...", "endTime": "...", "status": "COMPLETED", "completedAt": "..." } ],
    "counts": { "upcoming": 1, "completed": 1 }
  }
}
```

- Upcoming sessions are sorted soonest first.
- Completed sessions are sorted most recently completed first.
- A user with no sessions gets empty arrays. A user that doesn't exist gets a **404**.
- This is implemented with an aggregation pipeline.

---

## Testing with Postman

Import `session-booking-api.postman_collection.json`. It contains 24 requests: the happy path for every API plus each error case in the brief.

- **Run the whole collection** in order with the Collection Runner. Each request saves the ids the later ones need (`userId`, `teacherId`, `sessionId`, …), and each one asserts its expected status code.
- **It can be run repeatedly.** Emails are generated per run, and the sessions are created for tomorrow, 10:00–11:00 and 12:00–13:00 IST, under a newly created teacher.
- `baseUrl` (default `http://localhost:3000`) and `timezone` (default `Asia/Kolkata`) are collection variables.

---

## Project structure

```
src/
├── index.ts                  # Entry: connect DB, start server, graceful shutdown
├── app.ts                    # Express app factory (no listen; importable for tests)
├── routes.ts                 # Mounts module routers
├── config/
│   ├── env.ts                # zod-validated environment variables
│   └── db.ts                 # Mongoose connect / disconnect
├── models/                   # User, Teacher, Session schemas + indexes
├── modules/                  # Feature modules: routes → controller → service
│   ├── user/
│   ├── teacher/
│   └── session/
├── pipelines/
│   └── session.pipelines.ts  # Aggregation pipelines for APIs 3 and 6
├── validators/               # zod schemas (shared ObjectId / date helpers in common.ts)
├── middlewares/
│   ├── validate.ts           # Validates params/query/body → res.locals
│   └── errorHandler.ts       # 404 handler + centralised error handler
└── utils/
    └── ApiError.ts           # Typed HTTP errors thrown by services
scripts/
└── sync-indexes.ts
```

Each layer has one job:
- **Routes** declare the URL and its middleware chain.
- **Validators** define what input is accepted.
- **Controllers** only translate between HTTP and the service.
- **Services** hold the business rules and never touch `req` or `res`.
- **Models** handle persistence.

---

## Technical choices

### Express 5 and async/await: no `asyncHandler`, no try/catch in controllers

The brief asks for async/await only and centralised error handling. Express 5 provides both natively. When an async route handler returns a rejected promise, Express 5 passes the error to the error middleware itself. Services just `throw ApiError.notFound(...)`, and one error handler turns every error into a response.

This is version-dependent. Express 4 ignores the promise a handler returns, so the same code on Express 4 crashes the process: a rejection thrown after an `await` becomes an unhandled rejection, and Node exits by default. I hit exactly this during development, when the app had resolved to a stray Express 4 install. Express 4 code needs an `asyncHandler(fn)` wrapper around every route (`fn(req, res, next).catch(next)`). Express 5 makes that boilerplate unnecessary, which is why handlers are passed to the router directly.

The error handler maps:
- `ApiError` to its own status code.
- Mongoose `ValidationError` and `CastError` to 400.
- Duplicate-key error `11000` to 409.
- Malformed JSON to 400.
- Anything else to 500, logged, with the stack trace only in development.

### API 3: `/sessions/available` uses a two-stage `$match`

"Sessions on date X" depends on a timezone. Midnight IST is 18:30 UTC on the previous day, so a plain UTC day range would put an IST user's 1 AM session on the wrong day. The pipeline handles this in two stages:

1. **Coarse, index-backed range:** `status: AVAILABLE` and `startTime` within ±24h of the given timestamp. Whatever the timezone, the local day containing that moment lies inside this window. This is an ordinary range query, so it uses the `{ status, startTime }` index.
2. **Exact match:** `$expr` with `$dateTrunc` (unit `day`, with the timezone) keeps only sessions whose start falls on the same local calendar day. MongoDB handles UTC offsets and DST.

**Why not only stage 2?** `$expr` computes a value for every document, so it can't use an index. On its own it would be a full collection scan. Stage 1 narrows the input to about two days of available sessions first.

**Why not compute the day boundaries in JS?** You could, but that means hand-rolling timezone and DST math. Letting the database do it is less code, and stage 1 keeps it fast.

After that, the stages are `$sort` by `startTime`, a `$lookup` for the teacher (with a sub-pipeline `$project`, so only public teacher fields are joined), and a `$project` to shape the response. Filtering comes first so the join only runs on the documents that are returned.

### API 6: `/users/:id/sessions` starts from `users`, not `sessions`

The pipeline begins with `$match: { _id }` on the `users` collection, then runs two `$lookup`s into `sessions`, one for `BOOKED` and one for `COMPLETED`. Each has its own sort and a nested teacher `$lookup`. A final `$project` adds `counts` using `$size`.

Starting from `users` means a single round trip both checks that the user exists and fetches their sessions. If no document comes back, the response is a 404. The alternative I considered was starting from `sessions` and using `$facet` to split by status. That can't tell "user doesn't exist" apart from "user has no sessions" without a second query.

Both lookups use the `{ userId, status }` index: `localField`/`foreignField` gives the equality on `userId`, and the inner `$match` gives the equality on `status`.

**Gotcha: aggregation doesn't cast types.** `find({ _id: "64b…" })` works because Mongoose casts the string to an ObjectId. `aggregate()` sends the pipeline to MongoDB as is, so a string `_id` would silently match nothing. The service converts the id with `new Types.ObjectId()`, which is safe because zod has already validated its format.

### Booking and completing use atomic conditional updates

The obvious approach, "read the session, check it's AVAILABLE, then save", has a race. Two concurrent bookings both read AVAILABLE, both save, and the second one silently overwrites the first. Instead, the business rule goes in the update filter:

```ts
SessionModel.findOneAndUpdate(
  { _id, status: 'AVAILABLE', userId: null },
  { $set: { status: 'BOOKED', userId } },
  { returnDocument: 'after' },
);
```

A single-document update is atomic in MongoDB, so only one concurrent request can still match `AVAILABLE`. Every other request gets `null` and a 409. This is optimistic concurrency where the status field acts as the version, so no transactions or locks are needed.

Completing works the same way, with the filter `status: 'BOOKED'`. The filters also enforce the state machine `AVAILABLE → BOOKED → COMPLETED` without any `if` statements.

When an update matches nothing, a second query works out the reason: the session doesn't exist (404), or it's in the wrong state (409, with the current status in the message). The happy path stays a single round trip.

**Verified under concurrency:** 10 simultaneous booking requests for the same session returned exactly one `200` and nine `409`s.

```bash
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST localhost:3000/sessions/$S/book \
    -H 'Content-Type: application/json' -d "{\"userId\":\"$U\"}" &
done; wait
```

### Indexes follow query shapes (ESR: Equality, Sort, Range)

| Index | Serves |
|---|---|
| `users.email` (unique) | Duplicate-email protection |
| `teachers.email` (unique) | Duplicate-email protection |
| `sessions { status, startTime }` | API 3: equality on status, then range and sort on `startTime` |
| `sessions { userId, status }` | API 6: both lookups |
| `sessions { teacherId, startTime }` | Overlap check when creating a session |

**Email uniqueness relies on the unique index, not only on app code.** The service checks first so it can return a clear message. Two requests in the same millisecond could both pass that check, so the index is the real guarantee: the second insert fails with `E11000`, which the error handler maps to 409.

### Validation

zod schemas validate `params`, `query` and `body` in one middleware. All problems are reported together, not one at a time. The parsed output goes to `res.locals`, for two reasons: Express 5 makes `req.query` read-only, and the parsed values differ from the raw input (emails lowercased, timestamps turned into `Date`s). Controllers therefore only ever see clean, typed data.

Times are accepted as ISO-8601 strings or Unix timestamps. Numeric values below `1e12` are treated as seconds, and anything larger as milliseconds. `1e12` ms is September 2001, so no real millisecond timestamp is that small. Times are stored as BSON `Date`, which is what lets the pipeline use date operators like `$dateTrunc`.

ObjectIds are checked against `^[a-f0-9]{24}$`, because Mongoose's `isValid` accepts any 12-character string.

---

## Assumptions and spec interpretations

- **`POST /teachers` was added.** Sessions need a `teacherId`, and the brief has no other way to create teachers.
- **The booking user comes from the request body** (`{ "userId": "..." }`). There's no authentication in scope. With JWT auth, the user id would come from the token instead.
- **"Upcoming" means `BOOKED`.** `AVAILABLE` sessions have no user, so they can't belong in a user's list. Because the split follows status, a BOOKED session whose time has passed but that nobody marked complete still shows as upcoming. Status is the source of truth, and the brief defines completion through an explicit API.
- **Completing a session isn't time-gated.** The brief doesn't require it. Adding `endTime: { $lte: new Date() }` to the completion filter would prevent completing a session before it ends.
- **A teacher can't have overlapping sessions.** This isn't in the brief, but double-booking a teacher would be a real bug. Back-to-back sessions (10–11 and 11–12) are allowed.
- **Teacher email is unique,** the same as user email.
- **Wrong-state transitions return 409 Conflict.** The request is well-formed and the resource exists, but it conflicts with the resource's current state. 422 would also be defensible.
- **`dateTimestamp` can be any moment on the wanted day,** not only midnight. The optional `timezone` parameter decides which calendar day that is.

---

## Trade-offs and what I'd do next

- **Overlap check race.** Two concurrent creates for the same teacher and slot can both pass the overlap check. Closing that fully needs a transaction or a per-teacher lock, for example a `$inc` on a counter field of the teacher document inside a transaction. I judged that out of scope here.
- **Authentication and authorization.** Add JWT auth, take `userId` from the token, and allow only teachers to create sessions or mark them complete.
- **Pagination** for `/sessions/available` and the user's completed history, which grows without limit.
- **Automated tests** with Jest, supertest and `mongodb-memory-server`, covering the same cases as the Postman collection. `createApp()` is already separate from `listen()`, so this is straightforward to add.
- **Small REST polish:** a `Location` header on 201 responses, and request IDs in logs.