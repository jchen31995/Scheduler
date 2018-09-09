const meetingAttachment = [
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

const reminderAttachment = [
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

module.exports = {
  meetingAttachment,
  reminderAttachment,
}
