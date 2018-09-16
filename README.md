# Slack Scheduler Bot (v2)
A re-implementation of the conversational Slack bot I made last summer that helps users schedule meetings/reminders and seamlessly inserts the event into Google Calendar. It can also help you check the weather because why not?

For the curious, here's the [previous implementation](https://github.com/jchen31995/slack-scheduler-bot-v1)

# APIs and Technologies Used
- Apixu retrieved current and forecasted weather conditions
- DialogFlow trained the bot to recognize Slack members, dates, times, and locations. Furthermore, it was used to parse the user messages to it to create a natural conversation flow between the user and the bot.
- Google Calendar API authenticated users and granted access to personal Google calendars
- MongoDB stored user information and pending calendar events
- Ngrok created a secure URL for Slack to post requests to
- NodeJS/ExpressJS backend handled the OAuth flow and coordinated asynchronous APIs

# Demo
**Schedule a meeting** </br>
(with non-Slack users)


(with Slack users)


**Schedule a reminder**


# Next Steps
- Improve DialogFlow model to better parse requests
- Have bot be able to respond on mention instead of just direct messaging
- Deploy to Heroku instead of local deployment
- Continue making the bot more robust

# Questions or Suggestions?
Feel free to drop a line to my inbox about any suggestions or questions you may have about this project!
