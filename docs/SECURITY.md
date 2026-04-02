# Security Notes

This document describes the practical security model of the Faltai project.

## 1. Main security boundaries

Faltai has two different trust zones:

1. Frontend PWA
   - public client code
   - runs in the browser
   - must never contain private backend secrets

2. Backend API
   - runs on Render
   - can safely hold server-side configuration and secret keys

## 2. Authentication

Authentication is handled by Firebase Auth.

Why:
- the project does not store user passwords directly
- password handling, session tokens, and Google login are delegated to Firebase
- this reduces the risk of implementing custom auth incorrectly

Important rule:
- never move Firebase private server credentials into the frontend

Frontend Firebase configuration is expected to be public in the normal Firebase web-app sense.
That does not make the project insecure by itself. Security still depends on:
- proper Firebase rules
- proper backend authorization
- not exposing secret admin credentials

## 3. User data

User-facing data such as subjects, absences, evaluations, and preferences may exist in:
- Firebase
- local browser storage

Recommendations:
- keep only necessary user data
- avoid storing unnecessary personal information
- prefer subject and academic tracking data over sensitive personal profile fields

## 4. UnB API security model

The UnB API exposes public academic search data and push-notification endpoints.

Main protections:
- CORS is restricted via `CORS_ORIGINS`
- manual snapshot refresh can be protected with `UNB_SNAPSHOT_ADMIN_KEY`
- push subscriptions are stored server-side
- VAPID private keys stay on the backend only

## 5. Snapshot security

Snapshot files contain public class-search information for a semester.

They are not user-secret data, but they should still be treated as server-managed assets.

Recommendations:
- keep snapshot files out of the Git repository
- store them under `api/data/snapshots`
- do not expose raw server files directly
- serve only through API endpoints

## 6. Push notification security

Safe to expose:
- VAPID public key

Must stay private:
- VAPID private key
- any backend admin keys
- any Firebase service-account credentials if introduced later

Push subscriptions are not passwords, but they should still be handled as backend data:
- do not dump them in logs unnecessarily
- do not expose them in public endpoints

## 7. Environment variable guidance

Frontend-safe variables:
- `VITE_FIREBASE_*`
- `VITE_API_URL`
- `VITE_UNB_API_URL`

Backend-only variables:
- `UNB_SNAPSHOT_ADMIN_KEY`
- `VAPID_PRIVATE_KEY`
- any future database credentials
- any future Firebase admin credentials

## 8. Operational recommendations

- Always use HTTPS in production
- Keep Render and GitHub Pages domains aligned with CORS settings
- Protect manual refresh with `UNB_SNAPSHOT_ADMIN_KEY`
- Rotate private push credentials if they are ever exposed
- Review Firebase security rules whenever auth or storage structure changes
- Avoid logging full tokens, subscriptions, or user-sensitive payloads

## 9. Reporting a vulnerability

If you discover a security issue in Faltai:
- do not publish the exploit details immediately
- report the issue privately to the maintainer first
- include reproduction steps, impact, and suggested mitigation if possible

For urgent issues involving exposed credentials:
1. rotate the secret immediately
2. restrict the affected service
3. deploy a fix
4. review logs for abuse
