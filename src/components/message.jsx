import React from "react"
import PropTypes from "prop-types"
import Linkify from 'linkifyjs/react';
import decryptFile from '../utils/decryptFile'


class Message extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      decryptedUrl: null,
      decryptedFile: null,
    }
  }

  componentDidMount() {
    const needsDecryption = ['m.file', 'm.image'];
    if (needsDecryption.includes(this.props.message.content.msgtype)) {
      decryptFile(this.props.message.content.file, this.props.client)
        .then((decryptedBlob) => {
          const decryptedUrl = URL.createObjectURL(decryptedBlob)
          this.setState({
            decryptedUrl: decryptedUrl,
            decryptedBlob: decryptedBlob
          })

        })
    }
  }

  componentWillUnmount() {
    if (this.state.decryptedUrl) {
      URL.revokeObjectURL(this.state.decryptedUrl);
    }
  }

  senderClass = () => {
    switch (this.props.message.sender) {
      case 'from-me':
        return 'from-me'
      case this.props.userId:
        return 'from-me'
      case this.props.botId:
        return 'from-bot'
      default:
        return 'from-support'
    }
  }

  renderTextMessage = () => {
    const linkifyOpts = {
      linkAttributes: {
        rel: 'noreferrer noopener',
      },
    }

    return (
      <div className={`message ${this.senderClass()}`}>
        <div className="text">
          <Linkify options={linkifyOpts}>{ this.props.message.content.body }</Linkify>
        </div>
      </div>
    )
  }

  renderHtmlMessage = () => {
    return (
      <div className={`message ${this.senderClass()}`}>
        <div className="text" dangerouslySetInnerHTML={{__html: this.props.message.content.formatted_body}} />
      </div>
    )
  }

  renderImageMessage = () => {
    return (
      <div className={`message ${this.senderClass()}`}>
        <div className="text">
          <a href={this.state.decryptedUrl} target='_blank' rel='noopener noreferrer'>{ this.props.message.content.body }</a>
        </div>
      </div>
    )
  }

  renderFileMessage = () => {
    return (
      <div className={`message ${this.senderClass()}`}>
        <div className="text">
          <a href={this.state.decryptedUrl} target='_blank' rel='noopener noreferrer'>{ this.props.message.content.body }</a>
        </div>
      </div>
    )
  }

  render() {
    console.log(this.props.message)
    console.log(this.state)
    const { message } = this.props;

    switch(message.content.msgtype) {
      case 'm.file':
      return this.renderFileMessage()
      case 'm.image':
      return this.renderImageMessage()
      default:
      if (message.content.formatted_body) {
        return this.renderHtmlMessage()
      }
      return this.renderTextMessage()
    }
  }
}

export default Message;