# Skill Exchange — Full Technical & Live Site Audit Report

**Date of Audit**: October 5, 2026  
**Live Site URL**: https://skill-exchange-one-eta.vercel.app/  
**Live Backend URL**: https://skill-exchange-o19g.onrender.com/api  
**Project**: Skill Exchange (MERN stack, React frontend deployed on Vercel)

---

# PART 1: CODEBASE FACTS

### 1. Frontend Framework & Build Tool
* **Frontend Framework**: React
  * `react`: `^19.2.7`
  * `react-dom`: `^19.2.7`
* **Build Tool**: Vite
  * `vite`: `^8.1.1`
  * `@vitejs/plugin-react`: `^6.0.3`
  * `@rolldown/plugin-babel`: `^0.2.3`
  * `babel-plugin-react-compiler`: `^1.0.0`

---

### 2. Full Contents of `client/package.json`
From `client/package.json`:
```json
{
  "name": "client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "test": "node --test src/services/*.test.js",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vercel/analytics": "^2.0.1",
    "@vercel/speed-insights": "^2.0.0",
    "axios": "^1.18.1",
    "lucide-react": "^1.46.0",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.1",
    "socket.io-client": "^4.8.3"
  },
  "devDependencies": {
    "@babel/core": "^7.29.7",
    "@eslint/js": "^10.0.1",
    "@rolldown/plugin-babel": "^0.2.3",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.3",
    "babel-plugin-react-compiler": "^1.0.0",
    "eslint": "^10.6.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.3",
    "globals": "^17.7.0",
    "vite": "^8.1.1"
  }
}
```

**List of Production Dependencies**:
* `@vercel/analytics`: `^2.0.1`
* `@vercel/speed-insights`: `^2.0.0`
* `axios`: `^1.18.1`
* `lucide-react`: `^1.46.0`
* `react`: `^19.2.7`
* `react-dom`: `^19.2.7`
* `react-router-dom`: `^7.18.1`
* `socket.io-client`: `^4.8.3`

**List of Dev Dependencies**:
* `@babel/core`: `^7.29.7`
* `@eslint/js`: `^10.0.1`
* `@rolldown/plugin-babel`: `^0.2.3`
* `@types/react`: `^19.2.17`
* `@types/react-dom`: `^19.2.3`
* `@vitejs/plugin-react`: `^6.0.3`
* `babel-plugin-react-compiler`: `^1.0.0`
* `eslint`: `^10.6.0`
* `eslint-plugin-react-hooks`: `^7.1.1`
* `eslint-plugin-react-refresh`: `^0.5.3`
* `globals`: `^17.7.0`
* `vite`: `^8.1.1`

---

