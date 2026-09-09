FLIRTX DAILY APK ADMIN - CLOUDFLARE WORKER SETUP

What this does
- /admin.html lets you upload a new APK.
- The Worker creates a new public GitHub Release and uploads it as FlirtX.apk.
- The website download button always uses:
  https://github.com/mynewphone10956-sys/Viral-flirtx/releases/latest/download/FlirtX.apk
- You do NOT redeploy the website when changing APKs.

GitHub setup
1. Create a fine-grained Personal Access Token for repository: Viral-flirtx
2. Repository permission: Contents = Read and write
3. Do not put the token in HTML.

Cloudflare setup (first deployment only)
1. Install Node.js on your computer.
2. Open a terminal in this folder.
3. Run: npm install
4. Run: npx wrangler login
5. Add the GitHub token as a secret:
   npx wrangler secret put GITHUB_TOKEN
   Paste the token when asked.
6. Add the admin password as a secret:
   npx wrangler secret put ADMIN_PASSWORD
   Enter your desired password (for example Badboy).
7. Deploy:
   npm run deploy

Daily use
1. Open https://YOUR-SITE/admin.html
2. Login.
3. Select the new APK.
4. Optional: type a version like v1.5. If left blank a unique timestamp version is generated.
5. Tap UPLOAD APK & PUBLISH.
6. Once successful, the site's existing download button automatically serves that newest APK.

Important
- Cloudflare Free currently allows request bodies up to 100 MB. Keep APKs below that limit.
- Each upload creates a new GitHub Release, preserving older versions unless you delete them manually.
