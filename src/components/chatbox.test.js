import React from 'react';
import Chatbox from './chatbox';
import mockMatrix, { mockCreateClient } from "matrix-js-sdk";
import { mount, shallow } from 'enzyme';
import { createWaitForElement } from 'enzyme-wait';
import { config } from 'react-transition-group';

config.disabled = true

const testConfig = {
  matrixServerUrl: 'https://matrix.rhok.space',
  botUsername: '@help-bot:rhok.space',
  roomName: 'Support Chat',
  termsUrl: 'https://tosdr.org/',
  introMessage: 'This chat application does not collect any of your personal data or any data from your use of this service.',
  agreementMessage: '👉 Do you want to continue? Type yes or no.',
  confirmationMessage: 'Waiting for a facilitator to join the chat...',
  exitMessage: 'The chat was not started.',
  chatUnavailableMessage: 'The chat service is not available right now. Please try again later.',
  anonymousDisplayName: 'Anonymous',
}


describe('Chatbox', () => {

  test('chat window should open and close', async () => {
    const chatbox = mount(<Chatbox {...testConfig} />)

    let dock = chatbox.find('button.dock')
    let chatWindow = chatbox.find('.widget')

    expect(dock.length).toEqual(1)
    expect(chatWindow.hasClass('widget-exited')).toEqual(true)

    // open chat window
    dock.simulate('click')

    const openChatWindow = await createWaitForElement('.widget-entered')(chatbox)
    dock = chatbox.find('button.dock')
    expect(openChatWindow.length).toEqual(1)
    expect(dock.length).toEqual(0)

    // close chat window
    const closeButton = chatbox.find('button.widget-header-close')
    closeButton.simulate('click')

    chatWindow = chatbox.find('.widget')
    dock = chatbox.find('button.dock')

    expect(dock.length).toEqual(1)
    expect(chatWindow.hasClass('widget-exited')).toEqual(true)
  })

  test('chat window should contain the right messages', () => {
    const chatbox = mount(<Chatbox {...testConfig} />)
    const props = chatbox.props()
    const messages = chatbox.find('.messages')

    expect(messages.text()).toContain(props.introMessage)
    expect(messages.html()).toContain(props.termsUrl)
    expect(messages.text()).toContain(props.agreementMessage)
  });

  test('#handleExitChat should call exitChat if the client has been initialized', () => {

  })

  test('#exitChat should leave the room and destroy client', () => {
    // leave room
    // deactivate account
    // stop client
    // clear stores
    // reset initial state
  })

  test('agreeing to terms should start encrypted chat', async () => {
    const chatbox = mount(<Chatbox {...testConfig} />)
    const dock = chatbox.find('button.dock')

    dock.simulate('click')

    const yesButton = chatbox.find('#accept')
    yesButton.simulate('click')

    expect(mockCreateClient).toHaveBeenCalled()
  })

  // test('rejecting terms should not start chat', async () => {
  //   const chatbox = mount(<Chatbox {...testConfig} />)
  //   const dock = chatbox.find('button.dock')

  //   dock.simulate('click')

  //   const noButton = chatbox.find('#reject')
  //   noButton.simulate('click')

  //   expect(mockMatrix.mockCreateClient.mock.calls.length).toEqual(0)
  // })

  test('#initializeChat should notify user if client fails to initialize', () => {
    // handleInitError
  })

  test('#initializeChat should create unencypted chat if initCrypto fails', () => {
    // initializeUnencryptedChat
  })

  test('#initializeUnencryptedChat should initialize an unencrypted client', () => {
    // initializeUnencryptedChat
  })

  test('#handleDecryptionError should restart client without encryption and notify user', () => {
    // initializeUnencryptedChat
  })

  test('#verifyAllRoomDevices should mark all devices in the room as verified devices', () => {

  })

  test('#createRoom should create a new encrypted room with bot as admin', () => {

  })

  test('#createRoom should create a new unencrypted room if encryption is not enabled', () => {

  })

  test('#sendMessage should send text message with input value', () => {

  })

  test('#sendMessage should mark devices as known and retry sending on UnknownDeviceError', () => {

  })

  test('#sendMessage should mark devices as known and retry sending on UnknownDeviceError', () => {

  })

  test('#displayFakeMessage should add a message object to message list', () => {

  })

  test('#displayBotMessage should add a message object with bot as sender to message list', () => {

  })

  test('#handleMessageEvent should add received message to message list', () => {

  })

  test('#componentDidUpdate should set state listeners', () => {

  })

  test('#handleSubmit should listen for yes if awaiting agreement and initialize client', () => {

  })

  test('#handleSubmit should listen for no if awaiting agreement and do nothing', () => {

  })

  test('#handleSubmit should send message if awaitingAgreement is false', () => {

  })
});
