import React from "react"
import PropTypes from "prop-types"
import * as util from "util";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { LocalStorage } from "node-localstorage";
import * as olm from "olm"
global.Olm = olm

import * as matrix from "matrix-js-sdk";
import LocalStorageCryptoStore from "matrix-js-sdk/lib/crypto/store/localStorage-crypto-store";
import {uuid} from "uuidv4"

import Message from "./message";


const MATRIX_SERVER_ADDRESS = "https://matrix.rhok.space"
const FACILITATOR_USERNAME = "@ocrcc-facilitator-demo:rhok.space"
const CHATROOM_NAME = "Support Chat"
const ENCRYPTION_CONFIG = { "algorithm": "m.megolm.v1.aes-sha2" };


class ChatBox extends React.Component {
  constructor(props) {
    super(props)
    const client = matrix.createClient(MATRIX_SERVER_ADDRESS)
    this.state = {
      client: client,
      ready: false,
      rooms: { chunk: [] },
      accessToken: null,
      userId: null,
      messages: [],
      inputValue: "",
    }
    this.chatboxInput = React.createRef();
  }

  leaveRoom = () => {
    if (this.state.roomId) {
      this.state.client.leave(this.state.roomId).then(data => {
        console.log("Left room", data)
      })
    }
  }

  createRoom = () => {
    const currentDate = new Date()
    const chatDate = currentDate.toLocaleDateString()
    const chatTime = currentDate.toLocaleTimeString()
    return this.state.client.createRoom({
      room_alias_name: `private-support-chat-${uuid()}`,
      invite: [FACILITATOR_USERNAME], // TODO: create bot user to add
      visibility: 'private',
      name: `${chatDate} - ${CHATROOM_NAME} - started at ${chatTime}`,
      initial_state: [
        {
          type: 'm.room.encryption',
          state_key: '',
          content: ENCRYPTION_CONFIG,
        },

      ]
    }).then(data => {
      this.setState({
        roomId: data.room_id
      })
      // this.state.client.setRoomEncryption(data.room_id, ENCRYPTION_CONFIG)
    }).catch(err => {
      console.log("Unable to create room", err)
    })
  }

  sendMessage = () => {
    this.state.client.sendTextMessage(this.state.roomId, this.state.inputValue).then((res) => {
      this.setState({
        inputValue: "",
        isRoomEncrypted: this.state.client.isRoomEncrypted(this.state.roomId)
      })
      this.chatboxInput.current.focus()
    }).catch((err) => {
      console.log(err);
      Object.keys(err.devices).forEach((userId) => {
          Object.keys(err.devices[userId]).map((deviceId) => {
              this.state.client.setDeviceKnown(userId, deviceId, true);
          });
          this.state.client.sendTextMessage(this.state.roomId, this.state.inputValue)
            .then((res) => {
              this.setState({ inputValue: "", isRoomEncrypted: this.state.client.isRoomEncrypted(this.state.roomId) })
              this.chatboxInput.current.focus()
            })
            .catch(err => {
              console.log(err)
            });
      });
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

    const messages = [...this.state.messages]
    messages.push(message)
    this.setState({ messages })
  }

  componentDidMount() {
    // empty registration request to get session
    this.state.client.registerRequest({}).then(data => {
      console.log("Empty registration request to get session", data)
    }).catch(err => {
      // actual registration request with randomly generated username and password
      const username = uuid()
      const password = uuid()
      const sessionId = err.data.session
      this.state.client.registerRequest({
        auth: {session: sessionId, type: "m.login.dummy"},
        inhibit_login: false,
        password: password,
        username: username,
        x_show_msisdn: true,
      }).then(data => {

        // use node localStorage if window.localStorage is not available
        let localStorage = global.localStorage;
        if (typeof localStorage === "undefined" || localStorage === null) {
          const deviceDesc = `matrix-chat-${data.device_id}-${sessionId}`
          const localStoragePath = path.resolve(path.join(os.homedir(), ".local-storage", deviceDesc))
          localStorage = new LocalStorage(localStoragePath);
        }

        // create new client with full options
        let opts = {
          baseUrl: MATRIX_SERVER_ADDRESS,
          accessToken: data.access_token,
          userId: data.user_id,
          deviceId: data.device_id,
          sessionStore: new matrix.WebStorageSessionStore(localStorage),
        }

        this.setState({
          accessToken: data.access_token,
          userId: data.user_id,
          username: username,
          client: matrix.createClient(opts)
        }, () => {
          this.state.client.setDisplayName("Anonymous")
        })
      }).catch(err => {
        console.log("Registration error", err)
      })
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.client !== this.state.client) {
      this.state.client.initCrypto().then(res => {
        console.log("Crypto initialized!")
      }).catch(err => {
        console.log("Crypto ERROR", err)
      }).finally(() => {
        this.state.client.startClient()
      })

      this.state.client.once('sync', (state, prevState, res) => {
        if (state === "PREPARED") {
          this.setState({ ready: true })
        }
      });


      this.state.client.on("Room.timeline", (event, room, toStartOfTimeline) => {
        if (event.getType() === "m.room.message") {

          if (event.status === "sending") {
            return; // do nothing
          }

          if (event.status === "not sent") {
            return console.log("message not sent!", event)
          }

          if (event.isEncrypted()) {
            return console.log("message encrypted")
          }

          console.log("ROOM TIMELINE EVENT", event)

          this.handleMessageEvent(event)
        }
      });

      this.state.client.on("Event.decrypted", (event) => {
        console.log("EVENT DECRYPTED => ", event)
        if (event.getType() === "m.room.message") {
          this.handleMessageEvent(event)
        }
      });
    }

    if (prevProps.status !== "entered" && this.props.status === "entered") {
      this.chatboxInput.current.focus()
    }
  }

  componentWillUnmount() {
    this.leaveRoom();
  }

  handleInputChange = e => {
    this.setState({ inputValue: e.currentTarget.value })
  }

  handleSubmit = e => {
    e.preventDefault()
    if (!Boolean(this.state.inputValue)) return null;

    if (!this.state.roomId) {
      return this.createRoom().then(this.sendMessage)
    }

    this.sendMessage()
  }

  render() {
    const { ready, messages, inputValue, userId, isRoomEncrypted } = this.state;
    const { opened, handleToggleOpen } = this.props;
    console.log("isRoomEncrypted", isRoomEncrypted)

    if (!ready) {
      return (
        <div className="loader">loading...</div>
      )
    }

    return (
      <div id="ocrcc-chatbox">
        <div className="widget-header">
          <div className="widget-header-title">
            { isRoomEncrypted && <span>🔒</span> } Support Chat
          </div>
          <button
            type="button"
            className={`widget-header-icon`}
            onClick={handleToggleOpen}
            onKeyPress={handleToggleOpen}
          >
          <span className={`arrow ${opened ? "opened" : "closed"}`}>⌃</span>
          </button>
        </div>
        <div className="message-window">
          <div className="messages">
          {
            messages.map((message, index) => {
              return(
                <Message key={message.id} message={message} userId={userId} />
              )
            })
          }
        </div>
        <div className="notices">
          {
            isRoomEncrypted && <div>Messages in this chat are secured with end-to-end encryption.</div>
          }
        </div>
        </div>
        <div className="input-window">
          <form onSubmit={this.handleSubmit}>
            <input
              type="text"
              onChange={this.handleInputChange}
              value={inputValue}
              autoFocus={true}
              ref={this.chatboxInput}
            />
            <input type="submit" value="Send" />
          </form>
        </div>
      </div>
    );
  }
};

ChatBox.propTypes = {

}

ChatBox.defaultProps = {

}

export default ChatBox;

