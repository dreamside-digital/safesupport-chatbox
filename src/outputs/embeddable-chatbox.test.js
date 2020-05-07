import EmbeddableChatbox from './embeddable-chatbox';
import { waitForSelection } from '../utils/test-helpers';


describe('EmbeddableChatbox', () => {
  beforeAll(() => {
    document.readyState = 'complete';
    if (EmbeddableChatbox.el) {
      EmbeddableChatbox.unmount();
    }
  });

  afterEach(() => {
    document.readyState = 'complete';
    if (EmbeddableChatbox.el) {
      EmbeddableChatbox.unmount();
    }
  });

  test('#mount document becomes ready', async () => {
    document.readyState = 'loading';
    EmbeddableChatbox.mount();
    window.dispatchEvent(new Event('load', {}));
    await waitForSelection(document, 'div');
  });

  test('#mount document complete', async () => {
    EmbeddableChatbox.mount();
    await waitForSelection(document, 'div');
  });

  test('#mount to document element', async () => {
    const newElement = document.createElement('span');
    newElement.setAttribute('id', 'widget-mount');
    document.body.appendChild(newElement);

    EmbeddableChatbox.mount({
      parentElement: '#widget-mount',
    });

    await waitForSelection(document, 'div');

    expect(document.querySelectorAll('#widget-mount')).toHaveLength(1);
  });

  test('#mount twice', async () => {
    EmbeddableChatbox.mount();
    expect(() => EmbeddableChatbox.mount()).toThrow('already mounted');
  });

  test('#unmount', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(document.querySelectorAll('div')).toHaveLength(1);

    EmbeddableChatbox.el = el;
    EmbeddableChatbox.unmount();

    expect(document.querySelectorAll('div')).toHaveLength(0);
  });

  test('#unmount without mounting', async () => {
    expect(() => EmbeddableChatbox.unmount()).toThrow('not mounted');
  });
});