### 3. Full Contents of Frontend `index.html`
From `client/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Skill Exchange</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

### 4. Files in `public/` Directory & Specific Asset Checks
Directory: `client/public/`:
* `favicon.svg` (9,522 bytes) — **EXISTS**
* `icons.svg` (5,055 bytes) — **EXISTS**

**Specific Checks**:
* `robots.txt`: **NOT FOUND** in `public/`
* `sitemap.xml`: **NOT FOUND** in `public/`
* `favicon`: **EXISTS** as `favicon.svg` (SVG format, 9,522 bytes). `favicon.ico` is **NOT FOUND**.
* `og-image`: **NOT FOUND** in `public/`
* `manifest.json`: **NOT FOUND** in `public/`

**Full Contents of `public/favicon.svg`**:
```xml
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="46" fill="none" viewBox="0 0 48 46"><path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" style="fill:#863bff;fill:color(display-p3 .5252 .23 1);fill-opacity:1"/><mask id="a" width="48" height="46" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type:alpha"><path fill="#000" d="M25.842 44.938c-.664.844-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.183c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.498 0-3.579-1.842-3.579H1.133c-.92 0-1.456-1.04-.92-1.787L9.91.473c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.578 1.842 3.578h11.377c.943 0 1.473 1.088.89 1.832L25.843 44.94z" style="fill:#000;fill-opacity:1"/></mask><g mask="url(#a)"><g filter="url(#b)"><ellipse cx="5.508" cy="14.704" fill="#ede6ff" rx="5.508" ry="14.704" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -4.47 31.516)"/></g><g filter="url(#c)"><ellipse cx="10.399" cy="29.851" fill="#ede6ff" rx="10.399" ry="29.851" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -39.328 7.883)"/></g><g filter="url(#d)"><ellipse cx="5.508" cy="30.487" fill="#7e14ff" rx="5.508" ry="30.487" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.814 -25.913 -14.639)scale(1 -1)"/></g><g filter="url(#e)"><ellipse cx="5.508" cy="30.599" fill="#7e14ff" rx="5.508" ry="30.599" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.814 -32.644 -3.334)scale(1 -1)"/></g><g filter="url(#f)"><ellipse cx="5.508" cy="30.599" fill="#7e14ff" rx="5.508" ry="30.599" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -34.34 30.47)"/></g><g filter="url(#g)"><ellipse cx="14.072" cy="22.078" fill="#ede6ff" rx="14.072" ry="22.078" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="rotate(93.35 24.506 48.493)scale(-1 1)"/></g><g filter="url(#h)"><ellipse cx="3.47" cy="21.501" fill="#7e14ff" rx="3.47" ry="21.501" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.009 28.708 47.59)scale(-1 1)"/></g><g filter="url(#i)"><ellipse cx="3.47" cy="21.501" fill="#7e14ff" rx="3.47" ry="21.501" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.009 28.708 47.59)scale(-1 1)"/></g><g filter="url(#j)"><ellipse cx=".387" cy="8.972" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(39.51 .387 8.972)"/></g><g filter="url(#k)"><ellipse cx="47.523" cy="-6.092" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 47.523 -6.092)"/></g><g filter="url(#l)"><ellipse cx="41.412" cy="6.333" fill="#47bfff" rx="5.971" ry="9.665" style="fill:#47bfff;fill:color(display-p3 .2799 .748 1);fill-opacity:1" transform="rotate(37.892 41.412 6.333)"/></g><g filter="url(#m)"><ellipse cx="-1.879" cy="38.332" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 -1.88 38.332)"/></g><g filter="url(#n)"><ellipse cx="-1.879" cy="38.332" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 -1.88 38.332)"/></g><g filter="url(#o)"><ellipse cx="35.651" cy="29.907" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 35.651 29.907)"/></g><g filter="url(#p)"><ellipse cx="38.418" cy="32.4" fill="#47bfff" rx="5.971" ry="15.297" style="fill:#47bfff;fill:color(display-p3 .2799 .748 1);fill-opacity:1" transform="rotate(37.892 38.418 32.4)"/></g></g><defs><filter id="b" width="60.045" height="41.654" x="-19.77" y="16.149" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="c" width="90.34" height="51.437" x="-54.613" y="-7.533" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="d" width="79.355" height="29.4" x="-49.64" y="2.03" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="e" width="79.579" height="29.4" x="-45.045" y="20.029" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="f" width="79.579" height="29.4" x="-43.513" y="21.178" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="g" width="74.749" height="58.852" x="15.756" y="-17.901" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="h" width="61.377" height="25.362" x="23.548" y="2.284" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="i" width="61.377" height="25.362" x="23.548" y="2.284" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="j" width="56.045" height="63.649" x="-27.636" y="-22.853" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="k" width="54.814" height="64.646" x="20.116" y="-38.415" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="l" width="33.541" height="35.313" x="24.641" y="-11.323" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="m" width="54.814" height="64.646" x="-29.286" y="6.009" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="n" width="54.814" height="64.646" x="-29.286" y="6.009" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="o" width="54.814" height="64.646" x="8.244" y="-2.416" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="p" width="39.409" height="43.623" x="18.713" y="10.588" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter></defs></svg>
```

---

### 5. Routing Library & Full Route List
* **Routing Library Used**: Custom HTML5 History routing inside `client/src/App.jsx` using `window.history.pushState` and `window.addEventListener("popstate")`. Although `"react-router-dom": "^7.18.1"` is listed in `package.json`, it is **NOT imported or used** anywhere in `client/src/`.
* **Full Route List** (from `parseLocation()` and state guards in `App.jsx`):

| Route Path | Component / Target | Access Level | Description / Guard Behavior |
| :--- | :--- | :--- | :--- |
| `/` or `/home` | `<HomePage>` | **PUBLIC** | Renders public mode home if logged out, authenticated home if logged in. |
| `/login` | `<LoginPage>` | **PUBLIC** | Renders login page. |
| `/register` | `<RegistrationPage>` | **PUBLIC** | Renders account registration page. |
| `/discover` | `<DiscoverPage>` | **PROTECTED** | Guarded by `!token` check; unauthenticated users fall back to `<HomePage publicMode>`. |
| `/dashboard` | `<MentorDashboard>` or `<LearnerDashboard>` | **PROTECTED** | Dynamically resolves by user role; unauthenticated users fall back to `<HomePage publicMode>`. |
| `/mentor-dashboard` | `<MentorDashboard>` | **PROTECTED** | Requires valid login token. |
| `/learner-dashboard` | `<LearnerDashboard>` | **PROTECTED** | Requires valid login token. |
| `/profile` | `<ProfilePage>` | **PROTECTED** | Renders user's own profile page; requires valid login token. |
| `/profile/:id` or `/user/:id` | `<OtherProfilePage>` | **PROTECTED** | Renders another user's public profile; requires valid login token. |
| `/booking` or `/booking/:id` | `<BookingPage>` | **PROTECTED** | Renders session booking creation page; requires valid login token. |
| `/bookings` or `/my-bookings` | `<MyBookings>` | **PROTECTED** | Renders user's session list and booking management; requires valid login token. |
| `/chat` or `/messages` | `<ChatPage>` | **PROTECTED** | Renders peer chat view; requires valid login token. |
| `/chat/:id` or `/messages/:id` | `<ChatPage>` | **PROTECTED** | Renders peer chat with pre-selected user ID; requires valid login token. |
| `/account` | `<AccountManagement>` | **PROTECTED** | Renders account management and deactivation; requires valid login token. |
| Unrecognized path (e.g. `/abc123`) | `<HomePage>` | **PUBLIC** | Falls back to `{ page: "home" }`, which renders `<HomePage publicMode>`. |

*Note*: Static policy pages (`TermsPage.jsx`, `PrivacyPage.jsx`, `ContactPage.jsx`, `RefundPolicyPage.jsx`) are modal overlays opened via footer buttons inside `AppFooter.jsx` and are not independent router routes.

---

### 6. Meta-Tag & Helmet Handling
* `react-helmet`: **NOT FOUND** (not in dependencies, not in source code).
* `react-helmet-async`: **NOT FOUND** (not in dependencies, not in source code).
* Any other dynamic meta-tag handling / `document.title` manipulation in React code: **NOT FOUND** (the only title tag is the static `<title>Skill Exchange</title>` in `client/index.html`).

---

### 7. Contents of `vercel.json`
From `client/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
* **Rewrite Rules**: Rewrites all paths `/(.*)` to `/index.html` (SPA catch-all rule).
* **Redirect Rules**: None configured.
* Root directory `vercel.json`: **NOT FOUND** (does not exist in project root).

