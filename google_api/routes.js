const express = require('express')
const { getAuthToken, listEvents } = require('./helper_methods')

const router = express.Router()


// Request sends back object with access_token and refresh_token
// Save this somewhere
router.get('/oauthcallback', async (req, res) => {
  getAuthToken(req.query.code).then((resp) => {
    res.send('Successfully authenticated user')
  }).catch(err => console.log("sgetting some error: ", err))
})

router.get('/list-events', (req, res) => {
  listEvents()
  res.send('successfully authenticated and listed calendar')
})

module.exports = router

