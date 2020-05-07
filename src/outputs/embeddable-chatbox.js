import React from 'react';
import ReactDOM from 'react-dom';
import Chatbox from '../components/chatbox';
import '../../vendor/cleanslate.css';

export default class EmbeddableChatbox {
  static el;

  static mount({ parentElement = null, ...props } = {}) {
    const component = <Chatbox {...props} />; // eslint-disable-line

    function doRender() {
      if (EmbeddableChatbox.el) {
        throw new Error('EmbeddableChatbox is already mounted, unmount first');
      }

      const el = document.createElement('div');
      el.setAttribute('class', 'cleanslate');

      if (parentElement) {
        document.querySelector(parentElement).appendChild(el);
      } else {
        document.body.appendChild(el);
      }
      ReactDOM.render(
        component,
        el,
      );
      EmbeddableChatbox.el = el;
    }

    if (document.readyState === 'complete') {
      doRender();
    } else {
      window.addEventListener('load', () => {
        doRender();
      });
    }
  }

  static unmount() {
    if (!EmbeddableChatbox.el) {
      throw new Error('EmbeddableChatbox is not mounted, mount first');
    }
    ReactDOM.unmountComponentAtNode(EmbeddableChatbox.el);
    EmbeddableChatbox.el.parentNode.removeChild(EmbeddableChatbox.el);
    EmbeddableChatbox.el = null;
  }
}
