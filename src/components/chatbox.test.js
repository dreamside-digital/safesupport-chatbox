import React from 'react';
import Chatbox from './chatbox';
import {
  createClient,
  mockClient,
  mockRegisterRequest,
  mockInitCrypto,
  mockStartClient,
  mockSetPowerLevel,
  mockCreateRoom,
  mockLeave,
  mockDeactivateAccount,
  mockStopClient,
  mockClearStores,
  mockOn,
  mockOnce,
  mockSendTextMessage
} from "matrix-js-sdk";
import { mount, shallow } from 'enzyme';
import { createWaitForElement } from 'enzyme-wait';
import { config } from 'react-transition-group';
import waitForExpect from 'wait-for-expect'

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

  beforeEach(() => {
    createClient.mockClear()
    mockInitCrypto.mockClear()
    mockStartClient.mockClear()
    mockRegisterRequest.mockClear()
    mockSetPowerLevel.mockClear()
    mockCreateRoom.mockClear()
    mockLeave.mockClear()
    mockDeactivateAccount.mockClear()
    mockStopClient.mockClear()
    mockClearStores.mockClear()
    mockOnce.mockClear()
    mockOn.mockClear()
  })

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

  test('agreeing to terms should start encrypted chat', async () => {
    const chatbox = mount(<Chatbox {...testConfig} />)
    const dock = chatbox.find('button.dock')

    dock.simulate('click')

    const openChatWindow = await createWaitForElement('.widget-entered')(chatbox)
    let acceptButton = await createWaitForElement('button#accept')(chatbox)
    acceptButton = chatbox.find('button#accept')

    acceptButton.simulate('click')

    const ready = await createWaitForElement('.loader')(chatbox)
    expect(ready.length).toEqual(1)

    expect(createClient).toHaveBeenCalled()
    expect(mockInitCrypto).toHaveBeenCalled()
    expect(mockStartClient).toHaveBeenCalled()
    expect(mockCreateRoom).toHaveBeenCalled()
    expect(mockSetPowerLevel).toHaveBeenCalled()
    expect(mockSetPowerLevel).toHaveBeenCalled()
    expect(mockOn).toHaveBeenCalled()
    expect(mockOnce).toHaveBeenCalled()
  })

  test('rejecting terms should not start chat', async () => {
    const chatbox = mount(<Chatbox {...testConfig} />)
    const dock = chatbox.find('button.dock')

    dock.simulate('click')

    const openChatWindow = await createWaitForElement('.widget-entered')(chatbox)
    let rejectButton = await createWaitForElement('button#reject')(chatbox)
    rejectButton = chatbox.find('button#reject')

    rejectButton.simulate('click')

    expect(createClient.mock.calls.length).toEqual(0)
  })

  test('submitted messages should be sent to matrix', async () => {
    const chatbox = mount(<Chatbox {...testConfig} />)
    const dock = chatbox.find('button.dock')

    dock.simulate('click')

    let acceptButton = await createWaitForElement('button#accept')(chatbox)
    acceptButton = chatbox.find('button#accept')

    acceptButton.simulate('click')

    await waitForExpect(() => {
      expect(mockCreateRoom).toHaveBeenCalled()
    });

    const input = chatbox.find('#message-input')
    const form = chatbox.find('form')
    const message = 'Hello'

    input.simulate('change', { target: { value: message }})

    await waitForExpect(() => {
      chatbox.update()
      expect(chatbox.state().inputValue).toEqual(message)
    })

    form.simulate('submit')

    await waitForExpect(() => {
      expect(mockSendTextMessage).toHaveBeenCalledWith(chatbox.state().roomId, message)
    });
  })


  test('decryption failure should lead to a new unencrypted chat', async () => {
    const chatbox = mount(<Chatbox {...testConfig} />)
    const dock = chatbox.find('button.dock')
    const instance = chatbox.instance()

    dock.simulate('click')

    const openChatWindow = await createWaitForElement('.widget-entered')(chatbox)
    let acceptButton = await createWaitForElement('button#accept')(chatbox)
    acceptButton = chatbox.find('button#accept')

    acceptButton.simulate('click')

    await waitForExpect(() => {
      expect(mockCreateRoom).toHaveBeenCalled()
    });

    jest.spyOn(instance, 'initializeUnencryptedChat')
    instance.handleDecryptionError()

    await waitForExpect(() => {
      expect(mockLeave).toHaveBeenCalled()
    });

    await waitForExpect(() => {
      expect(mockStopClient).toHaveBeenCalled()
    });

    await waitForExpect(() => {
      expect(mockClearStores).toHaveBeenCalled()
    });

    expect(instance.initializeUnencryptedChat).toHaveBeenCalled()
  })

  test('creating an unencrypted chat', async () => {
    const chatbox = mount(<Chatbox {...testConfig} />)
    const instance = chatbox.instance()

    instance.initializeUnencryptedChat()

    await waitForExpect(() => {
      expect(createClient).toHaveBeenCalled()
    })

    await waitForExpect(() => {
      expect(mockStartClient).toHaveBeenCalled()
    })

    await waitForExpect(() => {
      expect(mockInitCrypto).not.toHaveBeenCalled()
    })
  })

  test('exiting the chat should leave the room and destroy client', async () => {
    const chatbox = mount(<Chatbox {...testConfig} />)
    const dock = chatbox.find('button.dock')

    dock.simulate('click')

    const openChatWindow = await createWaitForElement('.widget-entered')(chatbox)
    let acceptButton = await createWaitForElement('button#accept')(chatbox)
    acceptButton = chatbox.find('button#accept')

    acceptButton.simulate('click')

    await waitForExpect(() => {
      expect(mockCreateRoom).toHaveBeenCalled()
    });

    const exitButton = chatbox.find('button.widget-header-close')

    exitButton.simulate('click')

    let closed = await createWaitForElement('button.dock')
    expect(closed.length).toEqual(1)

    await waitForExpect(() => {
      expect(mockLeave).toHaveBeenCalled()
    });

    await waitForExpect(() => {
      expect(mockDeactivateAccount).toHaveBeenCalled()
    });

    await waitForExpect(() => {
      expect(mockStopClient).toHaveBeenCalled()
    });

    await waitForExpect(() => {
      expect(mockClearStores).toHaveBeenCalled()
    });
  })

  test('notification should appear when facilitator joins chat', () => {
    //
  })

  test('received messages should appear in chat window', () => {
    //
  })

});
