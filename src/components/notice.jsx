import React from "react"
import PropTypes from "prop-types"

const Notice = ({ message, userId }) => {
  const fromMe = message.sender === userId;

  if (message.content.formatted_body) {
    return (
      <div className={`message ${fromMe ? "from-me" : "from-support"}`}>
        <div className="text" dangerouslySetInnerHTML={{__html: message.content.formatted_body}} />
      </div>
    )
  }

  return (
    <div className={`message ${fromMe ? "from-me" : "from-support"}`}>
      <div className="text">{ message.content.body }</div>
    </div>
  )
}

export default Notice;