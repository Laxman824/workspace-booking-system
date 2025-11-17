
# 🏗️ Architecture Documentation

## Table of Contents
1. System Overview
2. Architecture Design
3. Data Models
4. Core Algorithms
5. API Design
6. Scalability & Performance
7. Security Considerations
8. AI Integration
9. Design Decisions & Trade-offs

---

# 1. System Overview

This project is a workspace booking platform that allows users to:

- Book meeting rooms by the hour  
- Cancel bookings (with conditions)  
- View analytics (total hours + revenue)  

The solution includes:

- A React (Vite + TypeScript) frontend  
- A Node.js (Express + TypeScript) backend  
- An in-memory datastore with a DB-ready architecture  
- Clean layering for maintainability  
- Deployed backend + frontend  

---

# 2. Architecture Design

## 2.1 High-Level System Architecture

```

Client (React)
|
| HTTPS
▼
Backend API (Node.js + Express)
|
▼
In-Memory Store (DB-ready layers)

```

The architecture avoids complexity while remaining scalable for future expansion.

---

## 2.2 Backend Layered Design

```

Routes → Controllers → Services → Models → Storage

```

### Routes
- Define REST endpoints  
- Bind middleware + validators  
- No business logic  

### Controllers
- Translate HTTP → business calls  
- Manage status codes + responses  

### Services
- The core business logic:
  - conflict handling  
  - pricing engine  
  - cancellation rules  
  - input validation  
  - analytics  

### Models
- Data access layer  
- Abstracts storage so switching to PostgreSQL later is simple  

### Storage
- In-memory Maps for:
  - rooms
  - bookings  

---

## 2.3 Frontend Architecture

```

components/
pages/
services/
hooks/
types/

````

UI is intentionally simple because this assignment focuses on backend logic and architecture.

---

# 3. Data Models

## 3.1 Room Entity

```ts
interface Room {
  id: string;
  name: string;
  baseHourlyRate: number;
  capacity: number;
}
````

## 3.2 Booking Entity

```ts
interface Booking {
  id: string;
  roomId: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  totalPrice: number;
  status: "CONFIRMED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}
```

---

# 4. Core Algorithms

## 4.1 Conflict Detection

Two time intervals overlap if:

```
newStart < existingEnd AND newEnd > existingStart
```

Edge cases handled:

* End == Start → allowed
* Cancelled bookings → ignored
* Fully inside overlap → blocked
* Partial overlap → blocked

## 4.2 Dynamic Pricing

Peak hours (Mon–Fri):

* 10 AM–1 PM
* 4 PM–7 PM

Multiplier: **1.5×**

Algorithm walks hour-by-hour and sums:

```
total += baseRate * multiplier * (slotHours)
```

Handles:

* partial hours
* timezones
* weekday/weekend differences

## 4.3 Cancellation Rules

Cancellation allowed **only if**:

```
now < startTime - 2 hours
```

Cancelled bookings:

* do NOT appear in analytics
* do NOT block future bookings

## 4.4 Analytics Algorithm

For each room:

* sum total hours
* sum total revenue (only confirmed bookings)

---

# 5. API Design

## Endpoints

### GET /api/rooms

List rooms.

### POST /api/bookings

Create a booking:

* validate times
* check conflict
* compute price
* return booking ID + price

### POST /api/bookings/:id/cancel

Cancel if >2 hours before start.

### GET /api/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD

Returns:

```
[
 { roomId, roomName, totalHours, totalRevenue }
]
```

---

# 6. Scalability & Performance

Even though this project runs on an in-memory store, the architecture supports scaling:

## 6.1 Database Scaling Path

Switch to PostgreSQL with:

* room table
* bookings table
* index on (room_id, start_time, end_time)
* exclusion constraint to prevent overlaps

## 6.2 Caching Layer

Redis recommended for:

* Room list
* Analytics (15 min TTL)

## 6.3 Horizontal Scaling

With PostgreSQL + stateless API servers:

* Load balancer
* Multiple instances
* DB read replicas

## 6.4 Microservice Ready

Future services:

* Booking service
* Analytics service
* Notification service

---

# 7. Security Considerations

## Implemented:

* Input validation (Zod)
* HTTPS in deployment
* CORS restricted
* Environment variables for secrets
* Error formatter (no stack trace in prod)

## Recommended for production:

* Rate limiting
* Helmet security headers
* Logging with trace IDs
* SQL injection protection
* Request body limits

---

# 8. AI Integration

AI tools were used responsibly to speed up development:

### AI Used For:

* brainstorming folder structure
* generating boilerplate
* refining pricing logic patterns
* writing documentation skeleton

### AI Not Used For:

* critical logic
* pricing algorithm
* conflict detection logic
* analytics computations

All core logic was manually verified and optimized.

---

# 9. Design Decisions & Trade-offs

## 9.1 In-Memory Database (Trade-off)

Chosen for simplicity and speed during development.

Pros:

* zero setup
* fast iteration
* no failure points

Cons:

* not persistent
* not horizontally scalable

## 9.2 Monolith Instead of Microservices

Chosen because scope is small.

Cons:

* no independent scaling
* heavier deploys

Pros:

* faster dev
* fewer moving parts
* clearer architecture

## 9.3 UTC Storage, IST Business Logic

Store date times in UTC, convert to IST for business rules.

Reason:

* consistent storage
* avoids DST issues
* frontend and backend don’t drift

---

# Conclusion

This architecture balances:

* clarity
* maintainability
* correctness
* future scalability


