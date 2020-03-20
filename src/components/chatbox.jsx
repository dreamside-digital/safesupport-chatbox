import React from "react"
import PropTypes from "prop-types"
import { Transition } from 'react-transition-group';
import * as util from "util";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { LocalStorage } from "node-localstorage";
import * as olm from "olm"
global.Olm = olm

import * as matrix from "matrix-js-sdk";
import {uuid} from "uuidv4"

import Message from "./message";
import Dock from "./dock";
import Header from "./header";

import './styles.scss';


const ENCRYPTION_CONFIG = { "algorithm": "m.megolm.v1.aes-sha2" };
const ENCRYPTION_NOTICE = "Messages in this chat are secured with end-to-end encryption."
const UNENCRYPTION_NOTICE = "End-to-end message encryption is not available on this browser."
const RESTARTING_UNENCRYPTED_CHAT_MESSAGE = "Restarting chat without encryption."

const DEFAULT_MATRIX_SERVER = "https://matrix.rhok.space/"
const DEFAULT_BOT_USERNAME = "@help-bot:rhok.space"
const DEFAULT_TERMS_URL = "https://tosdr.org/"
const DEFAULT_ROOM_NAME = "Support Chat"
const DEFAULT_INTRO_MESSAGE = "This chat application does not collect any of your personal data or any data from your use of this service."
const DEFAULT_AGREEMENT_MESSAGE = "Do you want to continue?"
const DEFAULT_CONFIRMATION_MESSAGE = "Waiting for a facilitator to join the chat..."
const DEFAULT_EXIT_MESSAGE = "The chat is closed. You may close this window."
const DEFAULT_ANONYMOUS_DISPLAY_NAME="Anonymous"
const DEFAULT_CHAT_UNAVAILABLE_MESSAGE = "The chat service is not available right now. Please try again later."


class ChatBox extends React.Component {
  constructor(props) {
    super(props)
    this.initialState = {
      opened: false,
      showDock: true,
      client: null,
      ready: true,
      accessToken: null,
      userId: null,
      password: null,
      localStorage: null,
      messages: [],
      inputValue: "",
      errors: [],
      roomId: null,
      typingStatus: null,
      awaitingAgreement: true,
    }
    this.state = this.initialState
    this.chatboxInput = React.createRef();
    this.messageWindow = React.createRef();
    this.termsUrl = React.createRef();
  }

  handleToggleOpen = () => {
    this.setState((prev) => {
      let { showDock } = prev;
      if (!prev.opened) {
        showDock = false;
      }
      return {
        showDock,
        opened: !prev.opened,
      };
    });
  }

  handleWidgetExit = () => {
    this.setState({
      showDock: true,
    });
  }

  handleWidgetEnter = () => {
    if (this.state.awaitingAgreement) {
      this.termsUrl.current.focus()
    } else {
      this.chatboxInput.current.focus()
    }
  }

  handleExitChat = () => {
    if (this.state.client) {
      this.exitChat()
    } else {
      this.setState(this.initialState)
    }
  }

  exitChat = () => {
    if (!this.state.client) return null;
    return this.state.client.leave(this.state.roomId)
      .then(() => {
        const auth = {
          type: 'm.login.password',
          user: this.state.userId,
          identifier: {
              type: "m.id.user",
              user: this.state.userId,
          },
          password: this.state.password,
        };
        this.state.client.deactivateAccount(auth, true)
      })
      .then(() => this.state.client.stopClient())
      .then(() => this.state.client.clearStores())
      .then(() => {
        this.state.localStorage.clear()
        this.setState(this.initialState)
      })
  }

