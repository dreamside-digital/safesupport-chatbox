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
const INTRO_MESSAGE = "This chat application does not collect any of your personal data or any data from your use of this service."
const AGREEMENT_MESSAGE = "👉 Do you want to continue? Type yes or no."
const CONFIRMATION_MESSAGE = "Waiting for a facilitator to join the chat..."
const EXIT_MESSAGE = "The chat was not started."
const FACILITATOR_ROOM_ID = '!pYVVPyFKacZeKZbWyz:rhok.space'
const TERMS_URL="https://tosdr.org/"


const initialState = {
  opened: false,
  showDock: true,
  client: null,
  ready: true,
  accessToken: null,
  userId: null,
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
      this.leaveRoom()
      .then(() => {
        this.setState(initialState)
      })
      .catch(err => console.log("Error leaving room", err))
    } else {
      this.setState(initialState)
    }
  }

  leaveRoom = () => {
    return this.state.client.leave(this.state.roomId)
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
            username: username
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
          client.setDisplayName("Anonymous")
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
    })
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

  createRoom = () => {
    const currentDate = new Date()
    const chatDate = currentDate.toLocaleDateString()
    const chatTime = currentDate.toLocaleTimeString()
    return this.state.client.createRoom({
      room_alias_name: `private-support-chat-${uuid()}`,
      invite: [BOT_USERNAME],
      visibility: 'private',
      name: `${chatDate} - ${this.props.roomName} - started at ${chatTime}`,
      initial_state: [
        {
          type: 'm.room.encryption',
          state_key: '',
          content: ENCRYPTION_CONFIG,
        },
      ]
    })
    .then(data => {
      this.verifyAllRoomDevices(data.room_id)
      this.state.client.setPowerLevel(data.room_id, BOT_USERNAME, 100)
        .then(() => console.log("Set bot power level to 100"))
        .catch(err => console.log("Error setting bot power level", err))

      const confirmationMsg = {
        id: 'confirmation-msg-id',
        type: 'm.room.message',
        sender: BOT_USERNAME,
        content: { body: CONFIRMATION_MESSAGE },
      }
      const messages = [...this.state.messages]
      messages.push(confirmationMsg)
      this.setState({
        roomId: data.room_id,
        messages
      })
    })
    .catch(err => {
      console.log("Unable to create room", err)
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

  handleMessageEvent = event => {
    const message = {
      id: event.getId(),
      type: event.getType(),
      sender: event.getSender(),
      roomId: event.getRoomId(),
      content: event.getContent(),
    }

    console.log("INCOMING MESSAGE", message)

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
          const msgList = [...this.state.messages]
          const encryptionMsg = {
            id: 'encryption-msg-id',
            type: 'm.room.message',
            sender: BOT_USERNAME,
            roomId: room.room_id,
            content: { body: ENCRYPTION_NOTICE },
          }
          msgList.push(encryptionMsg)

          this.setState({ messages: msgList })
        }
      });

      this.state.client.on("Event.decrypted", (event) => {
        if (event.getType() === "m.room.message") {
          this.handleMessageEvent(event)
        }
      });

      this.state.client.on("RoomMember.typing", (event, member) => {
        if (member.typing) {
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
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleEscape, false);
    this.leaveRoom();
  }

  handleInputChange = e => {
    this.setState({ inputValue: e.currentTarget.value })
  }

  handleSubmit = e => {
    e.preventDefault()
    if (!Boolean(this.state.inputValue)) return null;

    if (this.state.awaitingAgreement && !this.state.client) {
      if (this.state.inputValue.toLowerCase() === 'yes') {
        const fakeUserMsg = {
          id: 'fake-msg-id',
          type: 'm.room.message',
          sender: 'from-me',
          content: { body: this.state.inputValue },
        }

        const messages = [...this.state.messages]
        messages.push(fakeUserMsg)
        this.setState({ inputValue: "", messages })

        return this.initializeChat()

      } else {
        const fakeUserMsg = {
          id: 'fake-msg-id',
          type: 'm.room.message',
          sender: 'from-me',
          content: { body: this.state.inputValue },
        }

        const exitMsg = {
          id: 'exit-msg-id',
          type: 'm.room.message',
          sender: BOT_USERNAME,
          content: { body: EXIT_MESSAGE },
        }

        const messages = [...this.state.messages]
        messages.push(fakeUserMsg)
        messages.push(exitMsg)
        this.setState({ inputValue: "", messages })
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

