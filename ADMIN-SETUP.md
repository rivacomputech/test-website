# Site admin: setup and use

## Install
1. Replace your `index.html` with the new one. The only change is a small loader at the bottom.
2. Upload `admin.js` to the same folder as `index.html`.

Visitors never load `admin.js`. It only loads when the site is opened with `?admin`.

## Open the admin
Go to **https://rivacomputech.com/?admin**

## Two ways to save

### A) Publish to GitHub (recommended if your site deploys from GitHub)
This covers GitHub Pages, Netlify, Cloudflare Pages and Vercel when they're connected to a repo.

1. In GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
   - Repository access: **Only select repositories** → your website repo
   - Permissions → Repository → **Contents: Read and write**
   - Pick an expiry date, generate the token and copy it.
2. On `?admin`, enter the repository (`owner/name`), the branch (usually `main`), the file (`index.html`) and the token.
3. Edit, then click **Publish**. GitHub commits the change and your host redeploys, usually within 1–2 minutes.

The token is the real security. Without a token that has write access to your repo, nobody can change the site, even if they find `?admin`. If a token is ever exposed, revoke it in GitHub.

### B) Edit & download (works with any host: cPanel, FTP, etc.)
Edit on the page, click **Download**, then upload the new `index.html` to your host the usual way. Replaced images are embedded inside the file.

## Editing
- **Text:** click it and type. Enter finishes editing, Shift+Enter adds a line break, and Ctrl+Z undoes.
- **Images and logo:** click any image (header logo, footer logo, taskbar icon, your photo, tech logos) and choose a new file. Every copy of that image on the page updates.
- **Site settings:** page title, Google description, and contact email. The email is replaced everywhere, including the contact form.
- **Edit switch:** turn it off to preview the page and use links normally.
- Changed items show an orange dashed outline until you save.

## Not covered
- Adding or removing whole sections or cards, link destinations, and the terminal or script demos. These still need a code edit.
- Browser-tab favicon files (`favicon.ico` / PNG sizes). Replace those files directly.
