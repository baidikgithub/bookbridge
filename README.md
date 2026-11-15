# BookBridge

Book donation inventory app for donation drives: volunteers register donated books, track stock and record when books are given to children.

- `mobile/`: React Native app (iOS and Android)
- `server/`: Go API with Postgres

## Screenshots

<table>
  <tr>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.33.jpeg" width="240" alt="Welcome screen"><br><sub><b>Welcome</b></sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.35.jpeg" width="240" alt="Sign-in options screen"><br><sub><b>Sign-in options</b></sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.35%20%281%29.jpeg" width="240" alt="Sign up screen"><br><sub><b>Sign up</b></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.35%20%282%29.jpeg" width="240" alt="Home screen"><br><sub><b>Home</b></sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.36.jpeg" width="240" alt="Explore screen"><br><sub><b>Explore</b></sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.36%20%281%29.jpeg" width="240" alt="Book details screen"><br><sub><b>Book details</b></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.39%20%281%29.jpeg" width="240" alt="Add a book screen"><br><sub><b>Add a book</b></sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.39.jpeg" width="240" alt="Book transfer history screen"><br><sub><b>Book transfer history</b></sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.39%20%282%29.jpeg" width="240" alt="Profile screen"><br><sub><b>Profile</b></sub></td>
  </tr>
  <tr>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.40%20%281%29.jpeg" width="240" alt="Users and roles screen"><br><sub><b>Users and roles</b></sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.40.jpeg" width="240" alt="Collection drives screen"><br><sub><b>Collection drives</b></sub></td>
  </tr>
</table>

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
