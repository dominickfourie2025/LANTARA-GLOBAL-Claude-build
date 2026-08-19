# Lantara Global — Website

Marketing + candidate/employer platform for **Lantara Global**, an international education recruitment agency connecting Chinese schools with qualified native English-speaking teachers.

## Project structure

```
├── index.html                  Homepage (EN)
├── index-zh.html                Homepage (中文)
├── schools.html / schools-zh.html
├── teachers.html / teachers-zh.html
├── about.html / about-zh.html
├── contact.html / contact-zh.html
├── jobs-portal.html             Public job listings (EN only)
├── teacher-sign-up.html         Candidate registration
├── teacher-sign-in.html         Candidate login
├── employer-sign-up.html / employer-sign-up-zh.html
├── employer-sign-in.html / employer-sign-in-zh.html
├── styles.css                   Shared by every page
├── script.js                    Shared by every page
├── assets/
│   ├── fonts/                   Self-hosted Playfair Display + Inter (.woff2)
│   └── images/                  Logo, photos, WeChat QR code
└── supabase/
    ├── 001_schema_v2.sql         Database schema (run this)
    └── 002_storage.sql           Storage buckets for CVs/documents (run this second)
```

17 HTML pages total, all plain HTML/CSS/JS — no build step, no framework. One shared stylesheet and script file power every page, so nav, footer, colors, fonts, and interactive behavior (FAQ accordions, mobile menu, password toggles, etc.) all stay in sync automatically.

**Live site:** https://dominickfourie2025.github.io/LANTARA-GLOBAL-Claude-build/ (update this if the URL has changed)

## Why it's built this way

Optimized to load reliably in mainland China, where common web resources (Google Fonts, Google Analytics, Google Maps, YouTube/Facebook embeds, reCAPTCHA) are blocked or throttled:

- **No external requests** for fonts or core assets — everything self-hosted in `/assets`.
- **No Google services** of any kind on the public-facing pages.
- **Minimal JavaScript**, vanilla only, one shared file.
- The candidate/employer **backend (Supabase)** is the one deliberate exception — it's used by teachers applying from abroad and by the site owner, both outside China, so China-latency wasn't a constraint for that piece. See "Backend" below.

If you add new images, fonts, or scripts, keep them self-hosted rather than linking to external CDNs, or the China-load benefit is lost.

## Bilingual structure

Every marketing page has an English and a Chinese counterpart (`page.html` / `page-zh.html`), cross-linked via the language toggle in the header. The Jobs Portal and the Teacher sign-up/sign-in pages are **English only** — teachers apply from outside China, so no Chinese version was built for those.

Chinese pages use system CJK fonts (Songti SC / STSong / SimSun for headings, PingFang SC / Microsoft YaHei for body) rather than a self-hosted Chinese webfont — a full CJK character set can run 10–20MB per weight, which would undo the performance work. This is handled by one CSS rule (`html[lang="zh-CN"]`) that swaps the font variables site-wide, so no page-level CSS duplication was needed.

## Editing

- **Content/copy:** edit the text directly in each page's HTML.
- **Colors, spacing, fonts, shared components:** edit `styles.css`. Brand colors are CSS variables at the top (`:root { --navy, --gold, ... }`) — change them there to update the whole site at once.
- **Header/footer/nav:** every page shares the same structure. If you need to change the nav (add a link, rename something), you'll need to edit it in each page individually — there's no shared include file since this is plain HTML, not a templating system.
- **Photos:** most images were extracted directly from design mockups rather than supplied as standalone high-resolution files, so several are lower resolution than ideal (soft or slightly pixelated at large display sizes). These are flagged as a to-do — swap in full-resolution originals before final launch if available.

## Deployment

Hosted on **GitHub Pages**. Any push to the default branch redeploys automatically (takes a minute or two).

⚠️ **When uploading changes:** always upload/commit the actual files (drag-and-drop via GitHub's "Add file → Upload files," or Git/VS Code) rather than copy-pasting code through a browser text box — copy/paste can silently truncate long files.

⚠️ **Browser caching:** `styles.css` is loaded with a cache-busting version tag (`styles.css?v=5`). If you edit `styles.css` and changes don't appear live, bump the version number in **every page's** `<link>` tag and hard-refresh.

## Backend (in progress)

A Supabase-based system is planned for teacher and employer accounts — sign-up/sign-in, candidate profiles, job listings, and applications. Current status:

- **Database schema written** (`supabase/001_schema_v2.sql`, `002_storage.sql`) — defines `profiles`, `candidates`, `employers`, `job_listings`, `applications`, `saved_jobs` tables with row-level security, plus storage buckets for CVs and verification documents. New job listings default to `pending` and require manual approval before going public.
- **Not yet connected:** the sign-up/sign-in pages currently only look correct visually — form submissions are intercepted client-side but don't call Supabase yet. No account creation, login, or data storage is live.
- **Not yet built:** Teacher Dashboard, Employer Dashboard (both referenced in the sign-in pages' benefit panels, but no page exists yet), Google OAuth (button is present but non-functional), Privacy Policy page.

## Known limitations

- GitHub Pages is hosted outside mainland China — a reasonable free option, but not guaranteed low-latency for mainland visitors the way a licensed China-hosted site would be.
- Several images are mockup-extracted and lower resolution than the rest of the site's photography (see "Photos" above).
- No backend is live yet — see "Backend" above for what's built vs. still pending.
