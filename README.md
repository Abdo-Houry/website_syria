# Sak — Web Client

One application, two separate experiences:

| Route | Audience | Shape |
| --- | --- | --- |
| `/` and below | Visitor | A tourism experience, with nothing administrative about it |
| `/admin` and below | Administrator | An admin panel with a sidebar and tables |

**The visitor experience** is the digital companion to the printed passport. The
journey starts from the passport the visitor bought: the passport determines the
province, and the province determines the places, challenges, stamps and
partners. **Every passport is a completely independent journey** — progress
never bleeds from one to another. There is no sidebar, no table and no CRUD
surface here, by design.

**The admin panel** manages content, passports, their printed copies and QR
codes. The sidebar and tables are deliberate there — the restraint above applies
to the visitor experience alone.

**Sign-in is unified**: a single `/login` page for everyone. The backend derives
the role from the account itself (a username means an administrator, a phone
number means a visitor) and routes each to their own space. The two sessions
stay fully separate even so: each keeps its own token in local storage
(`tourist.token` and `tourist.adminToken`) and its own expiry handling, so both
experiences can be open in the same browser without clashing. The entire admin
bundle is **loaded on demand**, so an ordinary visitor never pays for it.

---

## Languages

Four languages — **العربية · English · Deutsch · Türkçe** — on two levels.

### Interface text

Dictionaries live in `src/i18n/messages/`. `ar.ts` is the source of truth, and
TypeScript requires every key to exist in the other three, so a missing
translation cannot slip through. `LocaleProvider` sets `<html lang dir>`
automatically — Arabic renders RTL, the rest LTR — and the language switcher is
available in the app bar, the auth layout, the admin sidebar and the account
page.

```tsx
const t = useT();
t("journey.greeting", { name: "Hamza" });
```

### Content text

Arabic is stored in the entity's own columns; the other languages live in a
`jsonb` `translations` column:

```jsonc
{ "en": { "name": "Aleppo" }, "de": { "name": "Aleppo" }, "tr": { "name": "Halep" } }
```

In the panel, each language gets a tab underneath the Arabic fields
(`TranslationsEditor`). In the app, `tField(entity, "name", locale)` reads the
translation and **falls back to Arabic** when it is missing, so a field is never
blank.

Translated entities: provinces · places · challenges · stamps · partners · FAQs ·
passports.

---

## Media and location

- **Real uploads, not URLs.** Stamp images, partner logos and user avatars are
  uploaded from the device via `POST /api/uploads/:folder/image`. The server
  validates the file type and caps uploads at 25MB.
- **Optimised on arrival.** The server rewrites every uploaded image to WebP at a
  width suited to where it is shown, so a photo straight off a phone arrives at a
  fraction of its original weight.
- **Multi-item galleries.** Provinces and places accept up to 10 images and 5
  videos at once, and any single item can be removed (`MediaManager`).
- **Map picker.** Instead of typing latitude and longitude — a Leaflet map with
  search (Nominatim), a draggable marker and a "my location" button. The map is
  loaded on demand (~146KB), so it never weighs down the first page.

---

## Installable and offline-capable

The client ships as a PWA: visitors can install it to the home screen, and the
application shell keeps working without a connection — which matters at the
castles, markets and museums where the QR codes actually live.

Only the build output is precached, and it is addressed by content hash, so a new
release can never be served from a stale cache. **API responses are never
cached**, so journey data is always read from the network.

---

## Running it

```bash
npm install
```

```bash
npm run dev
```

The client runs on `http://localhost:5173` and expects the backend on
`http://localhost:5000`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Type-check and production build |
| `npm run typecheck` | Type-check only |
| `npm run preview` | Preview the production bundle |

### Environment

Copy `.env.example` to `.env`:

```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ASSETS_BASE_URL=http://localhost:5000
```

`VITE_ASSETS_BASE_URL` turns the relative media paths the backend returns
(`/uploads/places/x.jpg`) into absolute URLs.

> Before building for production, point both variables at the deployed API. The
> build inlines them, so a bundle built with `localhost` will not reach any
> server.

---

## Stack

React 18 · TypeScript · Vite 6 · Tailwind CSS 4 · shadcn/ui-style components over
Radix · React Router 6 · React Hook Form + Zod · TanStack Query · Axios · Lucide ·
Sonner · `@zxing/browser` for QR scanning.

Arabic-first, fully RTL, designed for mobile first.

---

## Layout

```
src/
  api/            API layer — one file per domain, mirroring the backend routes
    admin/        Admin endpoints (using the admin session)
  app/            TanStack Query setup and query keys
  components/
    ui/           Design primitives (button, card, field, tabs, dialog…)
    common/       Shared presentational pieces (page shell, gallery, empty/error states)
    layout/       Visitor shells, navigation bar, passport switcher
    scanner/      Camera scanner (loaded on demand)
    admin/        Panel shell, data table, resource forms, QR generator
  context/        auth-context · admin-auth-context · journey-context
  features/       Domain components: places / challenges / stamps / partners / books
  lib/            Two-session HTTP client, QR parsing, helpers
  pages/          Visitor pages
    admin/        Panel pages
  routes/         Route definitions and their guards (guards + admin-guards)
  types/          Types mirroring the backend entities
```

