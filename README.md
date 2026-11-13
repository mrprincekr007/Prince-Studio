# Prince Studio — Website

Landing + support website for the Prince Studio Android app.
Plain static HTML/CSS/JS — no build step, no dependencies. Just upload the folder.

## Project structure

```
.
├── index.html              landing page
├── features.html           features, specs, permissions, release notes
├── privacy.html            privacy policy + terms
├── support.html            support and contact
├── css/
│   ├── index.css           homepage styles
│   ├── features.css        features page styles
│   ├── privacy.css         privacy page styles
│   └── support.css         support page styles
├── js/
│   ├── index.js            homepage behavior
│   ├── features.js         features page behavior
│   ├── privacy.js          privacy page behavior
│   └── support.js          support page behavior
├── assets/
│   ├── icons/              favicon, app icons, nav logo
│   ├── images/             social preview + download QR
│   └── source/             original high-res icon artwork (not loaded by the site)
├── downloads/
│   └── Prince Studio v1.0.1.apk
├── robots.txt
├── site.webmanifest
└── sitemap.xml
```

## Pages

- `index.html` — landing page (hero, features, how it works, download, FAQ)
- `features.html` — full feature list, specs, permissions, release notes
- `privacy.html` — privacy policy + terms of use
- `support.html` — support and contact channels

## Download link

The APK lives at:

```
downloads/Prince Studio v1.0.1.apk
```

All download buttons point to that file. To ship a new build:
1. Put the new APK in `downloads/` (e.g. `Prince Studio v1.1.0.apk`).
2. Update the `href` on the ticker, nav, hero and release sections of `index.html` and `features.html`.
3. Update the version number, build number, size and release notes text on those pages.

## Before you publish

| Where | What | Replace with |
|---|---|---|
| `assets/images/qr-download.png` | QR code pointing at `https://princestudio.princehacks.online/` | a QR of your final domain |

To make a new QR code for your domain, use any QR generator and overwrite
`assets/images/qr-download.png` (keep it square, ~400×400).

The site URL `https://princestudio.princehacks.online/` is used in the canonical links,
Open Graph/Twitter tags, `sitemap.xml` and `robots.txt`. If you deploy to a
different URL, update those in all four pages.

## Preview locally

Any static server works:

```powershell
python -m http.server 5500
```

Then open http://localhost:5500

## Deploy (free options)

**GitHub Pages**
1. Create a repo and upload the contents of this folder.
2. Repo → Settings → Pages → Source: `main` branch, `/ (root)`.
3. Site goes live at `https://<username>.github.io/<repo>/`.

**Netlify**
1. Drag the whole folder onto https://app.netlify.com/drop
2. Done — you get a URL instantly, and can add a custom domain.

**Vercel**
1. `vercel` in this folder, or import the repo at vercel.com.
2. Framework preset: Other. Output directory: `.`

**Cloudflare Pages** — same idea: connect the repo, no build command, output `/`.

## Notes

- The site is fully static, so it works on any host, including shared hosting —
  just upload everything (including `downloads/`) via FTP.
- Fonts load from Google Fonts (Geist and Geist Mono). If you
  need a fully offline site, self-host them and drop the Google Fonts `<link>` tags.
- All internal links were verified and the APK serves with the correct binary
  content type on standard static servers.
