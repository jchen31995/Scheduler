const express = require('express')
const { getAuthToken, listEvents } = require('./helper_methods')

const router = express.Router()


// google authentication happens here
router.get('/oauthcallback', async (req, res) => {
  getAuthToken(req.query.code, req.query.state).then((resp) => {
    res.send('Successfully authenticated user. Head back over to slack!')
  }).catch(err => console.log("getting some error: ", err))
})

// route to test if google calendar successfully authenticated + working
router.get('/list-events', (req, res) => {
  const userSlackId = req.query.slack_id
  listEvents(userSlackId)
  res.status(200).send('Lists 10 upcoming events')
})

module.exports = router

