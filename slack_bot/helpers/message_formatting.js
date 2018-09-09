const moment = require('moment')

const capitalizeString = string => string[0].toUpperCase() + string.slice(1)

const getFormattedDate = (date) => {
  const dayOfWeek = moment(date).format('dddd')
  const formattedDate = moment(date).format('LL')

  return `${ dayOfWeek }, ${ formattedDate }`
}

const getFormattedDuration = (durationFields) => {
  const durationUnit = durationFields.unit.stringValue
  const durationAmount = durationFields.amount.numberValue
  const duration = durationUnit === 'hours' ?   durationAmount * 60 : durationAmount

  let formattedDuration, hours, minutes
  if (duration >=60) {
    hours = Math.floor(duration / 60)
    minutes = duration - (hours * 60)
  }

  if (hours > 0) {
    if (minutes) {
      formattedDuration = `${ hours } hr ${ minutes } min`
    } else {
      formattedDuration = `${ hours } hr`
    }
  } else {
    formattedDuration = `${ duration } min`
  }

  return formattedDuration
}

module.exports = {
  capitalizeString,
  getFormattedDate,
  getFormattedDuration
}
