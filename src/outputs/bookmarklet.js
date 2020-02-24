import EmbeddableChatbox from './embeddable-chatbox';

export default function bookmarklet() {
  if (window.EmbeddableChatbox) {
    return;
  }
  window.EmbeddableChatbox = EmbeddableChatbox;

  EmbeddableChatbox.mount({
    termsUrl: 'https://tosdr.org/',
    privacyStatement: 'This chat application does not collect any of your personal data or any data from your use of this service.',
    matrixServerUrl: 'https://matrix.rhok.space',
    roomName: 'Support Chat',
  });
}

bookmarklet();
