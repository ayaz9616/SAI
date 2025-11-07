import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  periodDuration: { type: Number, default: 5 },
  cycleDuration: { type: Number, default: 30 },
  avatarUrl: { type: String },
  // Extended profile fields
  age: { type: Number, min: 10, max: 60 },
  heightCm: { type: Number, min: 100, max: 220 },
  weightKg: { type: Number, min: 30, max: 200 },
  firstPeriodAge: { type: Number, min: 8, max: 20 },
  primaryConcern: { type: String, maxlength: 300 },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
