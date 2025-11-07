import mongoose from 'mongoose';

const EntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  date: { type: Date, required: true },
  blood: { type: Number, default: 0 },
  mood: { type: Number, default: 0 },
  pain: { type: Number, default: 0 },
  notes: { type: String },
  sex: { type: Number, default: 0 },
}, { timestamps: true });

EntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.Entry || mongoose.model('Entry', EntrySchema);
