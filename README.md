Embeddable Matrix Chatbox

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
| `matrixServerUrl` (required) | URL for the Matrix homeserver you want to connect to | `https://www.matrix.org` |
| `userToInvite` (required)  | Username of the account that should be invited when a new chat is started | `null` |
| `termsUrl` (optional)  | URL for the Terms of Use for the chat service | `null` |
| `roomName` (optional)  | Name of the chatroom generated in Riot | 'Support Chat' |
| `introText` (optional)  | Text to be shown before the Terms of Use url | `null` |
| `agreementText` (optional) | Text to be shown to ask for agreement to continue | `null` |

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
