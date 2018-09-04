const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const Schema = mongoose.Schema

const userSchema = new Schema({
  default_meeting_length: {
    type: Number,
    default: 30,
  },
  google_auth_tokens: Object,
  slack_id: {
    type: String,
    required: true,
  },
  slack_username: String,
  slack_email: String,
  }, { minimize: false })

const User = mongoose.model('User', userSchema)

module.exports = User
