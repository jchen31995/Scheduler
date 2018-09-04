
const { RTMClient } = require('@slack/client')
const { getUserInfo } = require('./helper_methods')

const NGROK_URL = process.env.NGROK_URL
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const rtm = new RTMClient(SLACK_BOT_TOKEN)

const User = require('../models/User')

// For now, any message will trigger bot to reply with google auth URL if needed
// For structure of `event`, see https://api.slack.com/events/message
rtm.on('message', (message) => {
  User.findOne({slack_id: message.user})
    .then(async (user) => {
      if (!user) {
        const userInfo = await getUserInfo(message.user)
        return new User(userInfo).save()
      }
      return user
    })
    .then((user) => {
      if (!user.google_auth_tokens) {
        const authenticationURL = `${ NGROK_URL }/authenticate?slack_id=${user.slack_id}`
        rtm.sendMessage(`Please connect me to your Google Calendar here: ${authenticationURL}`, message.channel)
        .catch(console.error)
      }
    })

  console.log(`(channel:${message.channel}) ${message.user} says: ${message.text}`)
})

rtm.start()
