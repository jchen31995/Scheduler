const { getAuthClient, getAuthURL } = require('../google_api/helper_methods')

const { RTMClient, WebClient } = require('@slack/client')

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const web = new WebClient(SLACK_BOT_TOKEN)
const rtm = new RTMClient(SLACK_BOT_TOKEN)


// Temporary Google Auth URL
const googleAuthClient = getAuthClient()
const googleAuthURL = getAuthURL(googleAuthClient)

// For now, any message will trigger bot to reply with google auth URL
// For structure of `event`, see https://api.slack.com/events/message
rtm.on('message', (message) => {
  rtm.sendMessage(googleAuthURL, message.channel)
  .then((resp) => {
    console.log("Information about posted message: ", resp)
  })
  .catch(console.error)

  console.log(`(channel:${message.channel}) ${message.user} says: ${message.text}`)
})

rtm.start()
