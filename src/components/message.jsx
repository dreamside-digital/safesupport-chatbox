import React from "react"
import PropTypes from "prop-types"

const Message = ({ message, userId, botId }) => {

  const senderClass = () => {
    switch (message.sender) {
      case 'from-me':
        return 'from-me'
      case userId:
        return 'from-me'
      case botId:
        return 'from-bot'
      default:
        return 'from-support'
    }
  }

  if (message.content.formatted_body) {
    return (
      <div className={`message ${senderClass()}`}>
        <div className="text" dangerouslySetInnerHTML={{__html: message.content.formatted_body}} />
      </div>
    )
  }

  return (
    <div className={`message ${senderClass()}`}>
      <div className="text">{ message.content.body }</div>
    </div>
  )
}

export default Message;