---

## Routes

| Route | Description | Access |
| --- | --- | --- |
| `/login` · `/register` | Sign in and sign up | Guests only |
| `/complete-profile` | Finish the profile | Signed in |
| `/books` | My passports | Signed in |
| `/books/activate` | Activate a passport (scan or enter manually) | Signed in |
| `/scanner` | QR scanner | Signed in |
| `/qr/:type/:id?serial=&version=` | Destination of a scanned code | Signed in |
| `/profile` | My account | Signed in |
| `/about` · `/faq` · `/privacy` | Footer pages | Signed in |
| `/journey` | My journey | Requires an activated passport |
| `/province` | The active passport's province | Requires a passport |
| `/places` · `/places/:id` | Places and their details | Requires a passport |
| `/challenges` · `/stamps` · `/partners` | The rest of the experience | Requires a passport |

`/qr/:type/:id` deliberately mirrors the shape the backend builds into
`qr_value`, so opening the link straight from a phone camera works.

### Admin routes

| Route | Description |
| --- | --- |
| `/admin` | Dashboard — content and activity statistics |
| `/admin/provinces` | Provinces, with image and video uploads |
| `/admin/places` | Places, with media uploads and a province filter |
| `/admin/challenges` · `/admin/stamps` | Challenges and stamps attached to places |
| `/admin/partners` · `/admin/faqs` | Partners and FAQs |
| `/admin/books` | Composing a passport and attaching its content |
| `/admin/copies` | Passport copies and a printable QR sheet |
| `/admin/qr-codes` | Every code, with search, preview and link copying |

QR codes are drawn in the browser from the stored `qr_value`, because the backend
does not return an image when a copy is created — which also means they can be
printed at any size without losing quality.

---

## API surface

Every call is taken from the backend code as it stands — **no endpoint is
invented**.

| File | Endpoints |
| --- | --- |
| `auth.api.ts` | `POST /auth/login` · `POST /users/register` |
| `profile.api.ts` | `GET /users/profile` · `PUT /users/profile` |
| `user-books.api.ts` | `GET /users/books` · `POST /users/books` |
| `books.api.ts` | `GET /books/:id` |
| `provinces.api.ts` | `GET /provinces` · `GET /provinces/:id` |
| `places.api.ts` | `GET /places` · `GET /places/:id` |
| `challenges.api.ts` | `GET /challenges` · `GET /users/challenges?userBookId=` · `POST /users/challenges/solve` |
| `stamps.api.ts` | `GET /stamps` · `GET /users/stamps?userBookId=` · `POST /users/stamps/collect` |
| `partners.api.ts` | `GET /partners` |
| `faqs.api.ts` | `GET /faqs` |
| `visits.api.ts` | `GET /users/visits?userBookId=` |
| `journey.api.ts` | `GET /users/dashboard/:userBookId` |
| `qr.api.ts` | `GET /public/qr/:serial/:version/:type/:id` |

And the admin layer (`api/admin/`, on the admin session):

| File | Endpoints |
| --- | --- |
| `admin-auth.api.ts` | `POST /admin/login` · `GET /admin/profile` |
| `statistics.api.ts` | `GET /admin/dashboard/statistics` |
| `content.api.ts` | CRUD for `/provinces` · `/places` · `/challenges` · `/stamps` · `/partners` · `/faqs`, plus media uploads through `/provinces/media/:id/*` and `/places/media/:id/*` |
| `books.api.ts` | `/admin/books` · `/book-copies` · `GET /qr-codes` |

Every response is wrapped in `{ success, message, data }`. The `lib/http.ts`
layer unwraps it, normalises errors, and maps the backend's English messages onto
dictionary keys so they reach the user in their own language.

### How passports stay isolated

Two layers:

1. **On the server** — `/users/visits`, `/users/challenges` and `/users/stamps`
   are called with the active passport's `?userBookId=`, so they return only that
   journey's records. The server also refuses to solve a challenge or collect a
   stamp that does not belong to the passport it was given.
2. **In the client** — `journey-context` fetches the passport's content from
   `GET /books/:id` and computes progress against it (how many of *this*
   passport's places have been visited), which doubles as a second line of
   defence.

TanStack Query keys are indexed by `userBookId`, so switching passports swaps the
whole cache and no progress leaks between them.

---

## Backend

The API lives in its own repository: **[api_syria](https://github.com/Abdo-Houry/api_syria)**.

### Creating the first administrator

From the backend:

```bash
npm run seed:admin
```

The username and password are read from the backend's environment
(`ADMIN_USERNAME`, `ADMIN_PASSWORD`); the script refuses to run without a
password, so no known credentials can ever ship with the code. Change the
password from **My account** in the panel once you are in.
