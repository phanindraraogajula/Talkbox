# TalkBox 
Real-time chat application built with Socket.IO, React, and Node.js

---

## 1. Project Overview

**TalkBox** is a real-time web chat application that supports:

- A **global chat room** for everyone
- **Private 1-to-1 direct messages** between friends
- A clean, modern **React UI** designed for students and everyday users

The goal of TalkBox is to make it easy to experiment with **socket programming**, **event-driven architecture**, and **database-backed messaging** in a realistic, but still student-friendly, project.

---

## 2. Key Features

- **Global Chat**
  - Single shared room for all online users
  - Messages broadcast in real time using Socket.IO

- **Direct Messages**
  - Private 1-to-1 chat between friends
  - Messages stored in PostgreSQL for persistence
  - History loads instantly when you open a conversation

- **User Accounts**
  - Register / login with username + password
  - Basic session / token-based authentication (backend)

- **Presence & UX**
  - Online users list (who is currently active)
  - Typing indicators (who is typing in global chat)
  - Responsive layout for desktop

---

## 3. Tech Stack

**Frontend**
- React + Vite
- TypeScript (if enabled) / JavaScript
- Tailwind CSS + component library (e.g., shadcn/ui)
- Socket.IO client

**Backend**
- Node.js + Express
- Socket.IO server
- PostgreSQL + Prisma ORM

**Other**
- REST APIs for auth and message history
- Docker-ready (optional future step)

---

## 4. High-Level Architecture

```text
[React Frontend]  ⇄  [Express + Socket.IO Backend]  ⇄  [PostgreSQL DB]

- HTTP (REST) used for:
  - Auth (login / register)
  - Fetch past messages

- WebSockets (Socket.IO) used for:
  - Real-time global chat
  - Real-time private messages
  - Online users & typing indicators
