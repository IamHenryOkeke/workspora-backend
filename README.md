# Workspora Backend

A multi-tenant organization and project management API. Users create organizations, invite members, assign roles, and manage projects with member-level access control.

## Tech Stack

- **Node.js** + **Express** (TypeScript)
- **PostgreSQL** with **Prisma** ORM
- **Passport** for authentication (local + Google OAuth)
- **BullMQ** for background jobs (email delivery)
- **Zod** for request validation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis (for the email queue)

### Setup

```bash
# Install dependencies
npm install

# Set up your environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Generate the Prisma client
npx prisma generate

# Start the dev server
npm run dev
```

### Environment Variables

```
DATABASE_URL=          # PostgreSQL connection string
REDIS_URL=             # Redis connection for BullMQ
ACCESS_TOKEN_SECRET=   # Secret for access signing tokens
REFRESH_TOKEN_SECRET=  # Secret for refresh signing tokens
GOOGLE_CLIENT_ID=      # Google OAuth
GOOGLE_CLIENT_SECRET=  # Google OAuth
```

## Project Structure

```
src/
  common/       Shared schemas (pagination, etc.)
  config/       CORS, Passport configuration
  error/        AppError class and error handling
  generated/    Prisma client (generated)
  lib/          Prisma client instance
  middleware/   Auth, validation, error middleware
  modules/      Feature modules (see below)
  queues/       BullMQ queues
  routes/       Route definitions
  types/        Shared TypeScript types
  utils/        Helpers (slug, token, queue config)
  workers/      BullMQ workers
  app.ts        Express app setup
  server.ts     Server entry point
```

Each module follows the same layered shape:

```
modules/<name>/
  <name>.repository.ts   Database queries (Prisma)
  <name>.service.ts      Business logic and authorization
  <name>.controller.ts   Request/response handling
  <name>.schema.ts       Zod validation schemas
```

## Modules

- **auth** — Registration, login, email verification, password reset, Google OAuth
- **user** — Profile management
- **organization** — Create and manage organizations
- **member** — Manage members within an organization (list, roles, removal)
- **invitation** — Invite people to an organization by email
- **project** — Create and manage projects within an organization
- **projectMember** — Assign organization members to projects

## Core Concepts

### Layering

Requests flow through four layers. Each has one job:

- **Repository** runs Prisma queries and nothing else. No business rules.
- **Service** holds business logic and authorization checks.
- **Controller** reads the request, calls the service, sends the response.
- **Middleware** handles auth, validation, and centralized error responses.

Errors thrown anywhere propagate to a single error middleware, which decides the status code and response shape. Known errors use `AppError`; everything else becomes a generic 500.

### Soft Deletes

Most records are soft-deleted with a `deletedAt` timestamp rather than being removed. Queries filter out soft-deleted rows by default.

### Roles

Organization members have one of three roles:

- **OWNER** — Full control, including deleting the organization
- **ADMIN** — Manage members and projects, but not delete the organization
- **MEMBER** — Limited access; sees only projects they're assigned to

### Invitations

People are invited by email. An invitation exists before the invitee has an account, so the flow works for both existing and new users. Invitation tokens are hashed before storage and delivered by email. Accepting an invitation creates the membership.

### Multi-Tenancy

Every organization-scoped query is filtered by organization, so members of one organization can't access another's data. Authorization is enforced in the service layer on every request.

## Available Scripts

```bash
npm run dev       # Start the development server
npm run build     # Compile TypeScript
npm start         # Run the compiled build
npx prisma studio # Open the database GUI
```

## License

Private.
