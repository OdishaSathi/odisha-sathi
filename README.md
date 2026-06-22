# Odisha Sathi Website

Ready-to-run Next.js + Firebase website for Odisha Sathi.

## Features

- Home page with latest updates
- Categories: Jobs, Exams, Results, Scholarships, Govt. Schemes, Admissions
- Dynamic post pages: `/post/post-slug`
- Admin login using Firebase Authentication
- Create, edit and delete posts from admin panel
- Firestore posts collection
- Image resize tool
- Safe fallback sample posts if Firebase is not configured
- Fixed dynamic post loading: page tries `slug` first, then Firestore document ID fallback

## Step 1: Install requirements

Install these on the computer:

- Node.js LTS
- Git
- VS Code

## Step 2: Install packages

Open terminal inside this project folder:

```bash
npm install
```

## Step 3: Add Firebase keys

Copy `.env.local.example` and rename it to `.env.local`.

Then paste your Firebase web app configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 4: Enable Firebase Authentication

In Firebase Console:

1. Go to Authentication
2. Sign-in method
3. Enable Email/Password
4. Create one admin user with your email and password

## Step 5: Firestore rules

Paste the rules from `FIRESTORE_RULES.txt` into Firebase Firestore Rules.

These rules allow public users to read only published posts. Logged-in admin can create, update and delete posts.

## Step 6: Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Admin page:

```text
http://localhost:3000/admin
```

## Firestore collection structure

Collection name: `posts`

Fields used:

- title
- slug
- category
- excerpt
- content
- status: `published` or `draft`
- imageUrl
- sourceUrl
- tags
- createdAt
- updatedAt

## How to upload to GitHub

```bash
git init
git add .
git commit -m "Initial Odisha Sathi website"
git branch -M main
git remote add origin https://github.com/OdishaSathi/odisha-sathi.git
git push -u origin main
```

If the GitHub repo already has files, use VS Code source control or upload the ZIP contents manually.
