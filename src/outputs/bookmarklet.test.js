import ReactDOM from 'react-dom';
import bookmarklet from './bookmarklet';

describe('bookmarklet', () => {
  afterEach(() => {
    const el = document.querySelectorAll('body > div');
    ReactDOM.unmountComponentAtNode(el[0]);
    el[0].parentNode.removeChild(el[0]);
    window.EmbeddableChatbox = null;
  });

  test('#mount document becomes ready', async () => {
    expect(window.EmbeddableChatbox).not.toBeNull();
    bookmarklet();
    const el = document.querySelectorAll('body > div');
    expect(el).toHaveLength(1);
  });
});
