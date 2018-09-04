const express = require('express')
const { getAuthClient, getAuthToken, getAuthURL } = require('./oauth_methods')
const { addEvent, listEvents } = require('./calendar_methods')

const router = express.Router()

router.get('/authenticate', (req, res) => {
  const userSlackId = req.query.slack_id
  const googleAuthClient = getAuthClient()
  const googleAuthURL = getAuthURL(googleAuthClient,userSlackId)
  res.status(200).redirect(googleAuthURL)
})

// google authentication happens here
router.get('/authenticate/callback', (req, res) => {
  getAuthToken(req.query.code, req.query.state).then((resp) => {
    res.redirect('/authenticate/success')
  }).catch(err => res.redirect('/authenticate/failure?err=' + err))
})

router.get('/authenticate/success', (req, res) => {
  res.send('Successfully authenticated user. Head back over to Slack!')
})

router.get('/authenticate/failure', (req, res) => {
  const err = req.query.err
  res.send(`Something went wrong with the authentication. Please head back over to Slack and try again. Here's the error: ${err}`)
})

// route to test if google calendar successfully authenticated + listing events
router.get('/list-events', (req, res) => {
  const userSlackId = req.query.slack_id
  listEvents(userSlackId)
  res.status(200).send('Lists 10 upcoming events')
})

// route to test if google calendar successfully authenticated + adding reminder
router.post('/add-reminder', (req, res) => {
  const userSlackId = req.query.slack_id
  const exampleTask = {
    summary: 'Tennis Alumni Event',
    location: '500 College Ave, Swarthmore, PA 19801',
    description: 'A celebration for Mike Mullan\'s 40 years at Swarthmore',
    start: {
      'date': '2018-10-06',
    },
    end: {
      'date': '2018-10-06',
    },
    reminders: {
      'useDefault': true,
    }
  }
  addEvent(userSlackId, exampleTask)
  res.status(200).send('Adds reminder')
})

// route to test if google calendar successfully authenticated + adding meeting
router.post('/add-meeting', (req, res) => {
  const userSlackId = req.query.slack_id
  const exampleMeeting = {
    summary: 'ZenQMS Work Day',
    location: '115 Forrest Ave, Narberth, PA 19072',
    description: 'Just another day in the office~',
    start: {
      dateTime: '2018-09-04T09:00:00',
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: '2018-09-04T17:00:00',
      timeZone: 'America/New_York',
    },
    attendees: [
      {'email': 'james@example.com'},
      {'email': 'slack@example.com'},
    ],
    reminders: {
      useDefault: true,
    },
  }
  addEvent(userSlackId, exampleMeeting)
  res.status(200).send('Adds a meeting')
})

module.exports = router

