const _ = require('lodash')
const moment = require('moment')
const momentTZ = require('moment-timezone')

const { meetingAttachment, reminderAttachment } = require('./interactive_messages')
const { capitalizeString, getFormattedDate, getFormattedDuration } = require('./message_formatting')
const Meeting = require('../../models/Meeting')
const Task = require('../../models/Task')
const { getUserInfo, postMessage } = require('./web_client_methods')
const { getForecast } = require('../../apis/apixu')

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

const displayWeather = _.throttle((result, message) => {
  const location = result.parameters.fields.query.stringValue

  return getForecast(location)
  .then((resp) => postMessage(message.channel, resp))
  .catch(err => postMessage(message.channel, err))
}, API_THROTTLE)

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

  if (Object.keys(durationObjWithAdjustedUnit).length!==0) {
    durationObjWithAdjustedUnit = durationObjWithAdjustedUnit.fields
    if(meetingParameters.duration.structValue.fields.unit.stringValue[0]==='m'){
      durationObjWithAdjustedUnit.unit.stringValue = 'minutes'
    } else {
      durationObjWithAdjustedUnit.unit.stringValue = 'hours'
    }
  } else {
    durationObjWithAdjustedUnit = defaultDuration
  }
  const durationFields = durationObjWithAdjustedUnit || defaultDuration

  const momentEndTime = moment(startTime).add(durationFields.amount.numberValue, durationFields.unit.stringValue)
  const endTime = momentEndTime.toDate()
  const formattedDuration = getFormattedDuration(durationFields)


  // handling invitees with the current DialogFlow model
  let invitees = []
  const allInvitees = meetingParameters.invitees.listValue.values
  for (let i = 0; i < allInvitees.length; i++ ) {
    const currentUser = allInvitees[i].stringValue.trim()

    if (currentUser === 'and') {
      continue
    }

    if (currentUser === '<@' && allInvitees[i+1]) {
      let unformattedSlackId = allInvitees[i+1].stringValue.trim()
      allInvitees[i+1].stringValue = '<@' + unformattedSlackId
      continue
    }

    if (currentUser[0]==='<') {
      const slackId = currentUser[currentUser.length-1] === '>' ? currentUser.slice(2,currentUser.length-1) : currentUser.slice(2,currentUser.length)
      const userInfo = await getUserInfo(slackId)
      if (!userInfo) {
        return postMessage(message.channel,`Hm... Sorry. I couldn't seem to process this request. Please try again. `)
      }

      const { name, email } = userInfo
      invitees.push({ displayName: capitalizeString(name), email })
    } else {
      invitees.push({ displayName: capitalizeString(currentUser) })
    }
  }

  const inviteesString = invitees.length > 1 ? invitees.map((person) => person.displayName).join(', ') : invitees[0].displayName

  invitees = invitees.filter((person) => person.email)

  const tempSubject = meetingParameters.subject.stringValue ? capitalizeString(meetingParameters.subject.stringValue) : 'Meeting'
  const subject = `${tempSubject !== 'A meeting'? tempSubject : 'Meeting'} with ${inviteesString}`
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

const promptReminder = _.throttle((result, message) => {
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
  displayWeather,
  handleUnexpectedEvent,
  promptMeeting,
  promptReminder,
}
