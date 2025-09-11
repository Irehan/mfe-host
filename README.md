# Host Container — React + TypeScript + Webpack Module Federation

The **Host** is the shell app that provides **routing**, **shared state (user + theme)**, and **dynamic runtime loading** of Micro‑Frontends (MFEs). It discovers MFEs at **runtime** from a **registry** (local Express or Vercel serverless) and falls back to a static **`config.json`** — so changing remote URLs does **not** require rebuilding the host.

Live:
- Host (Vercel): https://arh-mfe-host.vercel.app/
- Host (Local): http://localhost:3000/
- Registry (Local Express): http://localhost:4000/registry
- Registry (Vercel serverless): https://arh-mfe-registry.vercel.app/api/registry
- Example remote entry (Booking): https://arh-mfe-booking.vercel.app/remoteEntry.js

---

## 📁 Project Structure

```
packages/host/
├─ public/
│  ├─ index.html
│  └─ config.json            # static fallback MFEs & defaults
├─ src/
│  ├─ components/
│  │  ├─ ThemeProvider.tsx   # theme context (light/dark/system) + persistence
│  │  ├─ ThemeSwitcher.tsx   # theme toggle UI
│  │  ├─ RequireRole.tsx     # role-based route guard
│  │  └─ ModuleFederationErrorBoundary.tsx  # per-remote error isolation + retry
│  ├─ context/
│  │  └─ AppContext.tsx      # central app state (user + config + loader)
│  ├─ utils/
│  │  ├─ configLoader.ts     # resolve registry URL or /config.json and merge
│  │  ├─ eventBus.ts         # global event bus (auth/login & auth/logout, etc.)
│  │  ├─ moduleLoader.ts     # dynamic loader for remoteEntry & exposed modules
│  │  └─ registrySeeder.ts   # optional: seed local/remote registry from static
│  ├─ RemoteModule.tsx       # dynamic remote renderer + prop injection
│  ├─ bootstrap.tsx          # mount + (optional) seed registry before load
│  └─ index.tsx
└─ webpack.config.js         # MF config + HtmlWebpackPlugin + CopyPlugin(ignore index.html)
```

---

## 1) Setup

### Quick Start (development)
```bash
# monorepo root
npm install

# start all (host + mfes + local registry)
npm run start:all

# OR start only the host
npm --prefix packages/host start   # http://localhost:3000
```

### Build
```bash
npm --prefix packages/host run build
# → packages/host/dist
```

### Deploy to Vercel (static)
- **Project Root**: `packages/host`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**: `VITE_REGISTRY_URL = https://arh-mfe-registry.vercel.app/api/registry`
- **SPA routing** (optional `vercel.json` at repo root):
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

> For local testing without a registry URL, ensure `public/config.json` contains MFEs.

---

## 2) Architecture Decisions

- **Runtime discovery & merge**
  - Resolve config in order: **`VITE_REGISTRY_URL` → `public/config.json`**.
  - Merge by `scope` so **registry overrides** static entries.
- **Module Federation container**
  - Host loads remotes dynamically from runtime config (no hard‑coded URLs).
  - **Shared singletons**: `react`, `react-dom`, `react-router-dom`.
  - **Exposes**: `./ThemeProvider`, `./ThemeSwitcher` for reuse.
- **State composition (AppContext)**
  - Holds `{ user, config, loading }`, **hydrates user** from localStorage,
    listens to `auth:login` / `auth:logout` on the event bus,
    provides `setUser()` and `refreshConfig()`.
- **Error isolation & resilience**
  - `ModuleFederationErrorBoundary` wraps every remote,
    shows friendly fallback UI, and performs **exponential backoff retries**
    with a “Report Error” console dump for diagnostics.
- **Theming**
  - `ThemeProvider` supports **light/dark/system**, persists preference,
    and toggles `<html data-theme>`.
- **Optional Registry Seeding**
  - In dev, `registrySeeder` can POST `public/config.json` entries to a registry
    so reviewers can test the runtime discovery path immediately.

---

## 3) Communication Design

- **Global event bus**
  - Emits: `auth:login`, `auth:logout`, `booking:created`, `booking:updated`.
  - Consumers update UI/charts across MFEs in real time.
- **Prop contracts to MFEs**
  - `authApp ./Login` → `onLogin(user)`; Host stores user and navigates.
  - `authApp ./UserProfile` → `onLogout()`; Host clears user.
  - `reportingApp ./ReportDashboard` receives `{ user }` to enforce **admin‑only** access.
- **Registry contract**
  - Host fetches `{ microFrontends }` from the registry and, per entry,
    loads `remoteEntry.js` then the exposed `module` under its `scope`.

---

## ⚙️ Runtime Configuration Example (`public/config.json`)

```json
{
  "microFrontends": [
    {
      "name": "auth-app",
      "url": "http://localhost:3001/remoteEntry.js",
      "module": "./Login",
      "scope": "authApp",
      "routes": ["/login", "/profile"],
      "displayName": "Authentication",
      "roles": ["user", "admin"]
    },
    {
      "name": "booking-app",
      "url": "http://localhost:3002/remoteEntry.js",
      "module": "./BookingList",
      "scope": "bookingApp",
      "routes": ["/bookings", "/book"],
      "displayName": "Booking Management",
      "roles": ["user", "admin"]
    },
    {
      "name": "reporting-app",
      "url": "http://localhost:3003/remoteEntry.js",
      "module": "./ReportDashboard",
      "scope": "reportingApp",
      "routes": ["/reports"],
      "displayName": "Reporting",
      "roles": ["admin"]
    }
  ],
  "fallbackConfig": {
    "showErrorBoundary": true,
    "retryAttempts": 3,
    "retryDelay": 1000
  }
}
```

---

## 🧪 Seed a Registry (optional)

### Local (Express)
```bash
curl -s -X POST http://localhost:4000/registry -H 'Content-Type: application/json' -d '{
  "name":"auth-app","displayName":"Authentication","scope":"authApp",
  "url":"https://arh-mfe-auth.vercel.app/remoteEntry.js",
  "routes":["/login","/profile"],"roles":["user","admin"],"module":"./Login"
}'
```

### Vercel (serverless)
```bash
EP=https://arh-mfe-registry.vercel.app/api/registry
curl -s -X POST "$EP" -H 'Content-Type: application/json' -d '{
  "name":"booking-app","displayName":"Booking Management","scope":"bookingApp",
  "url":"https://arh-mfe-booking.vercel.app/remoteEntry.js",
  "routes":["/bookings","/book"],"roles":["user","admin"],"module":"./BookingList"
}'
```

---

## ✅ Reviewer Checklist

- Host runs at `http://localhost:3000` and loads MFEs dynamically at runtime
- Switching between local and Vercel registry requires **no rebuild**
- Error boundary isolates failing remotes and retries intelligently
- Shared libraries (React/DOM/Router) are singletons
- Theming is togglable and persists across reloads
- Clear build/deploy instructions and SPA routing
