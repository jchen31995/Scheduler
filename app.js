const bodyParser = require('body-parser')
require('dotenv-safe').config()
const express = require('express')
const mongoose = require('mongoose')

const googleAPI = require('./apis/google/index')
const { addEvent } = require('./apis/google/helpers/calendar_methods')
const Meeting = require('./models/Meeting')
const Task = require('./models/Task')
require('./slack_bot')
const { handleUnexpectedEvent } = require('./slack_bot/helpers/event_handlers')

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true })

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(googleAPI)

app.get('/', (req, res) => {
  res.send('Hello hello!')
})

app.post('/bot/events', (req, res) => {
  console.log("An event has been detected: ", req.body)
  res.status(200).send('subscribed to events API')
})

app.post('/slack/interactive', (req, res) => {
  const interactivePayload = JSON.parse(req.body.payload)
  const eventType = interactivePayload.actions[0].name
  const requesterId = interactivePayload.user.id
  let confirmationMessage
  switch (eventType) {
    case ('confirm-meeting'):
      Meeting.findOne({ requester_id: requesterId })
      .then(meeting => {
        const { summary,
          google_calendar_id: googleCalendarId,
          location,
          attendees,
          description,
          start,
          end
        } = meeting

        const calendarEvent = {
          summary,
          location,
          attendees,
          description,
          start,
          end,
          reminders: {
            'useDefault': true,
          }
        }

        addEvent(requesterId, googleCalendarId, calendarEvent).then((resp) => {
          confirmationMessage = `Meeting Confirmed: ${resp.htmlLink}`
          meeting.remove()
          res.status(200).send(confirmationMessage)
        }).catch(console.error)
      })
    .catch(console.error)
    break

    case ('confirm-reminder'):
      Task.findOne({ requester_id: requesterId })
      .then(task => {
        const { summary,
          google_calendar_id: googleCalendarId,
          day,
         } = task
        const calendarEvent = {
          summary,
          start: day,
          end: day,
          reminders: {
            'useDefault': true,
          }
        }
        addEvent(requesterId, googleCalendarId, calendarEvent).then((resp) => {
          confirmationMessage = `Reminder Confirmed: ${resp.htmlLink}`
          task.remove()
          res.status(200).send(confirmationMessage)
        })

      })
      .catch(console.error)
      break

    case ('decline-meeting'):
      Meeting.findOne({ requester_id: requesterId })
        .then(meeting => {
          meeting.remove()
        })
        .catch(console.error)
      confirmationMessage = { text: `Alrighty, the event won't get added to your calendar` }
      res.status(200).json(confirmationMessage)
      break

    case ('decline-reminder'):
      Task.findOne({ requester_id: requesterId })
      .then(task => {
        task.remove()
      })
      .catch(console.error)
      confirmationMessage = { text: `Alrighty, the event won't get added to your calendar` }
      res.status(200).json(confirmationMessage)
      break

    default:
      confirmationMessage = handleUnexpectedEvent(req.body)
      res.status(500).json(confirmationMessage)
  }
})

app.listen(process.env.PORT || 3000, function () {
  console.log('Server listening on port 3000')
})
