import React from "react"
import PropTypes from "prop-types"

const Dock = ({ handleToggleOpen }) => {

  return(
    <button
      type="button"
      className="dock"
      onClick={handleToggleOpen}
      onKeyPress={handleToggleOpen}
      aria-labelledby="open-chatbox-label"
    >
      <div id="open-chatbox-label">Start a new chat</div>
      <div className="label-icon">
        <div className={`btn-icon`} aria-label={`Open support chat window`}>+</div>
      </div>
    </button>
  )
}

export default Dock;