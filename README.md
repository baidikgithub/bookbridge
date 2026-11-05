# BookBridge

Book donation inventory app for donation drives: volunteers register donated books, track stock and record when books are given to children.

- `mobile/`: React Native app (iOS and Android)
- `server/`: Go API with Postgres


The schema is applied automatically on startup. The first account registered becomes admin.

APIs so far:

- `GET /health`
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `POST /books`, `GET /books` (search and filters), `GET /books/{id}`, `PUT /books/{id}`, `DELETE /books/{id}`

## Mobile

```bash
cd mobile
npm install
npm run ios      # or: npm run android
```

The server address is set in `mobile/src/config.ts`.
