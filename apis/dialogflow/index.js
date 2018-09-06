const dialogflow = require('dialogflow')
const momentTZ = require('moment-timezone')

const DIALOGFLOW_CREDENTIALS = process.env.DIALOGFLOW_CREDENTIALS_PATH
const projectId = process.env.DIALOGFLOW_PROJECT_ID
const sessionId = 'some-hashed-session-id'

// Instantiate a DialogFlow client
const config = { keyFilename: DIALOGFLOW_CREDENTIALS }
const sessionClient = new dialogflow.SessionsClient(config);
const sessionPath = sessionClient.sessionPath(projectId, sessionId)


const detectIntent = (message) => {
  const request = {
    session: sessionPath,
    queryParams: {
      "timeZone": momentTZ.tz.guess()
    },
    queryInput: {
      text: {
        text: message.text,
        languageCode: 'en',
      }
    }
  }

  return sessionClient
    .detectIntent(request)
    .then(responses => {
      const result = responses[0].queryResult
      if (!result.intent) {
        return null
      }
      return result
    })
    .catch(console.error)
}

module.exports = { detectIntent }
