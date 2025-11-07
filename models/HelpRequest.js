import mongoose from 'mongoose';

const HelpRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, default: 'Need help' },
  location: { type: Object },
}, { timestamps: true });

export default mongoose.models.HelpRequest || mongoose.model('HelpRequest', HelpRequestSchema);
