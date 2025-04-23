import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded
// dotenv.config({ path: path.resolve('./config.env') });

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined. Please check your config.env!');
  process.exit(1); // Prevent the app from starting without a valid secret
}

// ✅ Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided or malformed header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach decoded user to request
    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ✅ Middleware to check role access
export const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied: insufficient role' });
  }
  next();
};
