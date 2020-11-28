---
layout: post
title: "WebRTC - Signaling example"
---

Recently I was trying to understand how to use WebRTC for a personal project. However, I found
the documentation and examples a bit unclear. I think this is because of all the moving parts
associated with WebRTC--SDP, ICE, STUN, TURN, and RDP. These requirements make it challenging to
set up a simple example. Primarily I wanted to understand how a WebRTC connection is established
between two peers, which I feel this is the most confusing part about WebRTC.

So in my case, I wanted to set up the simplest example that would allow me to send a text message
from one local browser to another (e.g. Chrome to Firefox).

## Useful resources

I found the following resources helpful in getting a better understand of WebRTC and creating
my simple example.

- [WebRTC for the Curious](https://webrtcforthecurious.com/)
  - The document is incomplete, but what's there is helpful for getting a sense of SDP, ICE, STUN,
    and TURN are used in WebRTC.
- [MDN - Signaling and video calling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)
  - The MDN docs are pretty good. There's also two swimlane diagrams that illustrate the signaling
    process
- [Github source for MDN example](https://github.com/mdn/samples-server/tree/master/s/webrtc-from-chat)
  - Sample code for the MDN example
- [Github source for Pion data channels example](https://github.com/pion/webrtc/tree/master/examples/data-channels)
  - This example was inspiration for my example

## Example walkthrough

The idea behind my example was to see if I could create a WebRTC data channel connection without
using any additional servers (with the exception of using the Google STUN servers for testing).

In most examples, the signaling step will use WebSockets to coordinate between the two computers. The
documentation that I read says that it's basically up to the developer how they want to handle the
signaling. The main thing is that we have to format information using SDP. Although WebSockets makes
sense for signaling, it also acts as barrier for understanding since it's not technically necessary.

It occurred to me when looking at the Pion data channel example that one could simply pass the SDP
messages manually between browsers to establish the WebRTC connection.

The other important thing is that it seems the TURN server isn't a hard requirement. It seems like it's
used as a fallback if an internal network is preventing peer to peer connections.

The STUN server is a requirement, but for testing we can use the publicly available Google ones.

To test out how a WebRTC data channel connection can be established, I created two test files.

- host.html
  - This browser/tab will send the initial offer
- client.html
  - This browser/tab will receive the host's offer and (manually) send their answer back to the host

The general steps are as follows:

- The host will create an offer
  - To create the offer it seems we need to use the ICE protocol and STUN server, though I'm not totally
    sure how this works in practice. I still need to read more on that.
- Now we can take the offer and paste it into the client browser
  - Normally we'd send the offer over via the websocket server
- The client will now generate an answer. This answer needs to be sent back to the host to complete
  the signaling step so the two peers can send messages to either directly.

A few notes:

- I wasn't able to test this across two different computers or networks, so this example may not work
  - I did try connecting with my phone to my laptop but it didn't seem to work. I didn't spend too
    much time debugging since it was a pain to copy over the SDP messages
- I noticed this example didn't work when I used Firefox as the host and Chrome as the client
  - It did work with Firefox tab to Firefox tab. And Chrome as a host and Firefox as client.

## Screenshots

Here are some screenshots of the steps described in the previous section. The screenshots are
from two Chrome windows side by side.

### Step 1 - Sending an offer

![Sending an offer](/images/webrtc-signaling/send-offer.png)

### Step 2 - Receiving an answer

![Receiving an answer](/images/webrtc-signaling/receive-answer.png)

### Step 3 - Sending messages

![Sending messages](/images/webrtc-signaling/send-messages.png)

## Relevant code annotations

I posted the full code in the next section. It's probably easier to understand
the signaling workflow by reading the code as a whole.

However I will include some annotations here relevant code snippets.

### Creating the data channels

The `peerConnection` variable is an instance of `RTCPeerConnection`.

In both the host and client cases, we'll be working with two channels. The first is the
sending channel:

```javascript
const localChannel = peerConnection.createDataChannel('Host')
localChannel.onclose = () => log('Host channel has closed')
localChannel.onopen = () => log('Host channel has opened')
```

The second channel is for receiving messages from the remote connection once
it has been established via the `ondatachannel` event.

```javascript
peerConnection.ondatachannel = function(event) {
  const remoteChannel = event.channel
  remoteChannel.onopen = () => log('Remote channel has opened')
  remoteChannel.onclose = () => log('Remote channel has closed')
  remoteChannel.onmessage = (event) => {
    log(`Message from DataChannel '${remoteChannel.label}' payload '${event.data}'`)
  }
}
```
### Making an offer

How this part works I'm still unclear on. I tried creating an offer outside the `onnegotiationneeded`
but setting the local session description didn't work. Seems like we need to wait until at least the
`onnegotiationneeded` event to create an offer.

The second callback function `onicecandidate` is also unclear to me since it doesn't seem like we set
an ice candidate here. We just update the text area with the local session description when this event
fires, but technically you could set that value on the `createOffer` callback.

What I do understand is that we need to take the offer and send it to the remote.

```javascript
peerConnection.onnegotiationneeded = event => {
  peerConnection.createOffer().then(description => peerConnection.setLocalDescription(description)).catch(log)
}

peerConnection.onicecandidate = event => {
  if (event.candidate === null) {
    document.getElementById('localSessionDescription').value = btoa(JSON.stringify(peerConnection.localDescription))
  }
}
```
### Receiving an offer

When we receive an offer (SDP format) on the client, we set the offer as the remote session description.
Once that's done we can create an answer (also SDP format) to set as the local session description. We
also need to send this answer back to host.

```javascript
  window.receiveOffer = async () => {
    // Remote offer that was pasted into the text area (will be base64 encoded, so will need to decode)
    let sessionDescription = document.getElementById('remoteSessionDescription').value
    if (sessionDescription === '') {
      return alert('Session Description must not be empty')
    }
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(sessionDescription))))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      // Set the answer in the text area so we can copy and paste the base64 encoded value over to the host
      document.getElementById('localSessionDescription').value = btoa(JSON.stringify(peerConnection.localDescription))
    } catch (event) {
      alert(event)
    }
  }
```

### Receiving an answer

Receiving an answer on the host is pretty simple. We just need to set the answer as the remote session
description on the host.

```javascript
  window.receiveAnswer = async () => {
    let sessionDescription = document.getElementById('remoteSessionDescription').value
    if (sessionDescription === '') {
      return alert('Session Description must not be empty')
    }
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(sessionDescription))))
    } catch (event) {
      alert(event)
    }
  }
```

## Full code

### host.html

```html
<html>
<head>
  <title>WebRTC Host</title>
</head>
<body>
  <h1>Host</h1>

  <p><strong>Local Offer Base64 Session Description</strong></p>
  <p><em>Paste this text into client.html as a remote offer</em></p>
  <p><textarea id="localSessionDescription" readonly="true"></textarea><p>

  <p><strong>Remote Answer Base64 Session Description</strong></p>
  <p><em>Get remote offer from client.html</em></p>
  <p><textarea id="remoteSessionDescription" ></textarea></p>
  <p><button onclick="window.receiveAnswer()">Receive Answer</button></p>

  <p><strong>Message</strong></p>
  <p><textarea id="message">This is my DataChannel message!</textarea></p>
  <p><button onclick="window.sendMessage()"> Send Message </button></p>

  <p><strong>Logs</strong></p>
  <div id="logs"></div>

  <script>
    const log = message => {
      document.getElementById('logs').innerHTML += message + '<br>'
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    })

    const localChannel = peerConnection.createDataChannel('Host')
    localChannel.onclose = () => log('Host channel has closed')
    localChannel.onopen = () => log('Host channel has opened')

    peerConnection.ondatachannel = function(event) {
      const remoteChannel = event.channel
      remoteChannel.onopen = () => log('Remote channel has opened')
      remoteChannel.onclose = () => log('Remote channel has closed')
      remoteChannel.onmessage = (event) => {
        log(`Message from DataChannel '${remoteChannel.label}' payload '${event.data}'`)
      }
    }

    peerConnection.oniceconnectionstatechange = event => log(peerConnection.iceConnectionState)
    peerConnection.onicecandidate = event => {
      if (event.candidate === null) {
        document.getElementById('localSessionDescription').value = btoa(JSON.stringify(peerConnection.localDescription))
      }
    }
    peerConnection.onnegotiationneeded = event => {
      peerConnection.createOffer().then(description => peerConnection.setLocalDescription(description)).catch(log)
    }

    window.receiveAnswer = async () => {
      let sessionDescription = document.getElementById('remoteSessionDescription').value
      if (sessionDescription === '') {
        return alert('Session Description must not be empty')
      }
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(sessionDescription))))
      } catch (event) {
        alert(event)
      }
    }

    window.sendMessage = () => {
      let message = document.getElementById('message').value
      if (message === '') {
        return alert('Message must not be empty')
      }
      localChannel.send(message)
    }

  </script>

</body>
</html>
```

### client.html

```html
<html>
<head>
  <title>WebRTC Client</title>
</head>
<body>
  <h1>Client</h1>
  <p><strong>Remote Offer Base64 Session Description</strong></p>
  <p><em>Get local offer from host.html</em></p>
  <p><textarea id="remoteSessionDescription" ></textarea></p>
  <p><button onclick="window.receiveOffer()">Receive Remote Offer</button></p>

  <p><strong>Local Answer Base64 Session Description</strong></p>
  <p><em>Paste this text into host.html as a remote answer</em></p>
  <p><textarea id="localSessionDescription" readonly="true"></textarea><p>

  <p><strong>Message</strong></p>
  <p><textarea id="message">This is my DataChannel message!</textarea></p>
  <p><button onclick="window.sendMessage()"> Send Message </button></p>

  <p><strong>Logs</strong></p>
  <div id="logs"></div>

  <script>
    const log = message => {
      document.getElementById('logs').innerHTML += message + '<br>'
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    })

    const localChannel = peerConnection.createDataChannel('Client')
    localChannel.onclose = () => log('Client channel has closed')
    localChannel.onopen = () => log('Client channel has opened')

    peerConnection.ondatachannel = function(event) {
      const remoteChannel = event.channel
      remoteChannel.onopen = () => log('Remote channel has opened')
      remoteChannel.onclose = () => log('Remote channel has closed')
      remoteChannel.onmessage = (event) => {
      log(`Message from DataChannel '${remoteChannel.label}' payload '${event.data}'`)
      }
    }

    peerConnection.oniceconnectionstatechange = event => log(peerConnection.iceConnectionState)

    window.receiveOffer = async () => {
      let sessionDescription = document.getElementById('remoteSessionDescription').value
      if (sessionDescription === '') {
        return alert('Session Description must not be empty')
      }
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(sessionDescription))))
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        document.getElementById('localSessionDescription').value = btoa(JSON.stringify(peerConnection.localDescription))
      } catch (event) {
        alert(event)
      }
    }

    window.sendMessage = () => {
      let message = document.getElementById('message').value
      if (message === '') {
        return alert('Message must not be empty')
      }
      localChannel.send(message)
    }

  </script>

</body>
</html>
```
