import React from "react"
import PropTypes from "prop-types"

const Message = ({ message, userId }) => {
  const fromMe = message.sender === userId;

  return (
    <div className={`message ${fromMe ? "from-me" : "from-support"}`}>
      <div className="text">{ message.content.body }</div>
    </div>
  )
}

export default Message;