const _ = require('lodash')
const { WebClient } = require('@slack/client')

const User =require('../../models/User')

const API_THROTTLE = 1000
const NGROK_URL = process.env.NGROK_URL
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

const greetUsers = () => {
  const greetingMessage = `Hello! I'm a scheduling assistant. I can create reminders and meetings.`
  web.conversations.list({types: 'im'})
  .then(resp => {
    resp.channels.forEach(async(dm) => {
      if(dm.user!=='USLACKBOT'){
        await web.conversations.history({ channel: dm.id, count: 10 })
        .then((msgs) => {
          const mostRecent = msgs.messages[0]
          if (mostRecent) {
            if( mostRecent.text!==greetingMessage) {
              postMessage(dm.id, greetingMessage)
            }
          }
        })
        .catch(console.error)

        await User.findOne({slack_id: dm.user})
        .then(async (user) => {
          if (!user) {
            const userInfo = await getUserInfo(dm.user)
            return new User(userInfo).save()
          }
          return user
        })
        .then(user => {
          if (!user.google_auth_tokens) {
            const authenticationURL = `${ NGROK_URL }/authenticate?slack_id=${ user.slack_id }`
            const authenticationMessage = `I need your permission to access your calendar. I won’t be sharing any information with others. Please connect your calendar here: ${ authenticationURL }`
            postMessage( dm.id, authenticationMessage)
          }
        })
        .catch(console.error)

      }
    })
  })

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
  greetUsers,
  postMessage,
  updateMessage,
}
