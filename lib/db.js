import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) {
    // Defer throwing until an actual connection is attempted so importing this
    // module during build (or static export) doesn't crash when CI/build
    // environments provide secrets at deploy time (e.g. Vercel env vars).
    throw new Error('Please define the MONGODB_URI environment variable. Set it in your deployment environment (do not commit secrets to the repo).');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
    }).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
