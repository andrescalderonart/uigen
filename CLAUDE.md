# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies, generate Prisma client, run migrations
npm run setup

# Development server (Turbopack)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run a single test file
npx vitest src/path/to/__tests__/file.test.ts

# Lint
npm run lint

# Reset database
npm run db:reset
```

The dev server requires `NODE_OPTIONS='--require ./node-compat.cjs'` — this is already in the npm scripts and handles Node.js polyfills needed for client-side Babel usage.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in a chat interface; the AI writes code into a virtual file system that renders as a live preview.

### Core Data Flow

1. User sends a message → `/api/chat/route.ts` streams a response from Anthropic Claude (Haiku 4.5)
2. The AI uses two tools during generation:
   - `str_replace_editor` — create/update/insert code in files
   - `file_manager` — rename/delete files
3. Tool calls are executed client-side via `FileSystemContext`, mutating an in-memory `VirtualFileSystem`
4. `PreviewFrame` watches the virtual FS, transforms files with Babel (client-side), and renders them in a sandboxed iframe
5. On stream completion, the full file state + messages are persisted to SQLite via Prisma

### Key Abstractions

**`VirtualFileSystem`** (`src/lib/file-system.ts`) — In-memory file tree. No disk I/O. Serializes to JSON for database storage. Path alias `@/` maps to the root of this FS.

**`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`) — React context wrapping `VirtualFileSystem`. Handles AI tool calls that mutate files and exposes file operations to UI components.

**`ChatContext`** (`src/lib/contexts/chat-context.tsx`) — Wraps Vercel AI SDK's `useChat`. Dispatches AI tool calls to `FileSystemContext`. Tracks anonymous usage in localStorage.

**`jsx-transformer.ts`** (`src/lib/transform/`) — Runs Babel standalone in the browser to transpile JSX/TSX, builds import maps for module resolution, and produces a self-contained HTML blob for the iframe.

**`PreviewFrame`** (`src/components/preview/`) — Renders the transformed output in a sandboxed iframe. Entry point auto-detection: `App.jsx` → `index.jsx` → first `.jsx` file.

### AI System Prompt

Located in `src/lib/prompts/generation.tsx`. Key constraints the AI follows:
- `/App.jsx` is always the entry point
- All styling via Tailwind CSS classes only
- Use `@/` imports for cross-file references within the virtual FS
- React must be imported explicitly

### Authentication

JWT sessions in HTTP-only cookies (7-day expiry). All auth logic is in `src/lib/auth.ts` and `src/actions/`. Anonymous users can use the app — their work is tracked via `anon-work-tracker.ts` and can be saved when they sign up.

### Database

Prisma + SQLite (`prisma/dev.db`). Two models: `User` and `Project`. Project `messages` and `data` (file system state) are stored as JSON strings.

### Environment

`ANTHROPIC_API_KEY` in `.env` enables real AI generation. Without it, the app falls back to a mock provider (`src/lib/provider.ts`).
