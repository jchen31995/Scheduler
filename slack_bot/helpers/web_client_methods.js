const _ = require('lodash')
const { WebClient } = require('@slack/client')

const User =require('../../models/User')

const API_THROTTLE = 1000
const NGROK_URL = process.env.NGROK_URL
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN

const web = new WebClient(SLACK_BOT_TOKEN)

const getUserInfo = (userId, dmId) => {
  return web.users.info({ user: userId })
  .then((resp) => {
    const { id, name } = resp.user
    const { email } = resp.user.profile
    return {
      slack_id: id,
      slack_username: name,
      slack_email: email,
      slack_dm_id: dmId,
    }
  })
  .catch(console.error)
}

const greetUsers = () => {
  const greetingMessage = `Hello! I'm a scheduling assistant. I can create reminders and meetings.`
  web.conversations.list({ types: 'im' })
  .then(async(resp) => {
    await resp.channels.forEach((dm) => {
      if(dm.user!=='USLACKBOT'){
        const userSlackId = dm.user
        const userDmId = dm.id
        web.conversations.history({ channel: userDmId })
        .then((msgs) => {
          const recentMessages = msgs.messages
          let appIntroAlreadyMade = false
          for(let i = 0; i<recentMessages.length; i++){
            if(recentMessages[i].text === greetingMessage) {
              appIntroAlreadyMade = true
              break
            }
          }

          if (!appIntroAlreadyMade) {
            web.chat.postMessage({ channel: userDmId, text: greetingMessage })
          }
        })
        .catch(console.error)

        User.findOne({slack_id: userSlackId})
        .then(async (user) => {
          if (!user) {
            const userInfo = await getUserInfo(userSlackId, userDmId)

            return new User(userInfo).save()
          }
          return user
        })
        .then((user) => {

          if (!user.google_auth_tokens) {

            const authenticationURL = `${ NGROK_URL }/authenticate?slack_id=${ user.slack_id }`
            const authenticationMessage = `I need your permission to access your calendar. I won’t be sharing any information with others. Please connect your calendar here: ${ authenticationURL }`
            web.chat.postMessage({ channel: userDmId, text: authenticationMessage })
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
