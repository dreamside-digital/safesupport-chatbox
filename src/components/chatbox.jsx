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


const DEFAULT_MATRIX_SERVER = "https://matrix.rhok.space"
const DEFAULT_ROOM_NAME = "Support Chat"
const BOT_USERNAME = "@help-bot:rhok.space"
const ENCRYPTION_CONFIG = { "algorithm": "m.megolm.v1.aes-sha2" };
const ENCRYPTION_NOTICE = "Messages in this chat are secured with end-to-end encryption."
const UNENCRYPTION_NOTICE = "End-to-end message encryption is not available on this browser."
const INTRO_MESSAGE = "This chat application does not collect any of your personal data or any data from your use of this service."
const AGREEMENT_MESSAGE = "👉 Do you want to continue? Type yes or no."
const CONFIRMATION_MESSAGE = "Waiting for a facilitator to join the chat..."
const RESTARTING_UNENCRYPTED_CHAT_MESSAGE = "Restarting chat without encryption."
const EXIT_MESSAGE = "The chat was not started."
const FACILITATOR_ROOM_ID = '!pYVVPyFKacZeKZbWyz:rhok.space'
const TERMS_URL="https://tosdr.org/"
const SUPPORT_SEEKER_DISPLAY_NAME="Anonymous"
const MATRIX_ERROR_MESSAGE = "There was an error in the messaging service. Please try again later."


const initialState = {
  opened: false,
  showDock: true,
  client: null,
  ready: true,
  accessToken: null,
  userId: null,
  password: null,
  localStorage: null,
  messages: [
    {
      id: 'intro-msg-id',
      type: 'm.room.message',
      sender: BOT_USERNAME,
      content: { body: INTRO_MESSAGE },
    },
    {
      id: 'terms-msg-id',
      type: 'm.room.message',
      sender: BOT_USERNAME,
      content: {
        body: `Please read the full terms and conditions at ${TERMS_URL}.`,
        formatted_body: `Please read the full <a href="${TERMS_URL}">terms and conditions</a>.`
      }
    },
    {
      id: 'agreement-msg-id',
      type: 'm.room.message',
      sender: BOT_USERNAME,
      content: { body: AGREEMENT_MESSAGE }, },
  ],
  inputValue: "",
  errors: [],
  roomId: null,
  typingStatus: null,
  awaitingAgreement: true,
  awaitingFacilitator: false,
}

class ChatBox extends React.Component {
  constructor(props) {
    super(props)
    const client = matrix.createClient(this.props.matrixServerUrl)
    this.state = initialState
    this.chatboxInput = React.createRef();
    this.messageWindow = React.createRef();
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
    this.chatboxInput.current.focus()
  }

  handleExitChat = () => {
    if (this.state.client) {
      this.exitChat()
    } else {
      this.setState(initialState)
    }
  }

  exitChat = () => {
    if (!this.state.client) return null;
    return this.state.client.leave(this.state.roomId)
      .then(() => {
        const auth = {
          type: 'm.login.password',
          // TODO: Remove `user` once servers support proper UIA
          // See https://github.com/vector-im/riot-web/issues/10312
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
        this.setState(initialState)
      })
  }

  initializeChat = () => {
    // empty registration request to get session
    this.setState({ ready: false })
    let client = matrix.createClient(this.props.matrixServerUrl)
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
          client.setDisplayName(SUPPORT_SEEKER_DISPLAY_NAME)
        })
        .catch(err => {
          console.log("Registration error", err)
        })
        .then(() => client.initCrypto())
        .then(() => client.startClient())
        .then(() => {
          this.setState({
            client: client
          })
        })
        .catch(err => this.initializeUnencryptedChat())
    })
  }

  initializeUnencryptedChat = () => {
    this.setState({ ready: false })

    let opts = {
      baseUrl: this.props.matrixServerUrl,
      accessToken: this.state.accessToken,
      userId: this.state.userId,
      deviceId: this.state.deviceId
    }

    let client = matrix.createClient(opts)
    client.setDisplayName(SUPPORT_SEEKER_DISPLAY_NAME)
    return client.startClient()
      .then(() => {
        this.setState({
          client: client,
          isCryptoEnabled: false,
        })
      })
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
        console.log("verifying device", `${userId} - ${deviceId}`)
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
      invite: [BOT_USERNAME],
      visibility: 'private',
      name: `${chatDate} - ${this.props.roomName} - started at ${chatTime}`,
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

    this.state.client.setPowerLevel(room_id, BOT_USERNAME, 100)

    if (isCryptoEnabled) {
      this.verifyAllRoomDevices(room_id)
    } else {
      this.displayBotMessage({ body: UNENCRYPTION_NOTICE })
    }

    this.displayBotMessage({ body: CONFIRMATION_MESSAGE })

    this.setState({
      roomId: room_id,
      isCryptoEnabled
    })
  }

  sendMessage = () => {
    this.state.client.sendTextMessage(this.state.roomId, this.state.inputValue)
      .then((res) => {
        this.setState({ inputValue: "" })
        this.chatboxInput.current.focus()
      })
      .catch((err) => {
        switch (err["name"]) {
          case "UnknownDeviceError":
            Object.keys(err.devices).forEach((userId) => {
              Object.keys(err.devices[userId]).map((deviceId) => {
                  this.state.client.setDeviceKnown(userId, deviceId, true);
              });
            });
            this.sendMessage()
            break;
          default:
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
      sender: BOT_USERNAME,
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

    if (!prevState.ready && this.state.ready) {
      this.chatboxInput.current.focus()
    }

    if (!prevState.opened && this.state.opened) {
      this.chatboxInput.current.focus()
    }

    if (prevState.messages.length !== this.state.messages.length) {
      this.messageWindow.current.scrollTo(0, this.messageWindow.current.scrollHeight)
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
    this.setState({ inputValue: e.currentTarget.value })
  }

  handleSubmit = e => {
    e.preventDefault()
    if (!Boolean(this.state.inputValue)) return null;

    if (this.state.awaitingAgreement && !this.state.client) {
      if (this.state.inputValue.toLowerCase() === 'yes') {
        this.displayFakeMessage({ body: this.state.inputValue }, 'from-me')
        this.setState({ inputValue: "" })

        return this.initializeChat()

      } else {
        this.displayFakeMessage({ body: this.state.inputValue }, 'from-me')
        this.displayBotMessage({ body: EXIT_MESSAGE })
        return this.setState({ inputValue: "" })
      }
    }

    if (this.state.client && this.state.roomId) {
      return this.sendMessage()
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
                    {
                      messages.map((message, index) => {
                        return(
                          <Message key={message.id} message={message} userId={userId} botId={BOT_USERNAME} />
                        )
                      })
                    }
                    { typingStatus &&
                      <div className="notices">
                        <div role="status">{typingStatus}</div>
                      </div>
                    }
                    {
                      !ready && <div className="loader">loading...</div>
                    }
                  </div>
                </div>
                <div className="input-window">
                  <form onSubmit={this.handleSubmit}>
                    <input
                      type="text"
                      onChange={this.handleInputChange}
                      value={inputValue}
                      aria-label={inputLabel}
                      placeholder={inputLabel}
                      autoFocus={true}
                      ref={this.chatboxInput}
                    />
                    <input type="submit" value="Send" />
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
  roomName: PropTypes.string.isRequired,
  termsUrl: PropTypes.string,
  privacyStatement: PropTypes.string,
}

ChatBox.defaultProps = {
  matrixServerUrl: DEFAULT_MATRIX_SERVER,
  roomName: DEFAULT_ROOM_NAME,
}

export default ChatBox;