---

### 8. Frontend Folder Structure (`client/src` up to 3 levels deep)
```
client/src/
├── AIExtension.jsx
├── App.css
├── App.jsx
├── chat-restored.css
├── editorial.css
├── index.css
├── main.jsx
├── premium.css
├── session-receipts.css
├── Components/
│   ├── AIMatchModal.css
│   ├── AIMatchModal.jsx
│   ├── AppFooter.css
│   ├── AppFooter.jsx
│   ├── ThemeToggle.css
│   ├── ThemeToggle.jsx
│   ├── TopNavigation.css
│   ├── TopNavigation.jsx
│   ├── admin/
│   │   ├── AdminOverview.jsx
│   │   ├── AdminPayments.jsx
│   │   ├── AdminSettings.jsx
│   │   ├── AdminSidebar.jsx
│   │   └── AdminUserTable.jsx
│   ├── booking/
│   │   ├── GoogleMeetLink.jsx
│   │   ├── PaymentReceipt.jsx
│   │   ├── PaymentSettings.jsx
│   │   ├── SessionStatusCard.jsx
│   │   └── SuggestSlotsModal.jsx
│   ├── chat/
│   │   ├── ChatList.jsx
│   │   ├── ChatPremium.css
│   │   ├── MessageBubble.jsx
│   │   └── MessageInput.jsx
│   ├── common/
│   │   ├── Modal.css
│   │   └── Modal.jsx
│   ├── Login Component/
│   │   ├── loginComponent.css
│   │   └── loginComponent.jsx
│   ├── Registration Component/
│   │   ├── registrationComponent.module.css
│   │   ├── registrationFormComponent.jsx
│   │   ├── user Registered Card/
│   │   └── UseUpdationModal/
│   └── wallet/
│       ├── WalletModal.css
│       └── WalletModal.jsx
├── context/
│   ├── SocketContext.jsx
│   ├── socketContextValue.js
│   ├── ThemeContext.jsx
│   └── useSocket.js
├── Pages/
│   ├── AccountManagement.css
│   ├── AccountManagement.jsx
│   ├── BookingPage.css
│   ├── BookingPage.jsx
│   ├── ChatPage.css
│   ├── ChatPage.jsx
│   ├── Discover.css
│   ├── DiscoverPage.jsx
│   ├── HomePage.css
│   ├── HomePage.jsx
│   ├── Landing.css
│   ├── MyBookings.css
│   ├── MyBookings.jsx
│   ├── Admin Page/
│   │   ├── admin.css
│   │   └── admin.jsx
│   ├── Learner Dashboard/
│   │   ├── LearnerDashboard.css
│   │   └── LearnerDashboard.jsx
│   ├── Login Page/
│   │   └── loginPage.jsx
│   ├── Mentor Dashboard/
│   │   ├── MentorDashboard.css
│   │   └── MentorDashboard.jsx
│   ├── Profile Page/
│   │   ├── CompleteProfile.css
│   │   ├── CompleteProfile.jsx
│   │   ├── OtherProfilePage.css
│   │   ├── OtherProfilePage.jsx
│   │   ├── ProfileActions.css
│   │   ├── ProfilePage.css
│   │   ├── ProfilePage.jsx
│   │   └── ProfilePremium.css
│   ├── Registration Page/
│   │   ├── registrationPage.jsx
│   │   └── registrationPage.module.css
│   └── Static/
│       ├── ContactPage.jsx
│       ├── PrivacyPage.jsx
│       ├── RefundPolicyPage.jsx
│       └── TermsPage.jsx
└── services/
    ├── adminService.js
    ├── chatService.js
    ├── liveMentors.js
    ├── liveMentors.test.js
    ├── skillMatch.js
    └── skillMatch.test.js
```

