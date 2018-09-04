const { google } = require('googleapis')

// Tokens
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const GOOGLE_REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || ''
const scope = ['https://www.googleapis.com/auth/calendar']

const User = require('../models/User')

const getAuthClient = () => new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL)

// Gets + Saves Google Auth Tokens
const getAuthToken = (code, userSlackId) => {
  const oauth2Client = getAuthClient()
  return new Promise((resolve, reject) => {
    oauth2Client.getToken(code, async (err, tokens) => {
      if (err) {
        return reject(err)
      }
      await User.findOneAndUpdate({ slack_id: userSlackId }, { "$set": { 'google_auth_tokens': tokens } })
      return resolve(tokens)
    })
  })
}

const getAuthURL = (oauth2Client, userSlackId) => oauth2Client.generateAuthUrl({ access_type: 'offline', scope, state: userSlackId })

// once you have token saved, you can move every calendar message to separate file
const listEvents = async (userSlackId) => {
  const auth = getAuthClient()
  await User.findOne({ slack_id: userSlackId })
    .then ((user) => {
      return auth.setCredentials(user.google_auth_tokens)
    })
    .catch((err) => console.log("Error finding user: ", err))

  const calendar = google.calendar({version: 'v3', auth})
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err)
    const events = res.data.items;
    if (events.length) {
      console.log('Upcoming 10 events:')
      events.map((event) => {
        const start = event.start.dateTime || event.start.date
        console.log(`${start} - ${event.summary}`)
      });
    } else {
      console.log('No upcoming events found.')
    }
  })
}

module.exports = {
  getAuthClient,
  getAuthURL,
  getAuthToken,
  listEvents
}
