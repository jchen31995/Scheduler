const _ = require('lodash')
const moment = require('moment')
const momentTZ = require('moment-timezone')

const { capitalizeString, getFormattedDate, getFormattedDuration } = require('./message_formatting')
const { meetingAttachment, reminderAttachment } = require('./interactive_messages')
const { postMessage } = require('./web_client_methods')
const Meeting = require('../../models/Meeting')
const Task = require('../../models/Task')

const API_THROTTLE = 1000

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

const handleUnexpectedEvent = () => 'This is some unknown event'

const promptMeeting = _.throttle(async (result, message) => {
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

  // you can massage thie invitees to include slack users
  const invitees = meetingParameters.invitees.listValue.values.map(person => {return {displayName: capitalizeString(person.stringValue), email: 'temp@gmail.com'}})
  const inviteesString = invitees.length > 1 ? invitees.map((person) => person.displayName).join(', ') : invitees[0].displayName

  const subject = `${capitalizeString(meetingParameters.subject.stringValue)} with ${inviteesString}`
  const time = meetingParameters.time.stringValue
  const formattedTime = moment(time).format('LT')

  const scheduleConfirmationPrompt = `Scheduling: ${subject} on ${ formattedDate } at ${ formattedTime } for ${ formattedDuration }`

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

  return postMessage(message.channel, scheduleConfirmationPrompt, meetingAttachment)
  .catch(console.error)
}, API_THROTTLE)

const promptReminder = _.throttle(async (result, message) => {
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

  return postMessage(message.channel, scheduleConfirmationPrompt, reminderAttachment)
  .catch(console.error)
}, API_THROTTLE)


module.exports = {
  confirmMeeting,
  confirmReminder,
  handleUnexpectedEvent,
  promptMeeting,
  promptReminder,
}