  initializeChat = () => {
    this.setState({ ready: false })
    let client;

    try {
      client = matrix.createClient(this.props.matrixServerUrl)
    } catch(error) {
      console.log("Error creating client", error)
      return this.handleInitError()
    }

    // empty registration request to get session
    return client.registerRequest({})
      .then(data => {
        console.log("Empty registration request to get session", data)
      })
      .catch(err => {
      // actual registration request with randomly generated username and password
        const username = uuid()
        const password = uuid()
        const sessionId = err.data.session
        client.registerRequest({
          auth: {session: sessionId, type: "m.login.dummy"},
          inhibit_login: false,
          password: password,
          username: username,
          x_show_msisdn: true,
        })
        .then(data => {

          // use node localStorage if window.localStorage is not available
          let localStorage = global.localStorage;
          if (typeof localStorage === "undefined" || localStorage === null) {
            const deviceDesc = `matrix-chat-${data.device_id}-${sessionId}`
            const localStoragePath = path.resolve(path.join(os.homedir(), ".local-storage", deviceDesc))
            localStorage = new LocalStorage(localStoragePath);
          }

          this.setState({
            accessToken: data.access_token,
            userId: data.user_id,
            username: username,
            password: password,
            localStorage: localStorage,
            sessionId: sessionId,
            deviceId: data.device_id,
          })

          // create new client with full options
          let opts = {
            baseUrl: this.props.matrixServerUrl,
            accessToken: data.access_token,
            userId: data.user_id,
            deviceId: data.device_id,
            sessionStore: new matrix.WebStorageSessionStore(localStorage),
          }

          client = matrix.createClient(opts)
        })
        .catch(err => {
          this.handleInitError()
        })
        .then(() => client.initCrypto())
        .catch(err => this.initializeUnencryptedChat())
        .then(() => client.setDisplayName(this.props.anonymousDisplayName))
        .then(() => client.startClient())
        .then(() => {
          this.setState({
            client: client
          })
        })
        .catch(err => this.handleInitError())
    })
  }

  initializeUnencryptedChat = () => {
    this.setState({ ready: false })

    let opts = {
      baseUrl: this.props.matrixServerUrl,
      accessToken: this.state.accessToken,
      userId: this.state.userId,
      deviceId: this.state.deviceId,
    }

    let client;
    try {
      client = matrix.createClient(opts)
      client.setDisplayName(this.props.anonymousDisplayName)
    } catch {
      return this.handleInitError()
    }
    return client.startClient()
      .then(() => {
        this.setState({
          client: client,
          isCryptoEnabled: false,
        })
      })
      .catch(err => this.handleInitError())
  }

  handleInitError = () => {
    this.displayBotMessage({ body: this.props.chatUnavailableMessage })
    this.setState({ ready: true })
  }

  handleDecryptionError = () => {
    this.displayBotMessage({ body: RESTARTING_UNENCRYPTED_CHAT_MESSAGE })

    this.state.client.leave(this.state.roomId)
      .then(() => this.state.client.stopClient())
      .then(() => this.state.client.clearStores())
      .then(() => this.initializeUnencryptedChat())
  }

  verifyAllRoomDevices = async function(roomId) {
    let room = this.state.client.getRoom(roomId);
    let members = (await room.getEncryptionTargetMembers()).map(x => x["userId"])
    let memberkeys = await this.state.client.downloadKeys(members);
    for (const userId in memberkeys) {
      for (const deviceId in memberkeys[userId]) {
        await this.state.client.setDeviceVerified(userId, deviceId);
      }
    }
  }

  createRoom = async function() {
    const currentDate = new Date()
    const chatDate = currentDate.toLocaleDateString()
    const chatTime = currentDate.toLocaleTimeString()
    let roomConfig = {
      room_alias_name: `private-support-chat-${uuid()}`,
      invite: [this.props.botUsername],
      visibility: 'private',
      name: `${chatTime}, ${chatDate} - ${this.props.roomName}`,
    }

    const isCryptoEnabled = await this.state.client.isCryptoEnabled()

    if (isCryptoEnabled) {
      roomConfig.initial_state = [
        {
          type: 'm.room.encryption',
          state_key: '',
          content: ENCRYPTION_CONFIG,
        },
      ]
    }

    const { room_id } = await this.state.client.createRoom(roomConfig)

    this.state.client.setPowerLevel(room_id, this.props.botUsername, 100)

    if (isCryptoEnabled) {
      this.verifyAllRoomDevices(room_id)
    } else {
      this.displayBotMessage({ body: UNENCRYPTION_NOTICE })
    }

    this.displayBotMessage({ body: this.props.confirmationMessage })

    this.setState({
      roomId: room_id,
      isCryptoEnabled
    })
  }

