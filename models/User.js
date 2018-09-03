const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  default_meeting_length: Number,
  google_calendar_account: Object,
  slack_id: String,
  slack_username: String,
  slack_email: String,
  slack_dm_id: String,
})

const User = mongoose.model('User', userSchema)

module.exports = User
