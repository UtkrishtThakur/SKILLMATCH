// lib/dbConnect.js
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL;
if (!MONGO_URI) {
  throw new Error("Please define the MONGODB_URI (or MONGO_URI) environment variable inside .env.local");
}

// Use a global cache to avoid reconnecting in dev / HMR
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ MongoDB connected");
  } catch (err) {
    cached.promise = null;
    console.error("❌ MongoDB connection error", err);
    throw err;
  }
  return cached.conn;
}
