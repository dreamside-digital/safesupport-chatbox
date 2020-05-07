import React from "react"
import PropTypes from "prop-types"

const Header = ({ handleToggleOpen, handleExitChat, opened }) => {

  return(
    <div className="widget-header">
      <button
        type="button"
        className={`widget-header-minimize`}
        onClick={handleToggleOpen}
        onKeyPress={handleToggleOpen}
        aria-label="Minimize the chat window"
        title="Minimize the chat window"
      >
        <span className={`btn-icon arrow ${opened ? "opened" : "closed"}`}>⌃</span>
        <span>{`${opened ? "Hide" : "Show"} the chat`}</span>
      </button>
      <button
        type="button"
        className={`widget-header-close`}
        onClick={handleExitChat}
        onKeyPress={handleExitChat}
        aria-label="Exit the chat"
        title="Exit the chat"
      >
        <span className={`btn-icon`}>×</span>
      </button>
    </div>
  )
}

export default Header;