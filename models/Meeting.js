const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const Schema = mongoose.Schema

const meetingSchema = new Schema({
  summary: String,
  location: String,
  description: String,
  start: {
    type: Object,
    required: true,
  },
  end: {
    type: Object,
    required: true,
  },
  attendees: Array,
  meeting_length: Number,
  google_calendar_id: String,
  status: String, // pending, scheduled
  created_at: Date,
  requester_id: String,
}, { minimize: false })

const Meeting = mongoose.model('Meeting', meetingSchema)

module.exports = Meeting
