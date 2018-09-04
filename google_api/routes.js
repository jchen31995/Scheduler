const express = require('express')
const { getAuthClient, getAuthToken, getAuthURL, listEvents } = require('./helper_methods')

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

// route to test if google calendar successfully authenticated + working
router.get('/list-events', (req, res) => {
  const userSlackId = req.query.slack_id
  listEvents(userSlackId)
  res.status(200).send('Lists 10 upcoming events')
})

module.exports = router

