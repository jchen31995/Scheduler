const bodyParser = require('body-parser')
require('dotenv-safe').config()
const express = require('express')
const mongoose = require('mongoose')

const googleAPI = require('./google_api/routes')
require('./slack_bot')

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true })

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(googleAPI)

app.get('/', (req, res) => {
  res.send('Hello hello!')
})

app.post('/bot/events', (req,res) => {
  console.log("An event has been detected: ", req.body)
  res.sendStatus(200)
})

app.listen(process.env.PORT || 3000, function () {
  console.log('Server listening on port 3000')
})
