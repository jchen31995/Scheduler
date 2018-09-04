const { WebClient } = require('@slack/client')
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN

const web = new WebClient(SLACK_BOT_TOKEN)

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
  .catch((err) => console.log('Error getting user info: ', err))
}

module.exports = { getUserInfo }
