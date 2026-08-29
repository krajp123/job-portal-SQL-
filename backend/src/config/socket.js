const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Candidate = require('../models/Candidate');
const Recruiter = require('../models/Recruiter');

let io = null;

// Called once from server.js with the raw http server.
function initSocket(httpServer) {
  const allowedOrigins = [process.env.PUBLIC_FRONTEND_URL, process.env.ADMIN_FRONTEND_URL].filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
  });

  // Auth handshake: client connects with `auth: { token }` (same JWT as the REST API).
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify user still exists and account is active
      const userRole = decoded.role;
      const userId = decoded.id;
      
      if (userRole === 'candidate') {
        const user = await Candidate.findById(userId).select('accountStatus').lean();
        if (!user) return next(new Error('User not found'));
        if (user.accountStatus !== 'active') {
          return next(new Error(`Account is ${user.accountStatus}`));
        }
      } else if (userRole === 'recruiter') {
        const user = await Recruiter.findById(userId).select('accountStatus').lean();
        if (!user) return next(new Error('User not found'));
        if (user.accountStatus !== 'active') {
          return next(new Error(`Account is ${user.accountStatus}`));
        }
      }
      
      socket.user = decoded; // { id, role }
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Every user gets their own room so controllers can push events to
    // `user:<id>` without knowing which socket(s) belong to them.
    socket.join(`user:${socket.user.id}`);

    // Periodically verify token and account status (every 5 minutes)
    const tokenCheckInterval = setInterval(async () => {
      try {
        const userRole = socket.user.role;
        const userId = socket.user.id;
        let user;
        
        if (userRole === 'candidate') {
          user = await Candidate.findById(userId).select('accountStatus').lean();
        } else if (userRole === 'recruiter') {
          user = await Recruiter.findById(userId).select('accountStatus').lean();
        }
        
        // Disconnect if user no longer exists or account is suspended/banned
        if (!user || user.accountStatus !== 'active') {
          socket.disconnect(true);
        }
      } catch (err) {
        // On error, disconnect to be safe
        socket.disconnect(true);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    socket.on('disconnect', () => {
      clearInterval(tokenCheckInterval);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
