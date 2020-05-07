# Embeddable Matrix Chatbox

![Demo video of chatbox](https://media.giphy.com/media/IhmtP0NoG22k6FRQDF/giphy.gif)

Live demo: https://nomadic-labs.github.io/safesupport-chatbox/

Built on:
- [Embeddable React Widget](https://github.com/seriousben/embeddable-react-widget)
- [Matrix JS SDK](https://github.com/matrix-org/matrix-js-sdk)

## Usage
```
<script src="https://unpkg.com/safesupport-chatbox" type="text/javascript"></script>
<script>
  var config = {
    matrixServerUrl: 'https://matrix.rhok.space',
    botId: '@help-bot:rhok.space',
    roomName: 'Support Chat',
    termsUrl: 'https://tosdr.org/',
    introMessage: 'This chat application does not collect any of your personal data or any data from your use of this service.',
    agreementMessage: 'Do you want to continue?',
    confirmationMessage: 'Waiting for a facilitator to join the chat...',
    exitMessage: 'The chat is closed. You may close this window.',
    chatUnavailableMessage: 'The chat service is not available right now. Please try again later.',
    anonymousDisplayName: 'Anonymous',
  }

  EmbeddableChatbox.mount(config);
</script>
```
Options:
| Name | Description | Default
| ----------- | ----------- | --------- |
| `matrixServerUrl` (required) | URL for the Matrix homeserver you want to connect to | `https://matrix.rhok.space` |
| `botId` (required) | User ID for the bot account that handles invites | `@help-bot:rhok.space` |
| `introMessage` (optional) | First message the user sees before agreeing to the Terms of Use | `This chat application does not collect any of your personal data or any data from your use of this service.` |
| `termsUrl` (optional) | URL for the Terms of Use for the chat service | `https://tosdr.org/` |
| `roomName` (optional)  | Name of the chatroom generated in Riot | 'Support Chat' |
| `agreementMessage` (optional)  | Text to show to request agreement to the Terms of Use | `Do you want to continue?` |
| `confirmationMessage` (optional) | Text to show to ask for agreement to continue | `Waiting for a facilitator to join the chat...` |
| `exitMessage` (optional) | Text to show if the user rejects the Terms of Use. | `The chat is closed. You may close this window.` |
| `anonymousDisplayName` (optional) | The display name for the chat user. | `Anonymous` |
| `chatUnavailableMessage` (optional) | Text to show if no-one is available to respond  | `The chat service is not available right now. Please try again later.` |

## Feature list

- [x] Can be embedded on any website with Javascript enabled
- [x] WCAG AA compliant
- [x] Light and dark theme
- [x] Support seekers are anonymous
- [x] Uses Matrix's end to end encryption
- [x] If encryption fails, falls back to unencrypted chat
- [x] Status texts are customizeable
- [x] Only initiates chat after user agrees to Terms of Service
- [x] Upon exiting chat, user data is wiped - account deleted, local datastore cleared
- [x] If enabled, the bot account can provide transcript of the conversation
- [x] Automatically parses incoming text messages for URLs and adds the <a> tags
- [x] Easy to customize colour scheme
- [x] Bookmarklet allows users to open the chat on any website

## Bot account

This chatbox is meant to be used with a bot account that handles a number of functions:
* Sends out invitations to facilitators to join the support chat
* Revokes unused invitations when the first facilitator join the chat
* Keeps a transcript of the conversation
* Notifies user if there are not facilitators available

The bot account is invited to the chatroom when a support request is initiated.

You can find the code for the bot at [safesupport-bot](https://github.com/nomadic-labs/safesupport-bot).

## Bookmarklet

The bookmarklet is a special link that runs a script on any website. The user saves the link by dragging it to their bookmarks bar. Then they can click on the bookmark on any page to run the script and load the chatbox.

You can try this out on the [live demo](https://nomadic-labs.github.io/safesupport-chatbox/).

## Local development

Clone the project:
```
git clone https://github.com/nomadic-labs/safesupport-chatbox.git
```
Install the dependencies:
```
cd safesupport-chatbox
yarn
```

Start the development server:
```
yarn start
```

Open the demo page at http://localhost:9000/

## Production build
```
yarn build
```
