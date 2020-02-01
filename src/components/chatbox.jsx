import React from "react"
import PropTypes from "prop-types"
import * as sdk from "matrix-js-sdk";
import {uuid} from "uuidv4"

import Message from "./message";

const MATRIX_SERVER_ADDRESS = "https://matrix.rhok.space"
const FACILITATOR_USERNAME = "@anonymouscat:rhok.space"
const CHATROOM_NAME = "Support Chat"


class ChatBox extends React.Component {
  constructor(props) {
    super(props)
    const client = sdk.createClient(MATRIX_SERVER_ADDRESS)
    this.state = {
      client: client,
      ready: false,
      rooms: { chunk: [] },
      access_token: null,
      user_id: null,
      messages: [],
      inputValue: "",
    }
    this.chatboxInput = React.createRef();
  }

  leaveRoom = () => {
    if (this.state.room_id) {
      this.state.client.leave(this.state.room_id).then(data => {
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
      name: `${chatDate} - ${CHATROOM_NAME} - started at ${chatTime}`
    }).then(data => {
      this.setState({ room_id: data.room_id })
    })
  }

  sendMessage = () => {
    const content = {
      "body": this.state.inputValue,
      "msgtype": "m.text"
    };

    this.state.client.sendEvent(this.state.room_id, "m.room.message", content, "").then((res) => {
      this.setState({ inputValue: "" })
      this.chatboxInput.current.focus()
    }).catch((err) => {
      console.log(err);
    })
  }

  componentDidMount() {
    // empty registration request to get session
    this.state.client.registerRequest({}).then(data => {
      console.log("Empty registration request to get session", data)
    }).catch(err => {
      // actual registration request with randomly generated username and password
      const username = uuid()
      const password = uuid()
      this.state.client.registerRequest({
        auth: {session: err.data.session, type: "m.login.dummy"},
        inhibit_login: false,
        password: password,
        username: username,
        x_show_msisdn: true,
      }).then(data => {
        console.log("Registered user", data)
        this.setState({
          access_token: data.access_token,
          user_id: data.user_id,
          username: username,
          client: sdk.createClient({
            baseUrl: MATRIX_SERVER_ADDRESS,
            accessToken: data.access_token,
            userId: data.user_id
          })
        })
        this.state.client.setDisplayName("Anonymous")
      }).catch(err => {
        console.log("Registration error", err)
      })
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.client !== this.state.client) {
      this.state.client.startClient()

      this.state.client.once('sync', (state, prevState, res) => {
        if (state === "PREPARED") {
          this.setState({ ready: true })
        }
      });

      this.state.client.on("Room.timeline", (event, room, toStartOfTimeline) => {
        if (event.getType() === "m.room.message") {
          const messages = [...this.state.messages]
          messages.push(event)
          this.setState({ messages })
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

    if (!this.state.room_id) {
      return this.createRoom().then(this.sendMessage)
    }

    this.sendMessage()
  }

  render() {
    const { ready, messages, inputValue, user_id } = this.state;
    const { opened, handleToggleOpen } = this.props;

    if (!ready) {
      return (
        <div className="loader">loading...</div>
      )
    }

    return (
      <div id="ocrcc-chatbox">
        <div className="widget-header">
          <div className="widget-header-title">
            Support Chat
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
                <Message key={message.event.event_id} message={message} user_id={user_id} />
              )
            })
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

