
# Talkify - Real-Time Chat Application

Talkify is a full-featured chat application built with the MERN stack (MongoDB, Express, React, Node.js). It provides one-to-one messaging, group chats, and user authentication.

## Features

- Real-time messaging using Socket.io
- One-to-one private chat
- Group chat with admin roles
- User authentication and authorization
- Online/offline status indicators
- Message timestamps
- User profiles with avatars
- Modern UI with responsive design

## Tech Stack

### Frontend
- React
- TypeScript
- TailwindCSS
- Shadcn UI Components
- Socket.io-client
- React Router
- Axios

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- Socket.io
- JWT Authentication
- Bcrypt.js

## Project Structure

The project is divided into two main parts:

1. **Frontend (React)** - Located in the main directory
2. **Backend (Node.js)** - Located in the `/server` directory

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
```
git clone <repository-url>
cd talkify
```

2. Install frontend dependencies
```
npm install
```

3. Install backend dependencies
```
cd server
npm install
```

4. Create environment variables
```
# In server directory
cp .env.example .env
```
Edit the `.env` file to match your MongoDB connection string and other configurations.

### Running the Application

1. Start the backend server
```
cd server
npm run dev
```

2. Start the frontend application (in a new terminal)
```
npm run dev
```

3. Open your browser and navigate to `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Log out a user

### Users
- `GET /api/users` - Get all users or search users
- `GET /api/users/:id` - Get a user by ID
- `PUT /api/users/profile` - Update user profile

### Chats
- `POST /api/chats` - Create or access one-to-one chat
- `GET /api/chats` - Get all chats for a user
- `POST /api/chats/group` - Create a group chat
- `PUT /api/chats/rename` - Rename a group chat
- `PUT /api/chats/add` - Add user to group chat
- `PUT /api/chats/remove` - Remove user from group chat
- `GET /api/chats/:id` - Get a specific chat by ID

### Messages
- `POST /api/messages` - Send a new message
- `GET /api/messages/:chatId` - Get all messages for a chat

## License

[MIT](LICENSE)
