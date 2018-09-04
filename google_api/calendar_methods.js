const { google } = require('googleapis')

const { getAuthClient } = require('./oauth_methods')
const User = require('../models/User')

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

const addEvent = async (userSlackId, event) => {
  const auth = getAuthClient()
  await User.findOne({ slack_id: userSlackId })
    .then ((user) => {
      return auth.setCredentials(user.google_auth_tokens)
    })
    .catch((err) => console.log("Error finding user: ", err))

  const calendar = google.calendar({version: 'v3', auth})
  calendar.events.insert({
    auth: auth,
    calendarId: 'primary',
    resource: event,
  })
  .then((createdEvent) => {
    console.log('Event created: %s', createdEvent.data.htmlLink)
  })
  .catch((err) => {console.log('some error: ', err)})
}

module.exports = {
  addEvent,
  listEvents,
}
