# Embeddable Matrix Chatbox

![Demo video of chatbox](https://media.giphy.com/media/Js8Wm7DdbkuFK4MJUC/giphy.gif)

Built on:
- [Embeddable React Widget](https://github.com/seriousben/embeddable-react-widget)
- [Matrix JS SDK](https://github.com/matrix-org/matrix-js-sdk)

## Usage
```
<script src="./chatbox.js"></script>
<script>
  EmbeddableChatbox.mount({ matrixServerUrl: "https://matrix.org" });
</script>
```
Options:
| Name | Description | Default
| ----------- | ----------- | --------- |
| `matrixServerUrl` (required) | URL for the Matrix homeserver you want to connect to | `https://matrix.rhok.space` |
| `botUsername` (required) | User ID for the bot account that handles invites | `@help-bot:rhok.space` |
| `introMessage` (required)  | First message the user sees before agreeing to the Terms of Use | `This chat application does not collect any of your personal data or any data from your use of this service.` |
| `termsUrl` (required)  | URL for the Terms of Use for the chat service | `https://tosdr.org/` |
| `roomName` (optional)  | Name of the chatroom generated in Riot | 'Support Chat' |
| `agreementMessage` (optional)  | Text to show to request agreement to the Terms of Use | `Do you want to continue?` |
| `confirmationMessage` (optional) | Text to show to ask for agreement to continue | `Waiting for a facilitator to join the chat...` |
| `exitMessage` (optional) | Text to show if the user rejects the Terms of Use. | `The chat is closed. You may close this window.` |
| `anonymousDisplayName` (optional) | The display name for the chat user. | `Anonymous` |
| `chatUnavailableMessage` (optional) | Text to show if no-one is available to respond  | `The chat service is not available right now. Please try again later.` |

## Local development

Clone the project:
```
git clone https://github.com/nomadic-labs/ocrcc-chatbox.git
```
Install the dependencies:
```
cd ocrcc-chatbox
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
