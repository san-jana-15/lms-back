# LMS – Learning Management System

A full–stack LMS application with:

- Student Dashboard  
- Tutor Dashboard  
- Admin Dashboard  
- Session Bookings  
- Tutor Availability  
- Recording Purchases  
- Reviews & Ratings  
- User Role Management  
- User Activation / Deactivation  

---

## 🔧 Tech Stack


### Backend
- Node.js  
- Express.js  
- MongoDB (Mongoose)  
- JWT Authentication  
- Multer (file uploads)

---

## 📁 Project Structure

```
LMS/
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── uploads/
│   ├── server.js
│   └── package.json

---

## 🚀 Backend Setup

```
cd backend
npm install
```

Create `.env`:

```
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret
PORT=5000
```

Start backend:

```
npm start
```

Backend URL:
```
http://localhost:5000

```

## 📌 Main API Endpoints

### Auth
- POST /auth/register  
- POST /auth/login  
- GET /auth/profile  

### Tutors
- GET /tutors  
- GET /tutors/profile/me  
- PUT /tutors/profile/update  

### Bookings
- POST /bookings  
- GET /bookings/student  
- GET /bookings/tutor  
- PATCH /bookings/accept/:id  
- PATCH /bookings/decline/:id  
- PATCH /bookings/reschedule/:id  
- PATCH /bookings/tutor-reschedule/:id  
- PATCH /bookings/cancel/:id  

### Recordings
- GET /recordings  
- POST /recordings/upload  

### Payments
- POST /fake-payment/pay  
- GET /fake-payment/paid  

### Reviews
- POST /reviews  
- GET /reviews/tutor/:id  

### Admin
- PUT /admin/toggle/:id  
- PUT /admin/role/:id  

---

## ✔ Quick Start

1. Start backend:
```
cd backend
npm start
```

Your LMS system is now running.

---

## 📄 License

This project is for educational and development use.