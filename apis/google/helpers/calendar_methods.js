const { google } = require('googleapis')

const { setOAuthCredentials } = require('./oauth')

const addEvent = async (userSlackId, calendarId, event) => {
  const auth = await setOAuthCredentials(userSlackId)
  const calendar = google.calendar({version: 'v3', auth})

  return calendar.events.insert({
    auth: auth,
    calendarId,
    resource: event,
  })
  .then((resp) => {
    const createdEvent = resp.data
    return createdEvent
  })
  .catch(console.error)
}

const listEvents = async (userSlackId) => {
  const auth = await setOAuthCredentials(userSlackId)
  const calendar = google.calendar({version: 'v3', auth})
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  })
  .then((resp) => {
    const events = resp.data.items;
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
  .catch((err) => err)
}

module.exports = {
  addEvent,
  listEvents,
}
