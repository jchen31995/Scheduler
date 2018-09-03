require('dotenv-safe').config()
const bodyParser = require('body-parser')
const express = require('express')
const googleAPI = require('./google_api/routes')

require('./slack_bot')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(googleAPI)

app.get('/', (req, res) => {
  res.send('Hello hello!')
})

app.listen(process.env.PORT || 3000, function () {
  console.log('Server listening on port 3000')
})
