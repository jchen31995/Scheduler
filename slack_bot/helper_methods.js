const _ = require('lodash')
const moment = require('moment')
const { WebClient } = require('@slack/client')

const { detectIntent } = require('../apis/dialogflow')

const API_THROTTLE = 1000
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN

const web = new WebClient(SLACK_BOT_TOKEN)

const capitalizeString = string => {
  return string[0].toUpperCase() + string.slice(1)
}

const confirmMeeting = _.throttle(async (message) => {
  const result = await detectIntent(message)

  const meetingParameters = result.parameters.fields

  const date = meetingParameters.date.stringValue
  const formattedDate = getFormattedDate(date)

  const durationFields = meetingParameters.duration.structValue.fields
  const formattedDuration = getFormattedDuration(durationFields)

  const invitees = meetingParameters.invitees.listValue.values.map(person => capitalizeString(person.stringValue))
  const inviteesString = invitees.length > 1 ? invitees.join(', ') : invitees[0]

  const subject = capitalizeString(meetingParameters.subject.stringValue)
  const time = meetingParameters.time.stringValue
  const formattedTime = moment(time).format('LT')

  const scheduleConfirmationPrompt = `Scheduling: ${subject} with ${inviteesString} on ${ formattedDate } at ${ formattedTime } for ${ formattedDuration }`

  const attachments = [
    {
      "text": 'Confirm or decline this meeting',
      "fallback": "I was unable to  add the meeting to your calendar. Please try again.",
      "callback_id": "add_meeting",
      "color": "#3AA3E3",
      "attachment_type": "default",
      "actions": [
        {
          "name": "confirm-meeting",
          "text": "Yes",
          "type": "button",
          "value": true
        },
        {
          "name": "decline-meeting",
          "text": "No",
          "type": "button",
          "value": false
        },
      ]
    }
  ]

  const response = {
    channel: message.channel,
    text: scheduleConfirmationPrompt,
    attachments
  }

  return web.chat.postMessage(response)
  .catch(console.error)
}, API_THROTTLE)

const confirmReminder = _.throttle(async (message) => {
  const result = await detectIntent(message)

  const reminderParameters = result.parameters.fields
  const subject = capitalizeString(reminderParameters.subject.stringValue)

  const date = reminderParameters.date.stringValue
  const formattedDate = getFormattedDate(date)

  const scheduleConfirmationPrompt = `Scheduling: ${subject} on ${ formattedDate }`

  const attachments = [
    {
      "text": 'Confirm or decline this event',
      "fallback": "I was unable to  add the reminder to your calendar. Please try again.",
      "callback_id": "add_meeting",
      "color": "#3AA3E3",
      "attachment_type": "default",
      "actions": [
        {
          "name": "confirm-reminder",
          "text": "Yes",
          "type": "button",
          "value": true
        },
        {
          "name": "decline-reminder",
          "text": "No",
          "type": "button",
          "value": false
        },
      ]
    }
  ]

  const response = {
    channel: message.channel,
    text: scheduleConfirmationPrompt,
    attachments
  }

  return web.chat.postMessage(response)
  .catch(console.error)
}, API_THROTTLE)

const getFormattedDate = (date) => {
  const dayOfWeek = moment(date).format('dddd')
  const formattedDate = moment(date).format('LL')

  return `${ dayOfWeek }, ${ formattedDate }`
}

const getFormattedDuration = (durationFields) => {
  const durationUnit = durationFields.unit.stringValue
  const durationAmount = durationFields.amount.numberValue
  const duration = durationUnit === 'h' ?   durationAmount * 60 : durationAmount

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

const getUserInfo = (user) => {
  return web.users.info({ user })
  .then((resp) => {
    const { id, name } = resp.user
    const { email } = resp.user.profile
    return {
      slack_id: id,
      slack_username: name,
      slack_email: email,
    }
  })
  .catch(console.error)
}

const postMessage = (conversationId, message) => {
  return web.chat.postMessage({ channel: conversationId, message })
  .catch(console.error)
}


module.exports = {
  confirmMeeting,
  confirmReminder,
  getUserInfo,
  postMessage
}
