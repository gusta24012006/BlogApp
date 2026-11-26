<div align="center">

# 🌍 Volta

**A travel social network built around a 3D globe.**
Spin the globe, pick a country and read the stories of people who have been there.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://blog-app-j68i.vercel.app)

**[▶ Open the live demo](https://blog-app-j68i.vercel.app)**

</div>

![Volta's interactive globe](docs/globo.gif)

## About

Travel blogs are usually organised by date or by author. In **Volta** they are organised **by the map**: each user marks the countries they have visited on the globe and writes about them, and anyone exploring the app spins the globe and clicks a country to read the blogs about that destination.

It is a personal project, built solo, to learn how to ship a complete web application: from a 3D frontend to the database, authentication and deployment.

> **Status:** in development. The core features work; the missing ones are listed under [Roadmap](#roadmap). The app interface is in Portuguese.

## Try it

Open the **[live demo](https://blog-app-j68i.vercel.app)** and sign in with the demo account, no registration needed:

| Email | Password |
|---|---|
| `demo@volta.app` | `Demo2000` |

In the **feed**, under the **Encontrar** (Discover) tab, there are blogs from other users to explore: spin the globe, click a glowing country and open the posts.

> The blogs published in the demo are **test content**, created to showcase the app's features.

## Features

**3D globe**
- Interactive globe (spin, zoom, click a country) with visited countries highlighted
- In the feed, countries with unread blogs glow; each profile's globe colour is customisable

**Travel blogs**
- Block-based editor: rich text, image, image with text, YouTube video, Spotify music and dividers
- Drag-and-drop block reordering, plus colour and font themes per post
- Drafts and publishing; blogs grouped by country

**Social**
- Follow users, private profiles and follower lists
- Feed with two tabs: **Following** (with "stories" from people you follow) and **Discover** (blogs from the whole community)
- Likes, comments and notifications
- Viewed-post tracking, so unread posts are shown first

**Account**
- Sign-up, login and onboarding for new users
- Profile editing, email and password changes, and privacy settings

![Feed](docs/feed.png)
![Blog editor](docs/editor.png)

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| 3D globe | Three.js, react-globe.gl, TopoJSON |
| Editor | TipTap (rich text), dnd-kit (drag and drop) |
| Backend | Supabase: PostgreSQL, authentication and file storage |
| Deployment | Vercel |

## How it works

The app has no custom backend server: the Next.js frontend talks directly to **Supabase**, which handles the PostgreSQL database, authentication and image storage.

```
Browser (Next.js + React)
   │  supabase-js (public anon key)
   ▼
Supabase ── PostgreSQL (data + RLS policies)
         ├─ Auth (accounts and sessions)
         └─ Storage (post and profile images)
```

**Data model**

| Table | Stores |
|---|---|
| `profiles` | Users: name, photo, bio, globe colour, privacy |
| `posts` | Blogs: country, title, content blocks, theme, publication status |
| `countries_visited` | Countries marked by each user |
| `follows` | Who follows whom |
| `likes`, `comments` | Post interactions |
| `notifications` | New follower, like and comment notifications |
| `post_views` | Posts already viewed by each user |

## Technical decisions

- **Video and music via embeds, with no file storage.** Storing videos in Supabase would exceed the free plan. Video and music blocks only store the YouTube or Spotify link and render the embedded player, so storage cost is zero.
- **Sanitising post content.** Rich text is stored as HTML and rendered with `dangerouslySetInnerHTML`. To prevent XSS attacks, all HTML goes through **DOMPurify** with a strict allowlist of tags and attributes, and links only accept `http(s)`, `mailto` and relative paths.
- **Database-level security.** Since the browser accesses Supabase with the public key, permissions are enforced by **Row Level Security (RLS) policies** in PostgreSQL: each user can only modify their own data.

## Running locally

Requirements: Node.js 20+ and a [Supabase](https://supabase.com) project (the free plan is enough).

```bash
git clone https://github.com/gusta24012006/BlogApp.git
cd BlogApp/wanderlog
npm install
cp .env.example .env.local   # fill in your Supabase project URL and anon key
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Project structure

```
wanderlog/                 Next.js app
├─ src/app/                pages: feed, dashboard, blog, profile, search, settings…
├─ src/components/         Globe, block editor, navbar, post actions
└─ src/lib/                Supabase clients and HTML sanitisation
design/prototipo/          early prototype of the profile screen
docs/                      README images
```

## Roadmap

- [x] Deploy the demo to Vercel
- [ ] Export the database schema and RLS policies to the repository
- [ ] In Discover mode, hide blogs already viewed and stop a country glowing once it has nothing left to read
- [ ] "Surprise me" button: the globe spins and zooms into a random country with an unread blog
- [ ] Set up a custom email service for account confirmation
- [ ] Split the `Globe.tsx` component into smaller components
- [ ] Automated tests

## Author

**Gustavo Monteiro**, Informatics and Computing Engineering student at FEUP (University of Porto)

[LinkedIn](https://www.linkedin.com/in/gustavomonteiro06) · [GitHub](https://github.com/gusta24012006) · gustavotibe@gmail.com
