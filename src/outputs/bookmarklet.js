import EmbeddableChatbox from './embeddable-chatbox';

const config = {
        matrixServerUrl: 'https://matrix.safesupport.chat',
        botId: '@help-bot:safesupport.chat',
        roomName: 'Support Chat',
        termsUrl: 'https://tosdr.org/',
        introMessage: "This chat application does not collect any of your personal data or any data from your use of this service.",
        agreementMessage: 'Do you want to continue?',
        confirmationMessage: 'Waiting for a facilitator to join the chat...',
        exitMessage: 'The chat is closed. You may close this window.',
        chatUnavailableMessage: 'The chat service is not available right now. Please try again later.',
        anonymousDisplayName: 'Anonymous',
    }

export default function bookmarklet() {
  if (window.EmbeddableChatbox) {
    return;
  }
  window.EmbeddableChatbox = EmbeddableChatbox;

  EmbeddableChatbox.mount(config);
}

bookmarklet();