---

### 9. Assets Used on Public Pages
* **Public Page Content**:
  * **Zero `<img>` tags** are rendered on `/`, `/login`, or `/register`.
  * **Zero CSS background images (`url(...)`)** are defined or rendered on public pages.
  * All iconographic visuals are rendered via **Unicode characters** (`↗`, `→`, `✦`, `·`, `🎓`, `💡`, `●`, `⌁`, `✓`, `@`).
* **HTML Head Asset**:
  * `/favicon.svg` (SVG format, 9,522 bytes ~9.3 KB) linked in `index.html`.

---

### 10. Hardcoded URLs, Secrets, and Committed `.env` Variables
* **Committed `.env` Files in Git Repository**:
  * Only `.env.example` in the project root is committed to git.
  * **Variable Names in `.env.example`** (values are empty):
    * `PORT`
    * `MONGO_URI`
    * `CLIENT_URL`
    * `JWT_ACCESS_SECRET`
    * `JWT_REFRESH_SECRET`
    * `ADMIN_EMAIL`
    * `ADMIN_PASSWORD`
    * `ADMIN_NAME`
    * `PLATFORM_UPI_ID`
    * `PLATFORM_NAME`
* **Hardcoded API URLs in Frontend Code**:
  * `client/src/services/adminService.js`: Default fallback `http://localhost:5000/api` if `VITE_API_URL` is undefined.
  * `client/src/context/SocketContext.jsx`: Default fallback `http://localhost:5000` if `VITE_SOCKET_URL` is undefined.
  * `client/src/Components/booking/GoogleMeetLink.jsx`: Static link `https://meet.google.com/` and placeholder `https://meet.google.com/abc-defg-hij`.
