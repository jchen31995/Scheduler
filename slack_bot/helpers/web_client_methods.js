const _ = require('lodash')
const { WebClient } = require('@slack/client')

const API_THROTTLE = 1000
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN

const web = new WebClient(SLACK_BOT_TOKEN)

const getUserInfo = (user) => {
  return web.users.info({ user })
  .then((resp) => {
    const { id, name } = resp.user
    const { email } = resp.user.profile
    return {
      slack_id: id,
      slack_username: name,
      slack_email: email,
    }
  })
  .catch(console.error)
}

const postMessage = _.throttle((conversationId, message, attachments) => {
  return web.chat.postMessage({ channel: conversationId, text: message, attachments })
  .catch(console.error)
}, API_THROTTLE)

const updateMessage = _.throttle((attachments, channelId, message, ts) => {
  return web.chat.update({ channel: channelId, text: message, ts, attachments, as_user: true })
  .catch(console.error)
}, API_THROTTLE)

module.exports = {
  getUserInfo,
  postMessage,
  updateMessage,
}
