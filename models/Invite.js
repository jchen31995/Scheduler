const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inviteRequestSchema = new Schema({
  event_id: String,
  invitee_id: String,
  requester_id: String,
  status: String,
})

const InviteRequest = mongoose.model('InviteRequest', inviteRequestSchema)

module.exports = InviteRequest