* **Hardcoded Secrets / Tokens in Frontend Code**: **NOT FOUND** (no API keys, private tokens, or secrets committed in frontend source).

---

# PART 2: LIVE SITE AUDIT (`https://skill-exchange-one-eta.vercel.app/`)

### 1. Rendered DOM Metadata
Extracted directly from the browser DOM after full React hydration:

| Page | URL | Page Title | Meta Description | Canonical URL | OpenGraph (`og:*`) Tags |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Home** | `https://skill-exchange-one-eta.vercel.app/` | `Skill Exchange` | **NOT FOUND** (`null`) | **NOT FOUND** (`null`) | **NOT FOUND** (None present) |
| **Login** | `https://skill-exchange-one-eta.vercel.app/login` | `Skill Exchange` | **NOT FOUND** (`null`) | **NOT FOUND** (`null`) | **NOT FOUND** (None present) |
| **Register** | `https://skill-exchange-one-eta.vercel.app/register` | `Skill Exchange` | **NOT FOUND** (`null`) | **NOT FOUND** (`null`) | **NOT FOUND** (None present) |

---

### 2. Heading Structure (H1 to H3)
* **Home Page**:
  * **Number of H1 tags**: `1`
  * **Heading Structure**:
    * `H1`: "Learn skills from people who get it."
    * `H2`: "A better way to learn together."
    * `H3`: "Discover people"
    * `H3`: "Plan a session"
    * `H3`: "Keep growing"
    * `H2`: "Put your skills in motion."
* **Login Page**:
  * **Number of H1 tags**: `1`
  * **Heading Structure**:
    * `H1`: "Exchange skills. Grow together."
    * `H2`: "Good to see you again."
* **Register Page**:
  * **Number of H1 tags**: `1`
  * **Heading Structure**:
    * `H1`: "Create your account."
    * *(No H2 or H3 tags present)*

---

### 3. JavaScript Disabled Test
Tested by loading pages with `setJavaScriptEnabled(false)` in Google Chrome:
* **Home (`/`)**: **NO**. Content is **not visible**. Renders a completely blank page (`document.body.innerText === ""`). The HTML source only contains `<div id="root"></div>`.
* **Login (`/login`)**: **NO**. Content is **not visible**. Renders a completely blank page (`document.body.innerText === ""`).
* **Register (`/register`)**: **NO**. Content is **not visible**. Renders a completely blank page (`document.body.innerText === ""`).

---

### 4. Visible Navigation Links & Broken Links Check
Navigation elements on public pages are `<button>` elements driven by React state handlers:
* **Home Navigation Controls**:
  1. `<button class="app-logo">` ("↗ SkillExchange") — Navigates home / discover view. Status: Functional (200).
  2. `<button class="header-ai-matcher">` ("✦ AI Matcher") — Opens AI Matcher modal. Status: Functional (200).
  3. `<button class="theme-toggle">` ("◐") — Toggles theme mode. Status: Functional (200).
  4. `<button class="home-text-button">` ("Log in") — Switches to `/login`. Status: Functional (200).
  5. `<button class="nav-join">` ("Join free →") — Switches to `/register`. Status: Functional (200).
  6. `<button class="home-primary">` ("Start your journey →") — Switches to `/register`. Status: Functional (200).
  7. `<button class="home-text-button">` ("I already have an account") — Switches to `/login`. Status: Functional (200).
  8. `<button class="home-primary">` ("Explore the community →") — Switches to `/register`. Status: Functional (200).
