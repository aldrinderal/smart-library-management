# Smart Library Management System Using QR Code Scanning and Automated Due-Date Notifications

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg)](https://www.mongodb.com/atlas)
[![OCR](https://img.shields.io/badge/OCR-Tesseract.js-orange.svg)](https://tesseract.projectnaptha.com/)
[![QR Scanning](https://img.shields.io/badge/QR%20Scanning-HTML5--QRCode-purple.svg)](https://github.com/mebjas/html5-qrcode)

A complete, full-stack college prototype application designed for the **Prototype Development Lab**. The system provides two separate portals powered by a unified Node.js/Express API and MongoDB Atlas database:

1. **Admin Portal** — For librarians and administrators to manage book titles, physical copies, shelf locations, student ID card camera OCR recognition, book QR scanning, atomic issue/return workflows, and automated due-date alert triggers.
2. **Student Portal** — For enrolled college students to track their currently borrowed books, calculate remaining days, check borrowing history, and receive automated scheduled return notifications.

---

## Table of Contents

- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Project Directory Structure](#project-directory-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables Setup](#environment-variables-setup)
- [Installation and Running Locally](#installation-and-running-locally)
- [Database Seeding & Demo Credentials](#database-seeding--demo-credentials)
- [How to Test Core Lab Features](#how-to-test-core-lab-features)
  - [1. Student ID Card Camera Scanner with OCR](#1-student-id-card-camera-scanner-with-ocr)
  - [2. Physical Book Copy QR Scanning & Printing](#2-physical-book-copy-qr-scanning--printing)
  - [3. Issue Book Lending Workflow](#3-issue-book-lending-workflow)
  - [4. Return Book Workflow & Fine Calculation](#4-return-book-workflow--fine-calculation)
  - [5. Automated Due-Date Background Scheduler (node-cron)](#5-automated-due-date-background-scheduler-node-cron)
- [REST API Documentation](#rest-api-documentation)
- [Security & Concurrency Handling](#security--concurrency-handling)
- [Deployment Guide](#deployment-guide)
  - [MongoDB Atlas Setup](#mongodb-atlas-setup)
  - [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
  - [Backend Deployment (Render / Railway / VPS)](#backend-deployment-render--railway--vps)
- [Troubleshooting & Common Questions](#troubleshooting--common-questions)

---

## Key Features

### 1. Dual-Portal Architecture
- **Admin Portal**: Restricted to librarians with role `admin`. Public registration is disabled to prevent unauthorized administrative accounts.
- **Student Portal**: Tailored for mobile and desktop student access. Identity is determined strictly from verified JWT tokens, preventing cross-student record snooping.

### 2. Camera-Based Student ID Card OCR
- Live video stream with camera switcher (`navigator.mediaDevices`).
- ID card targeting overlay with instantaneous photo capture and file upload fallback.
- Client-side OCR via **Tesseract.js** extracting:
  - Student Name
  - Register Number (e.g. `721924104026`)
  - Department (e.g. `B.E. CSE`)
  - Academic Batch (e.g. `2024–2028`)
- Extracted details are fully editable by the librarian before MongoDB verification.
- Built-in one-click **"Test with Sample Demo ID Card"** generator for evaluation on laptops without physical ID cards.

### 3. Physical Book Copy QR Tracking & Label Printing
- Authoritative book title metadata linked to physical copies with unique copy IDs (`COPY001`, `COPY002`, etc.).
- Each copy records exact physical coordinates: **Shelf Block**, **Shelf Number**, and **Rack Number**.
- Real-time QR scanning via **html5-qrcode** (`BOOK_COPY:COPY001`) with manual lookup fallback.
- In-browser vector QR label generation via **qrcode.react** with a printable barcode sticker layout.

### 4. Robust Issue & Return Workflows
- **Atomic Concurrency Protection**: Book copy status is checked and updated using atomic MongoDB operations (`findOneAndUpdate({ _id, status: 'Available' }, { status: 'Issued' })`) to prevent double-lending race conditions.
- **Maximum Borrowing Limit**: Enforces configured student limit (default: 3 books).
- **Overdue & Fine Calculation**: Calculates days overdue upon return with configurable fine rates.

### 5. Automated Due-Date Notifications
- Background scheduled checks powered by **node-cron** running hourly.
- 3 distinct reminder stages:
  1. **3 Days Prior**: *"Your book 'Introduction to Algorithms' is due in 3 days, on [Date]."*
  2. **Due Today**: *"Your book 'Introduction to Algorithms' is due today. Please return it to the library."*
  3. **Overdue Alert**: *"Your book 'Introduction to Algorithms' is overdue by N days. Please return it as soon as possible."*
- Intelligent deduplication keys (`${txId}_DUE_3_DAYS`, `${txId}_OVERDUE_${days}_DAYS`) stored in MongoDB prevent duplicate student notifications.
- Optional email notification dispatcher via **Nodemailer** if SMTP credentials are provided.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS, React Router DOM v6, Axios, Lucide React Icons |
| **Backend** | Node.js (v18+ / v20+ / v24+), Express.js 4, REST API |
| **Database** | MongoDB Atlas / MongoDB Server, Mongoose 8 |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs password hashing, HTTP Bearer tokens |
| **Scanning** | `html5-qrcode` (QR Code Camera Scanner), `tesseract.js` v5 (Client-side ID Card OCR) |
| **QR Generation** | `qrcode.react` (SVG QR Code Generator) |
| **Scheduler** | `node-cron` (Hourly automated due-date and overdue alerts) |
| **Mail (Optional)**| `nodemailer` (SMTP email notifications) |

---

## Project Directory Structure

```
smart-library-management/
├── client/                     # Frontend Vite + React application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # ProtectedRoute guards and shared components
│   │   ├── context/            # AuthContext (JWT session state & user role)
│   │   ├── layouts/            # AdminLayout and StudentLayout
│   │   ├── pages/
│   │   │   ├── admin/          # Admin Dashboard, ID OCR, Book QR, Issue, Return, etc.
│   │   │   ├── auth/           # AdminLogin, StudentLogin, StudentRegister
│   │   │   ├── student/        # Student Dashboard, MyBooks, History, Notifications, Profile
│   │   │   └── PortalSelect.jsx# Main portal switcher landing page
│   │   ├── services/           # Axios instance & centralized libraryService API calls
│   │   ├── utils/              # OCR regex parser and date formatters
│   │   ├── App.jsx             # React Router routing configuration
│   │   ├── index.css           # Tailwind base styles and custom scrollbars
│   │   └── main.jsx            # React root mount
│   ├── index.html              # HTML5 entry template
│   ├── package.json            # Client dependencies and scripts
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── vite.config.js          # Vite bundler configuration
│
├── server/                     # Backend Node.js + Express API
│   ├── config/
│   │   └── db.js               # Mongoose MongoDB connection
│   ├── controllers/            # Route controllers (Auth, Student, Book, Copy, Transaction, etc.)
│   ├── middleware/             # JWT authentication & role-based authorization (adminOnly, studentOnly)
│   ├── models/                 # Mongoose Data Models: User, Book, BookCopy, BorrowTransaction, Notification
│   ├── routes/                 # Express route modules
│   ├── services/               # cronService (node-cron), notificationService, emailService
│   ├── utils/
│   │   ├── jwt.js              # Token generator
│   │   └── seed.js             # Comprehensive database seed script
│   ├── app.js                  # Express app setup, CORS, routes & error handling
│   ├── package.json            # Server dependencies and scripts
│   └── server.js               # Entry point, connects DB & starts cron scheduler
│
├── .gitignore                  # Git ignore rules for node_modules, .env, and dist
├── package.json                # Root convenience scripts
└── README.md                   # Complete lab & deployment documentation
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (Tested with Node v24)
- **npm**: v9.0.0 or higher
- **MongoDB Atlas account** (or local MongoDB Community Server running at `mongodb://127.0.0.1:27017`)
- Modern web browser (Chrome, Edge, Firefox, or Safari) with camera permissions enabled for `localhost` or HTTPS.

---

## Environment Variables Setup

### Server Environment (`server/.env`)

Copy `server/.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

Configure the following variables:

```ini
# Server Port and Environment
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smart_library?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=super_secret_jwt_key_smart_library_2026_xyz
JWT_EXPIRE=7d

# Allowed Frontend Origins (comma-separated)
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173

# Timezone (for Indian Standard Time and node-cron)
TIMEZONE=Asia/Kolkata

# Cron Schedule (default: hourly at minute 0)
CRON_SCHEDULE=0 * * * *

# Circulation Policies
MAX_BORROW_LIMIT=3
FINE_PER_DAY=0
ALLOW_STUDENT_REGISTRATION=true

# Optional Nodemailer SMTP Email Configuration (leave blank for in-app notifications only)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Smart Library" <noreply@smartlibrary.edu>
```

### Client Environment (`client/.env`)

Copy `client/.env.example` to `client/.env`:

```bash
cp client/.env.example client/.env
```

```ini
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Installation and Running Locally

### 1. Install Dependencies

From the project root:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 2. Seed Database with Realistic Demo Data

Ensure `server/.env` contains your `MONGODB_URI`. Then run:

```bash
cd server
npm run seed
```

This populates:
- 1 Administrator account
- 3 Sample students (including Anna University / college sample student Aldrin Deral)
- 10 Book titles with ISBNs, publishers, and categories
- 17 Physical book copies with shelf locations (Block A through Block E)
- Active and overdue borrowing transactions
- Sample in-app notifications

### 3. Run the Development Servers

Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
```
*Server starts on `http://localhost:5000` with the automated cron scheduler initialized.*

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```
*Client starts on `http://localhost:5173`.*

Open your browser and navigate to `http://localhost:5173`.

---

## Database Seeding & Demo Credentials

Use the following pre-configured credentials to evaluate the system:

### 1. Administrator Account (Admin Portal)
- **URL**: `http://localhost:5173/admin/login`
- **Email**: `admin@smartlibrary.edu`
- **Password**: `Admin@Password123!`
- *Tip: Click the "Autofill" button on the login screen to fill credentials instantly.*

### 2. Student Accounts (Student Portal)
- **URL**: `http://localhost:5173/student/login`

| Student Name | Register Number | Email | Password | Status / Active Borrows |
|---|---|---|---|---|
| **Aldrin Deral** | `721924104026` | `aldrin.deral@college.edu` | `Student@123` | Active &bull; 1 book due in 3 days |
| **Priyadharshini K** | `721924104045` | `priya.k@college.edu` | `Student@123` | Active &bull; 1 book due in 7 days |
| **Rahul Sharma** | `721923105012` | `rahul.sharma@college.edu` | `Student@123` | Active &bull; 1 overdue book |

---

## How to Test Core Lab Features

### 1. Student ID Card Camera Scanner with OCR
1. Log into the **Admin Portal** and select **Scan Student ID (OCR)** from the sidebar (`/admin/scan-id`).
2. Click **Start Camera** to allow browser camera access.
3. Hold an ID card in front of your camera and click **Capture Photo**, OR click **Upload Image** to upload a photo of a student card.
4. **Lab Testing Shortcut**: Click the **"Test with Sample Demo ID Card"** button at the top right. It renders a sample ID card onto a virtual canvas and feeds it directly into Tesseract.js.
5. Watch the OCR progress bar (0% to 100%).
6. Notice that **Name**, **Register Number**, **Department**, and **Academic Year** populate into editable input fields.
7. Click **Verify in MongoDB**.
8. If the student exists (e.g. `721924104026`), their verified profile appears along with active borrowing counts and a **"Proceed to Issue Book"** button.
9. If the student is not yet registered, an inline registration card allows the librarian to register them on the spot.

### 2. Physical Book Copy QR Scanning & Printing
1. In the Admin Portal, select **Scan Book QR Code** (`/admin/scan-qr`).
2. Click **Start QR Scanner** to activate camera detection.
3. Or test using the manual fallback input: enter `BOOK_COPY:COPY001` or `COPY002`.
4. Click **Lookup**.
5. The system displays the book title, author, category, ISBN, and physical shelf coordinates (**Block A, Shelf 01, Rack 01**).
6. If the copy is **Available**, a green badge appears with an **"Issue This Copy"** button.
7. If the copy is **Issued**, an amber badge appears displaying the current student borrower and a **"Return This Copy"** button.
8. To print QR stickers: Go to **Book Management** &rarr; Click **Manage Copies** &rarr; Click **Print QR**. A vector QR code sticker with copy ID and shelf location is displayed with a **Print QR Sticker** button.

### 3. Issue Book Lending Workflow
1. Navigate to **Issue Book** (`/admin/issue-book`).
2. Enter Register Number `721924104045` (Priya) and click **Lookup Student**.
3. Enter Copy ID `COPY002` (Algorithms) and click **Check Copy**.
4. The system validates:
   - Student account is active.
   - Student has not exceeded the 3-book limit.
   - Physical copy status is Available.
5. Select the due date (default: +14 days).
6. Click **Confirm & Issue Book**.
7. An atomic MongoDB transaction marks `COPY002` as `Issued`, creates the transaction, and delivers an in-app notification to the student.

### 4. Return Book Workflow & Fine Calculation
1. Navigate to **Return Book** (`/admin/return-book`).
2. Enter Copy ID `COPY008` (held by Rahul, overdue) and click **Find Record**.
3. The system detects that the due date was exceeded, flags it in red, and calculates overdue days.
4. Enter any condition remarks (e.g. "Good condition") and click **Confirm Return & Restock Book**.
5. The copy is restored to `Available`, the transaction is marked `Returned`, and a return confirmation notification is dispatched.

### 5. Automated Due-Date Background Scheduler (node-cron)
1. The background scheduler runs once an hour.
2. In the Admin Portal, open **Notifications & Cron** (`/admin/notifications`).
3. Click **Trigger Due-Date Check Now** to execute an on-demand scan across all active MongoDB transactions.
4. Review the breakdown: Transactions checked, 3-day reminders created, due today alerts, and overdue status updates.
5. Log into the **Student Portal** as Aldrin (`721924104026` / `Student@123`) and open **Notifications** to see the 3-day reminder alert.

---

## REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public (Rate-limited) | Login with email or registerNumber and password |
| `POST` | `/api/auth/register` | Public (if enabled) | Register student account |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |

### Students (`/api/students`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/students` | Admin Only | List students with search and department filters |
| `POST` | `/api/students` | Admin Only | Register student account manually |
| `GET` | `/api/students/search/regno/:regNo` | Admin Only | Fast lookup by register number for OCR scanner |
| `GET` | `/api/students/:id` | Admin Only | Student details with active loans and history |
| `PATCH` | `/api/students/:id` | Admin Only | Update student details |
| `PATCH` | `/api/students/:id/status` | Admin Only | Toggle active/deactivated status |

### Books & Physical Copies (`/api/books` & `/api/book-copies`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/books` | Authenticated | List book catalog with copy counts (total, available, issued) |
| `POST` | `/api/books` | Admin Only | Create new book title |
| `GET` | `/api/books/:id` | Authenticated | Book details with all physical copies |
| `PATCH` | `/api/books/:id` | Admin Only | Update book details |
| `DELETE` | `/api/books/:id` | Admin Only | Safe delete (blocked if active loans exist) |
| `GET` | `/api/book-copies` | Admin Only | List physical copies with shelf filters |
| `GET` | `/api/book-copies/:copyId` | Authenticated | Lookup copy by copyId or QR payload |
| `POST` | `/api/book-copies` | Admin Only | Batch create physical copies with shelf locations |
| `PATCH` | `/api/book-copies/:copyId` | Admin Only | Update copy location or status |
| `DELETE` | `/api/book-copies/:copyId` | Admin Only | Delete physical copy (blocked if issued) |

### Circulation Transactions (`/api/transactions`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/transactions/issue` | Admin Only | Issue book copy to student (atomic) |
| `POST` | `/api/transactions/return` | Admin Only | Return book copy, update availability & calculate fine |
| `GET` | `/api/transactions` | Admin Only | All transactions with pagination |
| `GET` | `/api/transactions/active` | Admin Only | All currently issued copies |
| `GET` | `/api/transactions/overdue` | Admin Only | All overdue books |
| `GET` | `/api/transactions/student/:studentId` | Admin Only | Borrowing record for a specific student |

### Student Self-Service (`/api/student/me`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/student/me/books` | Student Only | Currently borrowed books with remaining days |
| `GET` | `/api/student/me/history` | Student Only | Past returned transactions |
| `GET` | `/api/student/me/notifications` | Student Only | In-app notifications with unread count |
| `PATCH` | `/api/student/me/notifications/:id/read` | Student Only | Mark notification as read |
| `PATCH` | `/api/student/me/notifications/read-all` | Student Only | Mark all notifications as read |
| `GET` | `/api/student/me/profile` | Student Only | Student profile details |

### Analytics & Scheduler (`/api/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/admin` | Admin Only | Real-time counts, circulation rate, and recent loans |
| `GET` | `/api/dashboard/student` | Student Only | Student summary cards and current book badges |
| `POST` | `/api/dashboard/admin/trigger-check`| Admin Only | Run due-date cron check on demand |

---

## Security & Concurrency Handling

1. **Password Hashing**: Salted hashes generated via `bcryptjs` with 10 salt rounds. Passwords are never stored in plaintext.
2. **JWT Authorization**: All endpoints enforce token validity and role checks via `protect`, `adminOnly`, and `studentOnly` middleware.
3. **Double-Lending Prevention**: When issuing a book, MongoDB executes:
   ```javascript
   const copy = await BookCopy.findOneAndUpdate(
     { _id: copyId, status: 'Available' },
     { status: 'Issued' },
     { new: true }
   );
   ```
   If another librarian issues the same copy at the same millisecond, the second update returns `null` and is rejected with HTTP 409 Conflict.
4. **Brute-Force Rate Limiting**: Authentication endpoints are protected by `express-rate-limit` (30 requests per 15 minutes per IP).
5. **Private Data Isolation**: Student endpoints resolve records exclusively using `req.user._id` extracted from the cryptographically verified JWT token.

---

## Deployment Guide

### MongoDB Atlas Setup
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Under **Database Access**, create a database user (e.g. `library_admin`) with password.
3. Under **Network Access**, add IP Address `0.0.0.0/0` (Allow access from anywhere) so cloud servers (Vercel, Render) can connect.
4. Click **Connect** &rarr; **Drivers** &rarr; Copy the connection string:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/smart_library?retryWrites=true&w=majority`
5. Paste this into `server/.env` as `MONGODB_URI`.

### Frontend Deployment (Vercel)
1. Push your repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** and select your repository.
3. Set **Root Directory** to `client`.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_BASE_URL`: The URL of your deployed backend (e.g. `https://smart-library-api.onrender.com/api`).
7. Click **Deploy**.

### Backend Deployment (Render / Railway / VPS)
*Important: Because node-cron requires a continuously running Node.js process to execute scheduled hourly checks, deploy the backend to a platform supporting persistent processes (such as Render Web Service, Railway, Fly.io, or an AWS/DigitalOcean VPS).*

**On Render:**
1. Click **New** &rarr; **Web Service**.
2. Connect your GitHub repository.
3. Set **Root Directory** to `server`.
4. Runtime: `Node`
5. Build Command: `npm install`
6. Start Command: `node server.js`
7. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random 64-character string.
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://smart-library.vercel.app`).
   - `TIMEZONE`: `Asia/Kolkata`
   - `CRON_SCHEDULE`: `0 * * * *`
8. Click **Deploy**.

---

## Troubleshooting & Common Questions

**Q: Camera says "Permission denied or unavailable"?**  
A: Modern browsers restrict camera access (`getUserMedia`) to `http://localhost` or secure `https://` domains. When running locally, ensure you access the app via `http://localhost:5173`. Alternatively, use the **Upload Image** button or the **"Test with Sample Demo ID Card"** button.

**Q: Why does the seed script fail to connect?**  
A: Ensure your MongoDB Atlas user credentials in `server/.env` are correct and that your current IP address (or `0.0.0.0/0`) is whitelisted in MongoDB Atlas Network Access.

**Q: How do I change the maximum borrowing limit?**  
A: Update `MAX_BORROW_LIMIT=3` in `server/.env` or configure it through the Admin Portal **Settings** page.

**Q: Are emails mandatory?**  
A: No. In-app notifications stored in MongoDB are the primary alert channel. If SMTP variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) are omitted, the application runs normally without email errors.

