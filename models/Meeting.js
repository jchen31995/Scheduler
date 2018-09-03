const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  subject: String,
  location: String,
  meeting_length: Number,
  google_calendar: Object,
  status: String, // pending, scheduled
  created_at: Date,
  requester_id: String,
})

const Meeting = mongoose.model('Meeting', meetingSchema)

module.exports = Meeting
