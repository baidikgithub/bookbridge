# BookBridge

Book donation inventory app for donation drives: volunteers register donated books, track stock and record when books are given to children.

- `mobile/`: React Native app (iOS and Android)
- `server/`: Go API with Postgres

## Demo video

<video src="images/WhatsApp%20Video%202026-11-16%20at%2003.25.00.mp4" controls width="320"></video>

[▶ Watch the demo video](images/WhatsApp%20Video%202026-11-16%20at%2003.25.00.mp4) (MP4, 41 MB) — a walkthrough of the app.

## Screenshots

<table>
  <tr>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.33.jpeg" width="240" alt="Welcome screen"><br><sub><b>Welcome</b><br>Opening screen with the tagline and a Get Started button.</sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.35.jpeg" width="240" alt="Sign-in options screen"><br><sub><b>Sign-in options</b><br>Choose how to continue: email, Google or Apple, or sign in.</sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.35%20%281%29.jpeg" width="240" alt="Sign up screen"><br><sub><b>Sign up</b><br>Create an account with name, email and password; the first account becomes admin.</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.35%20%282%29.jpeg" width="240" alt="Home screen"><br><sub><b>Home</b><br>Welcome header, total impact, your Featured books, Services shortcuts and subject breakdown.</sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.36.jpeg" width="240" alt="Explore screen"><br><sub><b>Explore</b><br>The full book catalogue with search, status, subject and grade filters, in list or grid view.</sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.36%20%281%29.jpeg" width="240" alt="Book details screen"><br><sub><b>Book details</b><br>A book's stock, details, description and donation history, with edit, delete and donate actions.</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.39%20%281%29.jpeg" width="240" alt="Add a book screen"><br><sub><b>Add a book</b><br>Form to add a book with cover photo, details, grades, quantity, subject and condition.</sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.39.jpeg" width="240" alt="Book transfer history screen"><br><sub><b>Book transfer history</b><br>Every assignment and volunteer-to-volunteer transfer of a book, newest first, with current owner.</sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.39%20%282%29.jpeg" width="240" alt="Profile screen"><br><sub><b>Profile</b><br>Your account details and role, shortcuts to My Books, Donations, Drives and Users, and Sign Out.</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.40%20%281%29.jpeg" width="240" alt="Users and roles screen"><br><sub><b>Users and roles</b><br>Admins see every account and switch people between Volunteer and Admin.</sub></td>
    <td align="center"><img src="images/WhatsApp%20Image%202026-11-15%20at%2014.27.40.jpeg" width="240" alt="Collection drives screen"><br><sub><b>Collection drives</b><br>List collection drives and create new ones with optional start and end dates.</sub></td>
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
