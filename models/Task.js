const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const Schema = mongoose.Schema

const taskSchema = new Schema({
  summary: {
    type: String,
    required: true,
  },
  location: String,
  description: String,
  day: {
    type: String,
    required: true,
  },
  google_calendar_event_id: String,
  requester_id: String,
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task
