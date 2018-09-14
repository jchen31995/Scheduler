const _ = require('lodash')
const { RTMClient } = require('@slack/client')

const { detectIntent } = require('../apis/dialogflow')
const { setUserSchema, greetUsers, postMessage } = require('./helpers/web_client_methods')
const { displayWeather, promptMeeting, promptReminder } = require('./helpers/event_handlers')
const User = require('../models/User')

const NGROK_URL = process.env.NGROK_URL
const RTM_CONNECTION_THROTTLE = 60000 // Tier 1 Slack Rate Limit, 1 call per minute
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN

const rtm = new RTMClient(SLACK_BOT_TOKEN)

const throttledRTMConnection = _.throttle(()=>rtm.start(), RTM_CONNECTION_THROTTLE)

rtm.on('hello', greetUsers)

rtm.on('message', message => {
  if (message.subtype === 'bot_message' || message.subtype==='message_changed') {
    return
  }

  const userSlackId = message.user
  const userDmId = message.channel
  User.findOne({slack_id: userSlackId})
    .then(async (user) => {
      if (!user) {
        const userInfo = await setUserSchema(userSlackId, userDmId)
        return new User(userInfo).save()
      }
      return user
    })
    .then(async (user) => {
      if (!user.google_auth_tokens) {
        const authenticationURL = `${ NGROK_URL }/authenticate?slack_id=${ user.slack_id }`
        const authenticationMessage = `Please connect me to your Google Calendar here: ${ authenticationURL }`
        postMessage( message.channel, authenticationMessage)
        .catch(console.error)
        return
      } else{
        const result = await detectIntent(message)
        if(result.action==='get-additional-info' && result.fulfillmentText) {
          postMessage(message.channel, result.fulfillmentText)
        } else {
          const defaultMessage = `I'm not quite sure what to do...`
          switch(result.intent.displayName) {
            case('meeting.add'):
              promptMeeting(result, message)
              break

            case('reminder.add'):
              promptReminder(result, message)
              break

            case('weather'):
              displayWeather(result, message)
              break

            default:
              postMessage(message.channel, defaultMessage)
          }
        }
      }
    })
    .catch(console.error)

  console.log(`(channel:${ message.channel }) ${ message.user } says: ${ message.text }`)
})

throttledRTMConnection()
