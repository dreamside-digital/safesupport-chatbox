import React, { Component } from 'react';
import { Transition } from 'react-transition-group';
import Chatbox from './chatbox';
import './widget.scss';

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
      <div className="docked-widget">
        <Transition in={opened} timeout={250} onExited={this.handleWidgetExit}>
          {(status) => (
            <div className={`widget widget-${status}`}>
              <Chatbox handleToggleOpen={this.handleToggleOpen} opened={opened} status={status} />
            </div>
          )}
        </Transition>
        {showDock && (
          <button
            type="button"
            className="dock"
            onClick={this.handleToggleOpen}
            onKeyPress={this.handleToggleOpen}
          >
            <span>Open support chat</span>
            <span className={`arrow ${opened ? 'opened' : 'closed'}`}>⌃</span>
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
