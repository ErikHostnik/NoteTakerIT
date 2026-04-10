const mongoose = require('mongoose')

const stepSchema = new mongoose.Schema({
  id: String,
  text: String,
  level: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
}, { _id: false })

const noteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'other' },
  status: { type: String, default: 'resolved' },
  priority: { type: String, default: 'medium' },
  date: { type: String, required: true },
  tags: [String],
  steps: [stepSchema],
  isDoc: { type: Boolean, default: false },
  createdAt: String,
  updatedAt: String
}, { timestamps: false })

module.exports = mongoose.model('Note', noteSchema)
