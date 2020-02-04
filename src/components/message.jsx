import React from "react"
import PropTypes from "prop-types"

const Message = ({ message, user_id }) => {
  const fromMe = message.sender === user_id;

  return (
    <div className={`message ${fromMe ? "from-me" : "from-support"}`}>
      <div className="text">{ message.content.body }</div>
    </div>
  )
}

export default Message;