const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    playerName: { type: String, required: true, trim: true },
    game: { type: String, default: 'default' },  // maybe support multiple games in the future
    score: { type: Number, required: true },
  },
  { timestamps: true }
);

// Index to make queries faster
ScoreSchema.index({ game: 1, score: -1, createdAt: -1 });
ScoreSchema.index({ owner: 1, playerName: 1, createdAt: -1 });

module.exports = mongoose.model('Score', ScoreSchema);