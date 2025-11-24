# Minimal Messenger — Improved UI (Downloadable)

This ZIP contains a three-page static demo messenger with a minimalist design and subtle icons.

## Files
- index.html — Signup / Login
- chats.html — Chats list, search and start chat
- chat.html — Single chat view with messages
- css/styles.css — Styles (minimalist theme)
- js/app.js — Firebase-enabled client script (replace firebaseConfig)
- README.md — This file

## How to use
1. Unzip the project and open `index.html` in a browser (or serve with a local static server).
2. Replace the placeholder `firebaseConfig` in `js/app.js` with your Firebase project's config (see steps below).
3. Use Firebase console to enable Authentication (Email/Password) and Firestore.
4. For quick testing set Firestore rules to allow authenticated reads/writes (see README in chat earlier).
5. Deploy on GitHub Pages or any static host.

Note: This demo creates chat documents without deduplication and uses client-side filtering for users — it's intended as a starter. Do not use as-is in production.

