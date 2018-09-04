const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const Schema = mongoose.Schema

const meetingSchema = new Schema({
  day: {
    type: Date,
    required: true,
  },
  time: {
    type: Date,
    required: true,
  },
  invitees: {
    type: Array,
    required: true,
  },
  summary: String,
  location: String,
  description: String,
  meeting_length: Number,
  google_calendar: Object,
  status: String, // pending, scheduled
  created_at: Date,
  requester_id: String,
}, { minimize: false })

const Meeting = mongoose.model('Meeting', meetingSchema)

module.exports = Meeting