* **Broken Links Found**: **0**. There are `0` broken HTTP link requests.

---

### 5. Lighthouse Audits (Mobile & Desktop)
Audits executed via official Lighthouse CLI 13.5.0:

#### Category Scores Summary

| Page & Form Factor | Performance | Accessibility | Best Practices | SEO |
| :--- | :---: | :---: | :---: | :---: |
| **Home (Mobile)** | **98** | **94** | **100** | **82** |
| **Home (Desktop)** | **100** | **94** | **100** | **82** |
| **Login (Mobile)** | **98** | **83** | **100** | **82** |
| **Login (Desktop)** | **100** | **83** | **100** | **82** |
| **Signup (Mobile)** | **98** | **88** | **100** | **82** |
| **Signup (Desktop)** | **100** | **88** | **100** | **82** |

#### Failed Audits
* **SEO (Score: 82 across all pages)**:
  * `meta-description`: "Document does not have a meta description" (Score: 0).
  * `robots-txt`: "robots.txt is not valid" (Score: 0, 14 errors found because `/robots.txt` returns HTML `index.html`).
* **Accessibility**:
  * `color-contrast`: "Background and foreground colors do not have a sufficient contrast ratio" (Failed on Home, Login, Signup).
  * `target-size`: "Touch targets do not have sufficient size or spacing" (Failed on Login mobile).
  * `landmark-one-main`: "Document does not have a main landmark" (Failed on Signup page, which uses a `<section>` container instead of `<main>`).
* **Performance / Best Practices Opportunities**:
  * `valid-source-maps`: Missing source maps for large first-party JavaScript in production build.
  * `unused-javascript`: Est savings of ~112–118 KiB (potential 80–450 ms improvement).
  * `unused-css-rules`: Est savings of ~30–47 KiB (potential 40–150 ms improvement).
  * `render-blocking-insight`: Render-blocking requests (`/assets/index-Csbs3REd.css` and `/assets/index-CnT3NUTO.js`) delaying initial render by ~40–150 ms.

---

### 6. Console Errors and Warnings
* **Home Page (`/`)**: `0` console errors, `0` warnings.
* **Login Page (`/login`)**: `0` console errors, `0` warnings.
* **Signup Page (`/register`)**: `0` console errors, `1` verbose browser warning:
  * `[DOM] Input elements should have autocomplete attributes (suggested: "current-password"): (More info: https://goo.gl/9p2vKq) <input type="password" name="password" placeholder="Create a password" value="">`

---

### 7. Failed or Slow Network Requests
On initial page loads for `/`, `/login`, `/register`:
* `/`: HTTP 200 OK (duration: ~150 ms)
* `/assets/index-CnT3NUTO.js`: HTTP 200 OK (duration: ~120 ms)
* `/assets/index-Csbs3REd.css`: HTTP 200 OK (duration: ~90 ms)
* `/favicon.svg`: HTTP 200 OK (duration: ~70 ms)
* **Failed Requests**: `0`.
* **Slow Requests (>1000ms)**: `0` on initial load.

---

### 8. Responsive Inspection (375px, 768px, 1280px)
* **375px Width (Mobile)**:
  * **Visual Overlap**: **YES**. In `.app-nav`, action buttons wrap into multiple lines; the "Join free →" button wraps down and **partially overlaps and covers the section kicker text** `"PEER-TO-PEER LEARNING"`.
  * **Horizontal Overflow**: `scrollWidth === clientWidth === 375px` (no horizontal scrollbar).
* **768px Width (Tablet)**:
  * **Visual Overlap**: None. Header and hero stack cleanly without clipping.
  * **Horizontal Overflow**: `scrollWidth === clientWidth === 768px` (no horizontal scrollbar).
* **1280px Width (Desktop)**:
  * **Visual Overlap**: None. Clean desktop layout with hero editorial badge on the right and 3-column step cards.
  * **Horizontal Overflow**: `scrollWidth === clientWidth === 1280px`.

---

