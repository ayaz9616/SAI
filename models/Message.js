import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String },
  text: { type: String, required: true },
}, { timestamps: true });

MessageSchema.index({ createdAt: -1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
