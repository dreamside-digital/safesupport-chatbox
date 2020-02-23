import EmbeddableWidget from './embeddable-widget';

export default function bookmarklet() {
  if (window.EmbeddableWidget) {
    return;
  }
  window.EmbeddableWidget = EmbeddableWidget;

  EmbeddableWidget.mount({
    termsUrl: 'https://tosdr.org/',
    privacyStatement: 'This chat application does not collect any of your personal data or any data from your use of this service.',
    matrixServerUrl: 'https://matrix.rhok.space',
    roomName: 'Support Chat',
  });
}

bookmarklet();
