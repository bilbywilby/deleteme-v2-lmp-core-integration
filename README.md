# Cloudflare Workers Full-Stack Template

[![Deploy to Cloudflare][![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bilbywilby/deleteme-v2-lmp-core-integration)]

A production-ready full-stack application template built with Cloudflare Workers for the backend API, React for the frontend, and Durable Objects for persistent storage. Features real-time chat boards, user management, and seamless local development with hot reload.

## ✨ Features

- **Serverless Backend**: Hono-based API with automatic CORS, logging, and error handling.
- **Persistent Storage**: Custom Durable Objects implementing indexed entities (Users, Chats, Messages) with pagination, CRUD, and seeding.
- **Modern Frontend**: React 18 + Vite + TanStack Query for data fetching/caching + Shadcn/UI components + Tailwind CSS.
- **Real-time Chat Demo**: Create chats, send messages, list users—all powered by Durable Objects.
- **Type-Safe**: Full TypeScript with shared types, Workers types, and path mappings.
- **Development Ready**: Bun-powered scripts, hot reload, local preview, and one-command deployment.
- **Production Optimized**: SQLite-backed Durable Objects, pagination, optimistic updates-ready.
- **UI/UX Excellence**: Dark mode, responsive design, animations, theme toggle, sidebar layout.
- **Error Handling**: Global error boundaries, client error reporting to API.

## 🛠️ Tech Stack

### Frontend
- React 18, Vite 6
- TanStack Query (React Query)
- Shadcn/UI + Radix UI + Tailwind CSS + Lucide Icons
- React Router, Framer Motion, Sonner (Toasts)
- Zustand (state), Immer (immutability)

### Backend
- Cloudflare Workers + Hono 4
- Durable Objects (GlobalDurableObject + IndexedEntity pattern)
- TypeScript with Workers types

### Tools
- Bun (package manager/runtime)
- Wrangler (CLI deployment)
- ESLint + TypeScript 5.8

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) installed
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/) installed and logged in (`wrangler login`)

### Installation
```bash
git clone <your-repo-url>
cd <project-name>
bun install
```

### Development
```bash
# Start dev server (frontend + API proxy)
bun run dev

# Open http://localhost:3000 (or $PORT)
```

Changes to `worker/user-routes.ts` or `worker/entities.ts` hot-reload automatically.

### Build for Production
```bash
bun run build
```

Assets are built to `dist/` and ready for deployment.

## 📚 Usage Examples

### API Endpoints
All endpoints under `/api/` with JSON responses `{ success: boolean; data?: T; error?: string }`.

#### Users
```bash
# List users (paginated)
curl "http://localhost:3000/api/users?limit=10"

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe"}'

# Delete user
curl -X DELETE http://localhost:3000/api/users/:id
```

#### Chats
```bash
# List chats
curl "http://localhost:3000/api/chats"

# Create chat
curl -X POST http://localhost:3000/api/chats \
  -H "Content-Type: application/json" \
  -d '{"title": "My Chat"}'

# List messages in chat
curl "http://localhost:3000/api/chats/:chatId/messages"

# Send message
curl -X POST http://localhost:3000/api/chats/:chatId/messages \
  -H "Content-Type: application/json" \
  -d '{"userId": "u1", "text": "Hello!"}'
```

### Frontend Customization
- Replace `src/pages/HomePage.tsx` with your app.
- Use `src/lib/api-client.ts` for type-safe API calls.
- Extend `worker/entities.ts` for new entities.
- Add routes in `worker/user-routes.ts`.
- UI components in `src/components/ui/` (Shadcn).

Shared types: `shared/types.ts`.

## ☁️ Deployment

1. Ensure Wrangler is authenticated: `wrangler login`
2. Deploy:
   ```bash
   bun run deploy
   ```
   Or manually: `bun run build && wrangler deploy`

Your app will be live at `https://<worker-name>.<your-subdomain>.workers.dev`.

[Deploy instantly to Cloudflare][![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bilbywilby/deleteme-v2-lmp-core-integration)

### Custom Domain
```bash
wrangler deploy --var CUSTOM_DOMAIN:yourdomain.com
```
Update `wrangler.jsonc` for bindings/migrations as needed.

## 🔧 Project Structure

```
├── src/                 # React frontend (Vite)
├── worker/              # Cloudflare Workers API (Hono + DOs)
├── shared/              # Shared TypeScript types
├── dist/                # Built assets (gitignored)
├── wrangler.jsonc       # Workers config (DOs, migrations)
└── package.json         # Bun scripts + deps
```

## 🤝 Contributing

1. Fork & clone
2. `bun install`
3. `bun run dev`
4. Add features/tests
5. PR with clear description

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

## 🚀 Next Steps

- Add authentication (e.g., Cloudflare Access)
- Integrate AI (Workers AI)
- Deploy Vectorize for search
- Extend with Pages Functions or KV

Built with ❤️ for Cloudflare Workers. Questions? Open an issue!