# 🎯 VISIO Detect — AI Object Detection Web App

A browser-based real-time object detection system using **YOLOv8 and FastAPI**, where users can detect objects directly through their camera.

---

## 🌐 Live Demo

Frontend (Netlify):
https://zesty-granita-eef681.netlify.app

Backend (Render):
https://visio-backend-ltmo.onrender.com

---

## 📌 Overview

VISIO Detect is a full-stack AI application that captures frames from the browser camera, sends them to a backend API, and returns object detections using YOLOv8.

It demonstrates real-world integration of **computer vision + web technologies**.

---

## 🚀 Features

* 📷 Real-time camera input (browser-based)
* 🧠 YOLOv8 object detection
* ⚡ FastAPI backend for inference
* 📡 REST API communication
* 🎯 Bounding box visualization on canvas
* 🎛️ Adjustable confidence threshold
* 📊 Detection latency display
* 📱 Responsive UI (works on mobile)

---

## 🛠️ Tech Stack

**Frontend**

* HTML5
* CSS3
* JavaScript (Canvas API, getUserMedia)

**Backend**

* FastAPI
* Uvicorn
* Ultralytics YOLOv8
* NumPy, Pillow

**Deployment**

* Netlify (Frontend)
* Render (Backend)

---

## 🧠 How It Works

1. Browser captures video stream using `getUserMedia`
2. Frames are converted to base64 images
3. Images sent to backend (`/detect`)
4. YOLOv8 processes image
5. JSON response returned
6. Bounding boxes rendered on canvas

---

## ⚠️ Limitations

* Render free tier causes cold start delays
* Real-time detection depends on network latency
* Performance limited on free hosting

---

## ▶️ Run Locally

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend

Open `index.html` in browser

---

## 📂 Project Structure

```
visio-detect/
├── backend/
├── frontend/
└── README.md
```

---

## 📜 License

This project is developed for educational, portfolio, and internship purposes.
