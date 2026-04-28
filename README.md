# 🥘 FeedingUs — Smart Food Ordering & Management System

FeedingUs is a production-grade, data-driven food management platform designed to bridge the gap between restaurants and users. Built with the **MERN** stack, it features real-time business intelligence, AI-powered food recommendations, and a secure payment tracking system.

## 🚀 Live Demo
- **Web App:** [https://feedingus-smartapp.vercel.app](https://feedingus-smartapp.vercel.app)
- **API Server:** [https://feedingus-smartapp.onrender.com](https://feedingus-smartapp.onrender.com)

---

## 📸 Screenshots

<img width="2854" height="1606" alt="image" src="https://github.com/user-attachments/assets/6424231f-f4b2-4e1e-97ce-1e69297a0d4d" />

<img width="2684" height="1595" alt="image" src="https://github.com/user-attachments/assets/5d80a97a-c0c9-4ab9-813c-2c338756cb6c" />

## ✨ Key Features

### 🛒 For Users
- **Smart Discovery:** Personalized food recommendations based on past orders and favorites.
- **Real-time Tracking:** Live order status updates via WebSockets.
- **Secure Payments:** Integrated billing system with downloadable/printable invoices.
- **OTP Verification:** Secure account creation with Gmail-integrated verification.

### 📊 For Restaurants
- **Business Intelligence:** Peak-hour analytics and top-performing item leaderboards using MongoDB aggregations.
- **Order Management:** Streamlined workflow to manage incoming orders from "Pending" to "Delivered."
- **Data Cleanup:** Tools to clear history and manage menu items dynamically.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, Vanilla CSS (Glassmorphism), Recharts (Data Viz)
- **Backend:** Node.js, Express.js, Socket.io (Real-time)
- **Database:** MongoDB Atlas (Mongoose)
- **Security:** JWT (JSON Web Tokens), Bcrypt (Password Hashing)
- **Communications:** Nodemailer (SMTP/Gmail Integration)
- **Deployment:** Vercel (Frontend), Render (Backend)

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js installed
- MongoDB Atlas account
- Gmail App Password (for OTPs)

### 1. Clone the Repository
```bash
git clone https://github.com/amarnath-2005-developer/FEEDINGUS-SMARTAPP.git
cd FEEDINGUS-SMARTAPP
```

### 2. Backend Setup
```bash
cd feedingus-backend
npm install
# Create a .env file with your credentials
npm start
```

### 3. Frontend Setup
```bash
cd ../feedingus-react
npm install
# Create a .env file with VITE_API_URL
npm run dev
```

---

## 👤 Author
**Amarnath**
- GitHub: [@amarnath-2005-developer](https://github.com/amarnath-2005-developer)

---
*Developed as a smart solution for modern food logistics.*
