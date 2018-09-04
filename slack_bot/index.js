const { getAuthClient, getAuthURL } = require('../google_api/helper_methods')

const { getUserInfo } = require('./helper_methods')

const { RTMClient } = require('@slack/client')

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
        const googleAuthClient = getAuthClient()
        const googleAuthURL = getAuthURL(googleAuthClient,user.slack_id)
        rtm.sendMessage(googleAuthURL, message.channel)
        .catch(console.error)
      }
    })

  console.log(`(channel:${message.channel}) ${message.user} says: ${message.text}`)
})

rtm.start()
