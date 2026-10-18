
# 🎬 SyncRoom

### **Watch YouTube Together in Perfect Sync**
*Sub-second video stream synchronization, server-enforced RBAC role security, and instant guest access without requiring an account[cite: 2].*

[![Production](https://img.shields.io/badge/Status-Live%20%26%20Production-emerald?style=for-the-badge)](https://watch-party-opal.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Socket.io-violet?style=for-the-badge)](https://github.com/tiya-1/watch-party)

</div>

---

## ✨ Key Features

* **⚡ Ultra-Low Latency Synchronization:** Sub-second real-time playback synchronization (Play, Pause, and Seek actions update instantly across all room participants)[cite: 2].
* **👑 Strict Role-Based Access Control (RBAC):** Original room creator acts as the **Host** with permissions to promote moderators, transfer host privileges, and manage or kick participants[cite: 1, 2].
* **🎭 Instant Guest Mode:** Unauthenticated users automatically receive secure temporary guest identities (e.g., `Guest_6134`) to join watch parties instantly without friction[cite: 2].
* **💬 Real-Time Chat & Emoji Reactions:** Interactive chat room with system join/leave notifications, floating emoji reactions, and an active Hype Meter.
* **🎥 Shared Video Queue & Moods:** Collaborative video queue management, video voting, and dynamic cinematic atmosphere moods (Cinema, Neon Arcade, Lo-fi Rain, Sunset).

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, TailwindCSS, Framer Motion, Lucide Icons, Socket.io-client
* **Backend:** Node.js, Express.js, Socket.io, Mongoose, MongoDB Atlas
* **Deployment:** Vercel (Frontend) & Render (Backend)[cite: 2]

---

## 🚀 Getting Started Locally

### 1. Clone the Repository

```

bash
git clone [https://github.com/tiya-1/watch-party.git](https://www.google.com/search?q=https%3A%2F%2Fgithub.com%2Ftiya-1%2Fwatch-party.git)
cd watch-party

```

### 2. Setup Backend

```

bash
cd backend
npm install

```
Create a `.env` file inside the `backend` folder:

```

env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173

```
Start the backend server:

```

bash
npm run dev

```

### 3. Setup Frontend
Open a new terminal tab and navigate to the frontend folder:

```

bash
cd frontend
npm install

```
Create a `.env` file inside the `frontend` folder:

```

env
VITE_SERVER_URL=http://localhost:5000

```
Start the frontend development server:

```

bash
npm run dev

```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/tiya-1/watch-party/issues).

---

<div align="center">
  <p>Built with ❤️ by Tiya Jain</p>
</div>

```
