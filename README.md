# ◈ AttendQR Pro

> A smart QR-code-based student attendance management system built with React.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Active-00ff88?style=flat-square)

---

## 📌 Overview

**AttendQR Pro** is a web-based attendance system that allows teachers to generate live QR codes for each class session, and students to scan them using their device camera to mark themselves present — all in real time.

---

## ✨ Features

- 🔐 **Login & Authentication** — Role-based access for Teachers and Students
- 🎓 **Teacher Dashboard** — Generate QR codes, manage sessions, view live check-ins
- 📱 **Student Scanner** — Real camera QR scanning via jsQR + simulate mode for demos
- 📊 **Reports & Analytics** — Per-class breakdown, student attendance percentages
- ⬇️ **Export** — Download attendance as CSV or printable PDF/HTML
- ⏱️ **Live Countdown** — Sessions auto-expire after a set duration
- 🔄 **Hot Reload** — Changes reflect instantly during development

---

## 🗂️ Project Structure

```
attendance-app/
├── public/
│   └── index.html
├── src/
│   ├── index.js            # App entry point
│   └── attendance-pro.jsx  # Main application component
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- npm (comes with Node.js)
- [VS Code](https://code.visualstudio.com/) (recommended editor)

Verify your installation:
```bash
node -v
npm -v
```

---

### Installation

**1. Clone or download the project**
```bash
git clone https://github.com/your-username/attendance-app.git
cd attendance-app
```

Or if you created it with Create React App:
```bash
npx create-react-app attendance-app
cd attendance-app
```

**2. Clean up the default `src/` folder**

Delete these files from `src/`:
```
App.css
App.js
App.test.js
logo.svg
reportWebVitals.js
setupTests.js
```
Keep only `index.js`.

**3. Add the main component**

Place `attendance-pro.jsx` inside the `src/` folder.

**4. Update `src/index.js`**

Replace the contents of `src/index.js` with:
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './attendance-pro';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

**5. Start the development server**
```bash
npm start
```

The app will open automatically at **http://localhost:3000**

---

## 🔑 Demo Accounts

Use these credentials to log in and explore the system:

### Teacher Accounts
| Name | Email | Password |
|---|---|---|
| Dr. Adebayo | adebayo@school.edu | teacher123 |
| Prof. Okonkwo | okonkwo@school.edu | teacher123 |

### Student Accounts
| Name | Email | Password |
|---|---|---|
| Amara Okafor | amara@school.edu | student123 |
| Chidi Nwosu | chidi@school.edu | student123 |
| Fatima Bello | fatima@school.edu | student123 |
| Emeka Adeyemi | emeka@school.edu | student123 |
| Ngozi Eze | ngozi@school.edu | student123 |
| Tunde Abiodun | tunde@school.edu | student123 |
| Halima Musa | halima@school.edu | student123 |
| Seun Olawale | seun@school.edu | student123 |

---

## 🧭 How to Use

### As a Teacher
1. Log in with a teacher account
2. Select a class (CS301, CS302, or CS303)
3. Choose session duration (60s / 120s / 300s)
4. Click **"Generate QR Session"**
5. A live QR code appears with a countdown timer
6. Students scan the QR to check in — names appear in real time
7. Session ends automatically when timer expires, or click **"End Session"**

### As a Student
1. Log in with a student account
2. Go to the **Scan** tab
3. Click **"Use Camera"** and point your device at the teacher's QR code
4. Or click **"Simulate"** to auto-detect any open session (demo mode)
5. Check the **Reports** tab to see your attendance record

### Exporting Reports
1. Log in as a Teacher
2. Go to the **Reports** tab
3. Click **"Export CSV"** for a spreadsheet-compatible file
4. Click **"Export PDF"** for a printable HTML report

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| react | UI framework |
| react-dom | DOM rendering |
| jsQR | QR code decoding from camera (loaded via CDN) |
| QR Server API | QR code image generation (`api.qrserver.com`) |

No additional npm packages are required — jsQR loads automatically from CDN at runtime.

---

## 🌐 Available Classes

| Class ID | Subject | Teacher |
|---|---|---|
| CS301 | Data Structures | Dr. Adebayo |
| CS302 | Web Engineering | Prof. Okonkwo |
| CS303 | Database Systems | Dr. Adebayo |

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---|---|
| Deprecation warnings during install | Safe to ignore — app still works |
| Port 3000 in use | Press `Y` when prompted to use another port |
| Camera not working | Allow camera permissions in browser; use HTTPS in production |
| QR not scanning | Ensure good lighting and hold camera steady |
| Blank white screen | Open browser console (`F12`) and check for errors |
| Module not found | Confirm `attendance-pro.jsx` is inside the `src/` folder |

---

## 🔮 Possible Future Enhancements

- [ ] Backend integration (Node.js + MongoDB)
- [ ] Real user authentication with JWT
- [ ] Email/SMS notifications for low attendance
- [ ] Admin dashboard for managing multiple classes
- [ ] Mobile app (React Native)
- [ ] Attendance trend charts over time

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute.

---

## 👨‍💻 Author

Built with ❤️ using React + jsQR  
*AttendQR Pro — Making attendance smarter, one scan at a time.*