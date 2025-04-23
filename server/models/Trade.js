import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  isAdvertised: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  // ✅ New Fields for fulfilled trade participants
  fromCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null, // Will be set once trade is accepted
  },
  toCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null, // Will be set once trade is accepted
  }
}, { timestamps: true }); // ✅ Includes createdAt and updatedAt

const Trade = mongoose.model('Trade', tradeSchema);
export default Trade;
