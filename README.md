
---

## 📄 README.md

**README.md** (REPLACE EXISTING)

```markdown
# 🚀 Workspace Booking & Pricing System

A full-stack AI-powered workspace booking system with real-time voice chat, dynamic pricing, conflict detection, and analytics dashboard.

## 🌐 Live Demo

- **Frontend**: https://workspace-booking-system-3f8ur5k2i-learnwithlaxman.vercel.app/
- **Backend**: https://workspace-booking-system-ay8j.onrender.com
- **Repository**: https://github.com/Laxman824/workspace-booking-system

## ⚠️ Important Note

**Backend Warm-up:** The backend is deployed on Render's free tier, which spins down after 15 minutes of inactivity. The first request after inactivity may take 20-30 seconds to wake up. Subsequent requests will be fast (<200ms).

## ✨ Key Features

### 🤖 AI-Powered Booking Assistant
- Natural language booking: *"Book Cabin 1 for John tomorrow from 2PM to 4PM"*
- Powered by Google Gemini 2.0 Flash
- Intelligent information extraction
- Context-aware conversations

### 🎤 Real-Time Voice Integration
- Live speech-to-text transcription
- Text-to-speech responses
- Hands-free booking experience
- Works in Chrome, Edge, Safari

### 💰 Dynamic Pricing
- **Peak Hours** (Mon-Fri, 10AM-1PM & 4PM-7PM): 1.5× base rate
- **Off-Peak**: Base rate
- Hour-by-hour calculation
- Transparent pricing breakdown

### 🚫 Intelligent Conflict Prevention
- Real-time overlap detection
- Adjacent bookings allowed (end = next start)
- Clear conflict messaging with exact times

### 📊 Analytics Dashboard
- Room utilization metrics
- Revenue tracking
- Date range filtering
- Visual statistics

### 📱 Responsive Design
- Mobile-first approach
- Liquid glass morphism UI
- Smooth animations
- Accessible interface

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: In-memory (PostgreSQL-ready)
- **AI**: Google Gemini 2.0 API
- **Deployment**: Render

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router 6
- **HTTP Client**: Axios
- **Deployment**: Vercel

### DevOps
- **Version Control**: Git/GitHub
- **CI/CD**: Vercel/Render auto-deploy
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Modern browser (Chrome/Edge/Safari recommended for voice)

## 🚀 Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/Laxman824/workspace-booking-system.git
cd workspace-booking-system