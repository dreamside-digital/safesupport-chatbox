import React from "react"
import PropTypes from "prop-types"
import Linkify from 'linkifyjs/react';

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

  const linkifyOpts = {
    linkAttributes: {
      rel: 'noreferrer noopener',
    },
  }

  return (
    <div className={`message ${senderClass()}`}>
      <div className="text">
        <Linkify options={linkifyOpts}>{ message.content.body }</Linkify>
      </div>
    </div>
  )
}

export default Message;