  sendMessage = (message) => {
    this.state.client.sendTextMessage(this.state.roomId, message)
      .catch((err) => {
        switch (err["name"]) {
          case "UnknownDeviceError":
            Object.keys(err.devices).forEach((userId) => {
              Object.keys(err.devices[userId]).map((deviceId) => {
                  this.state.client.setDeviceKnown(userId, deviceId, true);
              });
            });
            this.sendMessage(message)
            break;
          default:
            this.displayBotMessage({ body: "Your message was not sent." })
            console.log("Error sending message", err);
        }
      })
  }

  displayFakeMessage = (content, sender) => {
    const msgList = [...this.state.messages]
    const msg = {
      id: uuid(),
      type: 'm.room.message',
      sender: sender,
      roomId: this.state.roomId,
      content: content,
    }
    msgList.push(msg)

    this.setState({ messages: msgList })
  }

  displayBotMessage = (content, roomId) => {
    const msgList = [...this.state.messages]
    const msg = {
      id: uuid(),
      type: 'm.room.message',
      sender: this.props.botUsername,
      roomId: roomId || this.state.roomId,
      content: content,
    }
    msgList.push(msg)

    this.setState({ messages: msgList })
  }

  handleMessageEvent = event => {
    const message = {
      id: event.getId(),
      type: event.getType(),
      sender: event.getSender(),
      roomId: event.getRoomId(),
      content: event.getContent(),
    }

    if (message.content.showToUser && message.content.showToUser !== this.state.userId) {
      return;
    }

    if (message.content.body.startsWith('!bot') && message.sender !== this.state.userId) {
      return;
    }

    const messages = [...this.state.messages]
    messages.push(message)
    this.setState({ messages })
  }


