import React, { Component } from 'react';
import { Transition } from 'react-transition-group';
import Chatbox from './chatbox';
import './styles.scss';

class Widget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: false,
      showDock: true,
    };
  }

  handleToggleOpen = () => {
    this.setState((prev) => {
      let { showDock } = prev;
      if (!prev.opened) {
        showDock = false;
      }
      return {
        showDock,
        opened: !prev.opened,
      };
    });
  }

  handleWidgetExit = () => {
    this.setState({
      showDock: true,
    });
  }


  render() {
    const { opened, showDock } = this.state;

    return (
      <div className="docked-widget" role="complementary">
        <Transition in={opened} timeout={250} onExited={this.handleWidgetExit}>
          {(status) => (
            <div className={`widget widget-${status}`} aria-hidden={!opened}>
              <Chatbox
                handleToggleOpen={this.handleToggleOpen}
                opened={opened}
                status={status}
                {...this.props} // eslint-disable-line
              />
            </div>
          )}
        </Transition>
        {showDock && (
          <button
            type="button"
            className="dock"
            onClick={this.handleToggleOpen}
            onKeyPress={this.handleToggleOpen}
            aria-labelledby="open-chatbox-label"
          >
            <span id="open-chatbox-label">Open support chat</span>
            <span className={`arrow ${opened ? 'opened' : 'closed'}`} aria-label={`${opened ? 'Close' : 'Open'} support chat window`}>⌃</span>
          </button>
        )}
      </div>
    );
  }
}

Widget.propTypes = {

};

Widget.defaultProps = {
};

export default Widget;