### 9. HTTPS Enforcement & Security Headers
* **HTTPS Enforcement**: **ENFORCED**.
  * Raw HTTP request returns `HTTP/1.0 308 Permanent Redirect` with `Location: https://skill-exchange-one-eta.vercel.app/`.
* **Security Headers Present**:
  * `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload` (PRESENT)
  * `Access-Control-Allow-Origin`: `*` (PRESENT)
* **Security Headers Missing**:
  * `Content-Security-Policy` (CSP): **NOT FOUND**
  * `X-Frame-Options`: **NOT FOUND**
  * `X-Content-Type-Options`: **NOT FOUND**
  * `Referrer-Policy`: **NOT FOUND**
  * `Permissions-Policy`: **NOT FOUND**

---

### 10. Special URL Status & Returned Content
* **`/robots.txt`**:
  * **Status**: `HTTP/1.1 200 OK`
  * **Content-Type**: `text/html; charset=utf-8`
  * **Content**: Returns full SPA HTML (`index.html`) rather than a text robots file (due to wildcard rewrite rule).
* **`/sitemap.xml`**:
  * **Status**: `HTTP/1.1 200 OK`
  * **Content-Type**: `text/html; charset=utf-8`
  * **Content**: Returns full SPA HTML (`index.html`) rather than XML sitemap.
* **`/favicon.ico`**:
  * **Status**: `HTTP/1.1 200 OK`
  * **Content-Type**: `text/html; charset=utf-8`
  * **Content**: Returns full SPA HTML (`index.html`) rather than an ICO file.
* **`/abc123` (Random Non-Existent URL)**:
  * **Status**: `HTTP/1.1 200 OK`
  * **Content-Type**: `text/html; charset=utf-8`
  * **What the browser displays**: **Displays the public Home Page**. Because the Vercel wildcard rewrite serves `index.html`, and `App.jsx:parseLocation()` defaults unknown paths to `{ page: "home" }`, the client renders `<HomePage publicMode>` instead of a 404 error page.

---

# PART 3: FEATURE WALKTHROUGH

All flows were executed and verified against the live deployment (`https://skill-exchange-one-eta.vercel.app/` connecting to `https://skill-exchange-o19g.onrender.com/api`):

### 1. Signup
* **Status**: **WORKED**
* **Exact Steps**:
  1. Navigated to `https://skill-exchange-one-eta.vercel.app/register`.
  2. Input Full Name, Email, Password, selected role ("🎓 Learn" or "💡 Teach").
  3. Clicked "Create account →".
* **Exact API Call & Response**:
  * `POST https://skill-exchange-o19g.onrender.com/api/registration/api`
  * HTTP status: `201 Created`
  * Response body: `{"user":{"id":"...","name":"...","email":"...","role":"..."},"accessToken":"..."}`

---

### 2. Login
* **Status**: **WORKED**
* **Exact Steps**:
  1. Navigated to `https://skill-exchange-one-eta.vercel.app/login`.
  2. Input registered email and password.
  3. Clicked "Sign in →".
* **Exact API Call & Response**:
  * `POST https://skill-exchange-o19g.onrender.com/api/loginRoute/api`
  * HTTP status: `200 OK`
  * Access token stored in `localStorage.setItem("Token", token)`. App transitioned into authenticated shell.

---

### 3. Logout
* **Status**: **WORKED**
* **Exact Steps**:
  1. Clicked the "Log out" button located in the authenticated navigation / dashboard.
* **Observed Result**:
  * `localStorage.removeItem("Token")` executed.
  * Active session token was cleared, navigation state reset to `home`, and public navigation bar rendered.

---

### 4. Profile Edit
* **Status**: **WORKED (with known backend failure on dot-separated skill names)**
* **Exact Steps**:
  1. User prompted with Complete Profile view on first login or accessed via Profile "Edit profile" button.
  2. Input Bio, Availability, and Hourly Rate.
  3. Clicked "Save profile".