  handleEscape = (e) => {
    if (e.keyCode === 27 && this.state.opened) {
      this.handleToggleOpen()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.client && prevState.client !== this.state.client) {
      this.createRoom()

      this.state.client.once('sync', (state, prevState, res) => {
        if (state === "PREPARED") {
          this.setState({ ready: true })
        }
      });

      this.state.client.on("Room.timeline", (event, room, toStartOfTimeline) => {
        if (event.getType() === "m.room.encryption") {
          this.displayBotMessage({ body: ENCRYPTION_NOTICE }, room.room_id)
        }

        if (event.getType() === "m.room.message" && !this.state.isCryptoEnabled) {
          if (event.isEncrypted()) {
            return;
          }
          this.handleMessageEvent(event)
        }
      });

      this.state.client.on("Event.decrypted", (event, err) => {
        if (err) {
          return this.handleDecryptionError()
        }
        if (event.getType() === "m.room.message") {
          this.handleMessageEvent(event)
        }
      });

      this.state.client.on("RoomMember.typing", (event, member) => {
        if (member.typing && event.getRoomId() === this.state.roomId) {
          this.setState({ typingStatus: `${member.name} is typing...`})
        }
        else {
          this.setState({ typingStatus: null })
        }
      });
    }

    if (prevState.messages.length !== this.state.messages.length) {
      if (this.messageWindow.current.scrollTo) {
        this.messageWindow.current.scrollTo(0, this.messageWindow.current.scrollHeight)
      }
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.handleEscape, false);
    window.addEventListener('beforeunload', this.exitChat)
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleEscape, false);
    window.removeEventListener('beforeunload', this.exitChat)
    this.exitChat();
  }

  handleInputChange = e => {
    this.setState({ inputValue: e.target.value })
  }

  handleAcceptTerms = () => {
    this.setState({ awaitingAgreement: false })
    this.initializeChat()
  }

  handleRejectTerms = () => {
    this.exitChat()
    this.displayBotMessage({ body: this.props.exitMessage })
  }

  handleSubmit = e => {
    e.preventDefault()
    const message = this.state.inputValue
    if (!Boolean(message)) return null;

    if (this.state.client && this.state.roomId) {
      this.setState({ inputValue: "" })
      this.chatboxInput.current.focus()
      return this.sendMessage(message)
    }
  }

  render() {
    const { ready, messages, inputValue, userId, roomId, typingStatus, opened, showDock } = this.state;
    const inputLabel = 'Send a message...'

    return (
      <div className="docked-widget" role="complementary">
        <Transition in={opened} timeout={250} onExited={this.handleWidgetExit} onEntered={this.handleWidgetEnter}>
          {(status) => {
            return (
            <div className={`widget widget-${status}`} aria-hidden={!opened}>
              <div id="ocrcc-chatbox" aria-haspopup="dialog">
                <Header handleToggleOpen={this.handleToggleOpen} opened={opened} handleExitChat={this.handleExitChat} />

                <div className="message-window" ref={this.messageWindow}>
                  <div className="messages">
                    <div className={`message from-bot`}>
                      <div className="text">{ this.props.introMessage }</div>
                    </div>

                    <div className={`message from-bot`}>
                      <div className="text">Please read the full <a href={this.props.termsUrl} ref={this.termsUrl} target='_blank' rel='noopener noreferrer'>terms and conditions</a>. By using this chat, you agree to these terms.</div>
                    </div>

                    <div className={`message from-bot`}>
                      <div className="text">{ this.props.agreementMessage }</div>
                    </div>

                    <div className={`message from-bot`}>
                      <div className="text buttons">
                        {`👉`}
                        <button className="btn" id="accept" onClick={this.handleAcceptTerms}>YES</button>
                        <button className="btn" id="reject" onClick={this.handleRejectTerms}>NO</button>
                      </div>
                    </div>

                    {
                      messages.map((message, index) => {
                        return(
                          <Message key={message.id} message={message} userId={userId} botId={this.props.botUsername} client={this.state.client} />
                        )
                      })
                    }
                    { typingStatus &&
                      <div className="notices">
                        <div role="status">{typingStatus}</div>
                      </div>
                    }
                    { !ready && <div className={`loader`}>loading...</div> }
                  </div>
                </div>
                <div className="input-window">
                  <form onSubmit={this.handleSubmit}>
                    <input
                      id="message-input"
                      type="text"
                      onChange={this.handleInputChange}
                      value={inputValue}
                      aria-label={inputLabel}
                      placeholder={inputLabel}
                      autoFocus={true}
                      ref={this.chatboxInput}
                    />
                    <input type="submit" value="Send" id="submit" />
                  </form>
                </div>
              </div>
            </div>
            )}
          }
        </Transition>
        {showDock && !roomId && <Dock handleToggleOpen={this.handleToggleOpen} />}
        {showDock && roomId && <Header handleToggleOpen={this.handleToggleOpen} opened={opened} handleExitChat={this.handleExitChat} />}
      </div>
    );
  }
};

ChatBox.propTypes = {
  matrixServerUrl: PropTypes.string.isRequired,
  botUsername: PropTypes.string.isRequired,
  termsUrl: PropTypes.string.isRequired,
  introMessage: PropTypes.string.isRequired,
  roomName: PropTypes.string,
  agreementMessage: PropTypes.string,
  confirmationMessage: PropTypes.string,
  exitMessage: PropTypes.string,
  chatUnavailableMessage: PropTypes.string,
  anonymousDisplayName: PropTypes.string,
}

ChatBox.defaultProps = {
  matrixServerUrl: DEFAULT_MATRIX_SERVER,
  botUsername: DEFAULT_BOT_USERNAME,
  termsUrl: DEFAULT_TERMS_URL,
  roomName: DEFAULT_ROOM_NAME,
  introMessage: DEFAULT_INTRO_MESSAGE,
  agreementMessage: DEFAULT_AGREEMENT_MESSAGE,
  confirmationMessage: DEFAULT_CONFIRMATION_MESSAGE,
  exitMessage: DEFAULT_EXIT_MESSAGE,
  anonymousDisplayName: DEFAULT_ANONYMOUS_DISPLAY_NAME,
  chatUnavailableMessage: DEFAULT_CHAT_UNAVAILABLE_MESSAGE,
}

export default ChatBox;

