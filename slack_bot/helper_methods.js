const _ = require('lodash')
const moment = require('moment')
const momentTZ = require('moment-timezone')
const { WebClient } = require('@slack/client')

const Meeting = require('../models/Meeting')
const Task = require('../models/Task')
const { addEvent } = require('../apis/google/calendar_methods')

const API_THROTTLE = 1000
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN

const web = new WebClient(SLACK_BOT_TOKEN)

const capitalizeString = string => {
  return string[0].toUpperCase() + string.slice(1)
}

// need to promisify this to line up async functions in app.js
const confirmMeeting = (payload) => {
  let confirmationMessage
  switch(payload.actions[0].value) {
    case('confirmed'):
      confirmationMessage = { text: 'Meeting Confirmed' }
      break

    case('declined'):
      confirmationMessage = { text: 'Meeting Declined' }
      break
  }
  return confirmationMessage
}

// need to promisify this to line up async functions in app.js
const confirmReminder = (payload) => {
  let confirmationMessage
  switch(payload.actions[0].value) {
    case('confirmed'):
      confirmationMessage = { text: 'Reminder Confirmed' }
      break

    case('declined'):
      confirmationMessage = { text: 'Reminder Declined' }
      break
  }
  return confirmationMessage
}

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

const handleUnexpectedEvent = () => 'This is some unknown event'

const postMessage = _.throttle((conversationId, message) => {
  return web.chat.postMessage({ channel: conversationId, text: message })
  .catch(console.error)
}, API_THROTTLE)

const sendMeetingConfirmation = _.throttle(async (result, message) => {
  const meetingParameters = result.parameters.fields

  const date = meetingParameters.date.stringValue.split('T')[0]
  const startTimeString = date + 'T' + meetingParameters.time.stringValue.split('T')[1]
  const startTime = moment(startTimeString).toDate()
  const timeZone = momentTZ.tz.guess()
  const formattedDate = getFormattedDate(date)

  const defaultDuration = { amount: {numberValue: 30}, unit: {stringValue: 'minutes'} }

  let durationObjWithAdjustedUnit = Object.assign({},meetingParameters.duration.structValue)
  if (meetingParameters.duration.structValue.fields) {
    if(meetingParameters.duration.structValue.fields.unit.stringValue[0]==='m'){
      durationObjWithAdjustedUnit.fields.unit.stringValue = 'minutes'
    } else{
      durationObjWithAdjustedUnit.fields.unit.stringValue = 'hours'
    }
  }


  const durationFields = durationObjWithAdjustedUnit ? durationObjWithAdjustedUnit.fields : defaultDuration
  const momentEndTime = moment(startTime).add(durationFields.amount.numberValue, durationFields.unit.stringValue)
  const endTime = momentEndTime.toDate()
  const formattedDuration = getFormattedDuration(durationFields)

  const invitees = meetingParameters.invitees.listValue.values.map(person => capitalizeString(person.stringValue))
  const inviteesString = invitees.length > 1 ? invitees.join(', ') : invitees[0]

  const subject = capitalizeString(meetingParameters.subject.stringValue)
  const time = meetingParameters.time.stringValue
  const formattedTime = moment(time).format('LT')

  const scheduleConfirmationPrompt = `Scheduling: ${subject} with ${inviteesString} on ${ formattedDate } at ${ formattedTime } for ${ formattedDuration }`

  const meetingRecord = {
    summary: subject,
    start: {dateTime: startTime, timeZone },
    end: {dateTime: endTime, timeZone },
    attendees: invitees,
    google_calendar_id: 'primary',
    status: 'pending',
    requester_id: message.user,
    reminder: { userDefault: true }
  }

  new Meeting(meetingRecord).save()

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
          "value": "confirmed"
        },
        {
          "name": "decline-meeting",
          "text": "No",
          "type": "button",
          "value": "declined"
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

const sendReminderConfirmation = _.throttle(async (result, message) => {
  const reminderParameters = result.parameters.fields

  const subject = capitalizeString(reminderParameters.subject.stringValue)

  const date = reminderParameters.date.stringValue
  const calendarDate = { date: date.split('T')[0] }
  const formattedDate = getFormattedDate(date)

  const scheduleConfirmationPrompt = `Scheduling: ${subject} on ${ formattedDate }`

  const reminderRecord = {
    summary: subject,
    day: calendarDate,
    google_calendar_id: 'primary',
    requester_id: message.user,
  }

  new Task(reminderRecord).save()

  // addEvent(message.user, calendarReminder)

  const attachments = [
    {
      "text": 'Confirm or decline this event',
      "fallback": "I was unable to  add the reminder to your calendar. Please try again.",
      "callback_id": "add_reminder",
      "color": "#3AA3E3",
      "attachment_type": "default",
      "actions": [
        {
          "name": "confirm-reminder",
          "text": "Yes",
          "type": "button",
          "value": "confirmed"
        },
        {
          "name": "decline-reminder",
          "text": "No",
          "type": "button",
          "value": "declined"
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

const updateMessage = _.throttle((attachments, channelId, message, ts) => {
  return web.chat.update({ channel: channelId, text: message, ts, attachments, as_user: true })
  .catch(console.error)
}, API_THROTTLE)

module.exports = {
  confirmMeeting,
  confirmReminder,
  handleUnexpectedEvent,
  sendMeetingConfirmation,
  sendReminderConfirmation,
  getUserInfo,
  postMessage,
  updateMessage
}