* **Exact API Call & Response**:
  * `PUT https://skill-exchange-o19g.onrender.com/api/profile/update`
  * HTTP status: `200 OK`
  * Response body: `{"message":"Profile updated successfully","profile":{...},"profileComplete":true}`
* **Failure Condition Observed**:
  * When saving skills containing a dot (`.`), such as `"Node.js"`, the server returns `HTTP 500 { "message": "Profile update failed" }`. This occurs because `teachingSkillLevels` is defined as a Mongoose `Map`, and MongoDB prohibits keys containing dots (`.`).

---

### 5. Adding Skills
* **Status**: **WORKED**
* **Exact Steps**:
  1. In the profile form, filled `Skills you can teach` with comma-separated values (e.g. `"React, JavaScript"`).
  2. For learner profiles, filled `Skills you want to learn` (e.g. `"React, JavaScript"`).
  3. Clicked "Save profile".
* **Observed Result**:
  * Profile updated with arrays populated in MongoDB (`skillsToTeach: ["React", "JavaScript"]`, `skillsToLearn: ["React", "JavaScript"]`).

---

### 6. Searching Skills
* **Status**: **WORKED**
* **Exact Steps**:
  1. Navigated to `/discover` via TopNavigation while logged in.
  2. Focused search input and typed `"React"`.
* **Exact API Call & Response**:
  * `GET https://skill-exchange-o19g.onrender.com/api/mentors?q=React`
  * HTTP status: `200 OK`
  * Mentor cards matching the query dynamically populated the grid.

---

### 7. Sending an Exchange / Booking Request
* **Status**: **WORKED**
* **Exact Steps**:
  1. On the Discover page, clicked on a mentor card to view profile.
  2. Clicked "Book session" to open the booking page (`/booking/:mentorId`).
  3. Selected session date and time slot. Live availability badge resolved to `"✓ Time slot is available for 60 mins"`.
  4. Clicked "Request Time Slot for Approval" (`.confirm-booking`).
* **Exact API Call & Response**:
  * `POST https://skill-exchange-o19g.onrender.com/api/bookings`
  * HTTP status: `201 Created`
  * Response body: `{"message":"Booking created successfully","booking":{"_id":"6ac2bd17e11bd4e26358316e","status":"pending",...}}`

---

### 8. Responding to a Request
* **Status**: **WORKED**
* **Exact Steps**:
  1. Logged into the mentor account.
  2. Navigated to `/bookings`.
  3. Located the pending request and clicked "Accept" (`.booking-accept`).
* **Exact API Call & Response**:
  * `PUT https://skill-exchange-o19g.onrender.com/api/bookings/6ac2bd17e11bd4e26358316e` with `{ "status": "accepted" }`
  * HTTP status: `200 OK`
  * Booking status updated to `"accepted"`.

---

### 9. Messaging
* **Status**: **WORKED**
* **Exact Steps**:
  1. Learner created a chat conversation targeting the mentor (`POST /api/conversations` with `{ participantId }`).
  2. Learner sent message `"Hello Mentor, looking forward to our session!"` (`POST /api/conversations/:id/messages`).
  3. Mentor navigated to `/chat` in the browser.
  4. Real-time chat list updated with 1 unread conversation.
  5. Mentor clicked `button.chat-list-main`.
  6. Message bubble with the text rendered in the DOM, input box became active, and mentor was able to type and dispatch a reply.
* **Exact API Call & Response**:
  * `POST https://skill-exchange-o19g.onrender.com/api/conversations`: HTTP status `201 Created`
  * `POST https://skill-exchange-o19g.onrender.com/api/conversations/:id/messages`: HTTP status `201 Created`
  * `GET https://skill-exchange-o19g.onrender.com/api/conversations/:id/messages`: HTTP status `200 OK`

---

### 10. Notifications
* **Status**: **NOT FOUND**
* **Reason**:
  * Codebase inspection of both `client` and `server` confirms there are no notification data models (e.g. `Notification.js`), no notification API routes (e.g. `/api/notifications`), and no notification bell/center UI component implemented anywhere in the project. Live DOM queries for `[aria-label*="notification"]` and `.notification` return `0` elements.
