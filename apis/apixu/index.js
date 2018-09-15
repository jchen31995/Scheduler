const axios = require('axios')

const APIXU_KEY = process.env.APIXU_KEY
const weatherURL = 'http://api.apixu.com/v1/forecast.json'
const week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const getForecast = (query) => new Promise((resolve, reject) => {
  const weatherRequest = `${weatherURL}?key=${APIXU_KEY}&q=${query}&days=${5}`

  axios.get(weatherRequest)
  .then((resp) => {
    const { location, current } = resp.data
    const { forecastday } = resp.data.forecast

    const fiveDayForecast = forecastday.map((forecast) => {
      const { date_epoch } = forecast
      const forecastDate = new Date(date_epoch * 1000)
      const month = forecastDate.getMonth()
      const date = forecastDate.getDate()
      const dayOfWeek = week[forecastDate.getDay()]
      const { maxtemp_f, mintemp_f } = forecast.day
      const { text } = forecast.day.condition
      return `\t ${ dayOfWeek } ${ month }/${ date } - ${ maxtemp_f }°F/${ mintemp_f }°F (${ text }) \n`
    })

    const slackMessage =
      `*Here's the weather in ${ location.name }, ${ location.region }.*
      Current Weather:
      \t${ current.temp_f }°F (${ current.condition.text })
      \tSunrise: ${ forecastday[0].astro.sunrise }
      \tSunset: ${ forecastday[0].astro.sunset }

      Five Day Forecast:
      ${ fiveDayForecast.join('\t') }
      `

    resolve(slackMessage)
  })
  .catch((err) => reject(`Sorry, I couldn't find that location. Please try again.`))

})

module.exports = {
  getForecast,
}
