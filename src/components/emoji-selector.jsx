import React from "react"
import PropTypes from "prop-types"
import { Transition } from 'react-transition-group';
import EmojiPicker from 'emoji-picker-react';
import onClickOutside from "react-onclickoutside";


const SVG = () => <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path id="icon" fill="#828282" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>

class EmojiSelector extends React.Component {
  constructor(props){
    super(props)
  }

  handleClickOutside = e => {
    this.props.closeEmojiSelector()
  };


  render() {
    const { onEmojiClick, emojiSelectorOpen, toggleEmojiSelector } = this.props;

    return(
      <div className="emoji-button-container">
        <div className="pos-relative">
          <Transition in={emojiSelectorOpen} timeout={250}>
            {
              status => {
                return(
                  <div className={`emoji-picker emoji-picker-${status}`} aria-hidden={!emojiSelectorOpen}>
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      emojiUrl="https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64"
                    />
                  </div>
                )
              }
            }
          </Transition>
          <button type="button" id="emoji-button" onClick={toggleEmojiSelector} aria-label="Emoji picker">
            <SVG />
          </button>
        </div>
      </div>
    )
  }
}

export default onClickOutside(EmojiSelector)

