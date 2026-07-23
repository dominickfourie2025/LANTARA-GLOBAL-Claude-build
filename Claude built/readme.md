Lantara Global — Website
Marketing homepage for Lantara Global, an international education recruitment agency connecting Chinese schools with qualified native English-speaking teachers.

Live site: https://dominickfourie2025.github.io/LANTARA-GLOBAL/

Project structure
├── index.html              Main page markup
├── styles.css              All styling
├── script.js                Nav scroll behavior, mobile menu, scroll animations
└── assets/
    ├── fonts/               Self-hosted Playfair Display + Inter (.woff2)
    └── images/
        └── logo-mark.png    Lantara "LG" logo mark (transparent PNG)
Plain HTML/CSS/JS — no build step, no framework, no dependencies. Open index.html in a browser and it just works.

Why it's built this way
This site is optimized to load reliably in mainland China, where many common web resources (Google Fonts, Google Analytics, Google Maps, YouTube/Facebook embeds, etc.) are blocked or heavily throttled. To avoid that:

No external requests. Fonts and the logo are hosted locally in /assets rather than pulled from Google Fonts or a CDN.
No Google services of any kind (fonts, analytics, maps, reCAPTCHA).
Minimal JavaScript, vanilla only — no frameworks or external libraries.
If you add new images, fonts, or scripts, keep them self-hosted in this repo rather than linking to external CDNs, or the China-load benefit is lost.

Editing
Content/copy: edit the text directly in index.html.
Colors, spacing, fonts: edit styles.css. Brand colors are defined as CSS variables at the top of the file (:root { --navy, --gold, ... }) — change them there to update the whole site.
Photos: the site currently uses placeholder image blocks (labeled with what should go there, e.g. "Photo: teacher with students"). Replace these with real photos in assets/images/ and update the corresponding <img> or background reference in index.html/styles.css.
Contact form: currently submits via mailto:, which opens the visitor's email client. For a proper in-page submission, connect it to a form backend (e.g. Formspree) and update the <form> tag's action in index.html.
Deployment
Hosted on GitHub Pages directly from this repo. Any push to the default branch redeploys the live site automatically (may take a minute or two to update).

⚠️ When uploading changes: upload/commit the actual files rather than copy-pasting code through a browser text box — copy/paste can silently truncate content. Drag-and-drop the files into GitHub's "Add file → Upload files", or commit via Git/VS Code directly.

Known limitations
GitHub Pages is hosted outside mainland China, so it doesn't have the guaranteed low-latency access that a licensed mainland China host (ICP-licensed) would have. It's a reasonable free option, but access from China can occasionally be slower or intermittently throttled.
No backend — this is a static site. The contact form needs a third-party form service if you want submissions handled without opening the visitor's email client.
