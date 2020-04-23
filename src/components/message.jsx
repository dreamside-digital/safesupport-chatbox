import React from "react"
import PropTypes from "prop-types"
import Linkify from 'linkifyjs/react';

const Message = ({ message, userId, botId, client, placeholder }) => {

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

  if (placeholder) {
    return(
      <div className={`message from-me placeholder`}>
        <div className="text">
          { message.content.body }
        </div>
      </div>
    )
  }


  if (message.content.msgtype === 'm.file') {
    const url = client.mxcUrlToHttp(message.content.url);
    return (
      <div className={`message ${senderClass()}`}>
        <div className="text">
          <a href={url} target='_blank' rel='noopener noreferrer'>{ message.content.body }</a>
        </div>
      </div>
    )
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