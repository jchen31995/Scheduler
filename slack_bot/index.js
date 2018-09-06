
const { RTMClient } = require('@slack/client')

const { detectIntent } = require('../apis/dialogflow')
const { getUserInfo, postMessage } = require('./helper_methods')
const User = require('../models/User')

const NGROK_URL = process.env.NGROK_URL
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const rtm = new RTMClient(SLACK_BOT_TOKEN)

rtm.on('message', message => {
  if (message.subtype && message.subtype === 'bot_message') {
    return
  }

  User.findOne({slack_id: message.user})
    .then(async (user) => {
      if (!user) {
        const userInfo = await getUserInfo(message.user)
        return new User(userInfo).save()
      }
      return user
    })
    .then(async (user) => {
      if (!user.google_auth_tokens) {
        const authenticationURL = `${ NGROK_URL }/authenticate?slack_id=${ user.slack_id }`
        rtm.sendMessage(`Please connect me to your Google Calendar here: ${ authenticationURL }`, message.channel)
        .catch(console.error)
      }
      const result = await detectIntent(message)

      switch(result.intent.displayName) {
        case('meeting.add'):
          console.log('meeting added!')
          break

        case('reminder.add'):
          console.log('reminder added!')
          break

        default:
          postMessage(message.channel, 'I\'m not quite sure what to say...')
          console.log("default message!")
      }
    })

  console.log(`(channel:${ message.channel }) ${ message.user } says: ${ message.text }`)
})

rtm.start()
