---
layout: post
title: "Too Many Cooks - Part 4: Simple Soup"
---

Recently I began testing Too Many Cooks on a Google Cloud server instance. Performance was poor. Gameplay lagged. Audio stuttered. This was disappointing since it meant I would have to scrap my geckos fork that integrated WebRTC (the implementation of which was described in [part 3](/programming/too-many-cooks-part-3-geckos-video-streams.html) of this series).

In order to resolve this problem, I decided to decouple the WebRTC connections for gameplay and video. This meant that I would continue to use geckos for managing the Phaser 3 logic, at least for the time being. It remains to be seen how scalable geckos is in the long run since it's constrained to a single NodeJS process. Removing the WebRTC integration had the additional benefit of allowing me to upgrade to geckos 2, which has noticeably improved data channel performance. Video/Audio streaming would now need to be handled by a dedicated WebRTC library. This approach has the benefit of allowing for more granular scaling and targeted performance improvements.

Initially I considered Pion since I'm always looking for excuses to work with Go. Unfortunately I didn't feel confident that it would sufficiently handle my main use case, which was strong support for selective forwarding units (SFU). The Pion samples do provide an SFU example, but it didn't fully work for me. Ultimately I settled on Mediasoup since their website explicitly mentions SFU support.

Getting started with Mediasoup is not easy. The API documentation and overview of concepts is reasonable. But it's not clear how to put all the pieces together. Mediasoup does provide a fair amount of examples. I made the mistake of focusing on their official demo which is relatively full-featured and robust. For example the frontend uses React. The problem with this is unnecessary complexity.

In the end, I took the strategy of stripping the official Mediasoup demo example down to my bare minimum requirements, which was being able to stream each player's video/audio to all others in the game. For this demo, I didn't care about making something full-featured or robust. The main goal was: will this work or not?

# 1. Overview of Mediasoup Architecture

This diagram is my interpretation of the high level Mediasoup architecture.

![Mediasoup diagram](/images/too-many-cooks/p4-mediasoup-diagram.png)

The architecture consists of the following concepts:

- **Transports**
  - For Too Many Cooks we only care about WebRTC. But basically the adapter pattern for streaming video/audio data.
- **Broadcasters**
  - Think of broadcasters as television stations. Content is streamed by the broadcaster for others to view. This is essentially a one to many relationship. But similar to a TV station, there can be more than one station for people to watch. In the case of Mediasoup, it's possible to watch multiple broadcasters at the same time. Each peer is a broadcaster in a basic SFU.
- **Producers**
  - Producers are the content that the broadcasters stream. A broadcaster can stream multiple producers. This is because video and audio streams count as separate producers. So it may be better to think of producers as tracks even if that's not technically correct.
- **Consumers**
  - Consumers are the tracks that get multiplexed to the viewers of the broadcaster. For instance in an SFU, each viewer would be forwarded a video and audio track.
- **Room**
  - A room is managed by a Mediasoup worker (router) and the WebSocket server. The latter is mostly necessary for handling the WebRTC signaling. Having a separate worker for each room allows Mediasoup to scale better, since a separate worker can handle each room. There is also a way to have multiple workers for a single room if extra scalability is needed.
- **Peer**
  - A peer is basically a user connected to the WebSocket server.

# 2. Client implementation

My goal for the client was to keep it to the bare minimum. This is done by automatically establishing an video/audio feed once the user visits the webpage. They will then see their video stream and the streams of all other connected users.

Here is the index.html:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Simple Soup Test</title>
</head>
<body>
  <div id="me-video"></div>
  <div id="other-video"></div>
  <script type="module" src="./index.js"></script>
</body>
</html>
```

## 2.1 Join Room logic
The main client code is in `client/index.js`. The client will do the following:

- Connect to the WebSocket server
- Establish two WebRTC transports (send/receive) with the server.
- Join a room
- Create a producer for the user's video stream
- Create a producer for the user's audio stream
- Listen for consumer video/audio streams as they arrive

Here is an annotated snippet of the initialization code.

```javascript
async function _joinRoom() {

  try {
    // In an SFU, we don't signal with a peer. Instead we signal with the server
    // since the server will route the streams to other connected peers.
    mediasoupDevice = new mediasoupClient.Device()
    const routerRtpCapabilities = await protoo.request('getRouterRtpCapabilities')
    await mediasoupDevice.load({ routerRtpCapabilities })

    let transportInfo = await protoo.request('createWebRtcTransport', {
        producing: true,
        consuming: false,
        sctpCapabilities: false,
      })

    const {
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
      sctpParameters
    } = transportInfo
    // Creates a WebRTC transport for sending the user's video/audio producer streams
    // to be broadcast to connected users.
    //
    // Note that this step merely sets up the transport. No streams are sent yet.
    sendTransport = mediasoupDevice.createSendTransport({
      id,
      iceParameters,
      iceCandidates,
      dtlsParameters,
      sctpParameters,
      iceServers: [],
    })

    // This is a common pattern you'll see. Events are mediated by the
    // WebSocket server. So messages will be sent and received through
    // the server. Messages are not sent directly. This is especially
    // true when the WebRTC connections are video/audio only. Though
    // Mediasoup does support data channels.
    sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      protoo.request('connectWebRtcTransport', {
        transportId : sendTransport.id,
        dtlsParameters,
      })
      .then(callback)
      .catch(errback)
    })

    sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
      try {
        const { id } = await protoo.request('produce', {
          transportId: sendTransport.id,
          kind,
          rtpParameters,
          appData,
        })
        callback({ id })
      } catch (error) {
        errback(error)
      }
    })

    transportInfo = await protoo.request('createWebRtcTransport', {
      producing: false,
      consuming: true,
      sctpCapabilities: false,
    })

    // Creates a WebRTC transport for receiving video/audio consumer streams
    // broadcast by other users.
    //
    // Note that this step merely sets up the transport. No streams are received yet.
    recvTransport = mediasoupDevice.createRecvTransport({
      id: transportInfo.id,
      iceParameters: transportInfo.iceParameters,
      iceCandidates: transportInfo.iceCandidates,
      dtlsParameters: transportInfo.dtlsParameters,
      sctpParameters: transportInfo.sctpCapabilities,
      iceServers : [],
    })

    recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      protoo.request('connectWebRtcTransport', {
        transportId: recvTransport.id,
        dtlsParameters,
      })
      .then(callback)
      .catch(errback)
    })

    // Officially join the room so we can get the initial list of users in the room.
    const { peers } = await protoo.request('join', {
      rtpCapabilities : mediasoupDevice.rtpCapabilities
    })

    for (const peer of peers) {
      peers[peer.id] = {...peer, consumers: []}
    }

    // Create producer streams for video and audio to be broadcast to other users
    enableMic()
    enableWebcam()

    sendTransport.on('connectionstatechange', (connectionState) => {
      console.debug('Connection state changed')
    })
  } catch (error) {
    console.error('_joinRoom() failed:%o', error)
    closeConnections()
  }
}
```

## 2.2 Producer example

Here is an example of creating a producer to send an audio stream.

```javascript
async function enableMic() {
  // Get the user audio stream
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  let track = stream.getAudioTracks()[0]

  // Use the transport we created to send the audio stream over.
  // This means creating a producer.
  micProducer = await sendTransport.produce({
    track,
    codecOptions: {
    opusStereo: 1,
    opusDtx: 1,
    }
  })
  micProducer.on('transportclose', () => {
    micProducer = null;
  })
}
```

## 2.3 Relevant Protoo events

The rest of the code listens for events (messages) received from the WebSocket server. The following is a brief description of some of the relevant events handled in `index.js`:

- **open**
  - This occurs when the WebSocket connection is established. This just calls the `_joinRoom` function described previously.
- **disconnected**
  - This is when the WebSocket gets disconnected unexpectedly. This seems to happen quite frequently in my testing. I'm not sure why that is, but it causes problems with the video/audio streams since the WebRTC transports get nullified when this event occurs. Is it necessary to do this?
- **request**
  - It's unclear what the difference between a request event and notification event is in Protoo. Here our request event only handles new consumers. Basically we create a new video element on the webpage when someone joins.
- **notification**
  - This event handles the following message types: `newPeer`, `peerClosed`, and `consumerClosed`.

## 2.4 Consumer example

Consumers are handled in the `request` event which looks for the `newConsumer` message.

```javascript
// The newConsumer message will contain the correct metadata for us to receive
// the incoming consumer video stream. We just need to call the consume method on
// the WebRTC receive transport.
const consumer = await recvTransport.consume({
  id,
  producerId,
  kind,
  rtpParameters,
  appData : { ...appData, peerId },
})

// Once we have the consumer stream, we can render the video stream on the webpage
let video = document.createElement('video')
video.srcObject = new MediaStream([consumer._track])
video.playsInline = true
video.width = 320
video.height = 240
video.autoplay = true
document.getElementById('other-video').appendChild(video)
```

# 3. Server implementation

The server implementation consists of two files. We'll discuss `server/server.js` first since it is mostly boilerplate. Then we will talk about `server/room.js` where most of the logic resides.

## 3.1 server.js

This file is mainly boilerplate code to set up an HTTP server that supports WebSockets. We initialize an empty ExpressJS app which may not be needed. In the official Mediasoup demo, they implement HTTP endpoints so that signaling can be performed over HTTP instead of WebSockets. But since I'm not taking that approach for Too Many Cooks, I just removed the endpoints.

The other important function is `runMediaSoupWorker` which creates a single room for users to join.

```javascript
async function run() {
  await runMediasoupWorker()
  await createAppServer()
  await runHttpServer()
  await runSocketServer()
}
```

### 3.1.1 runMediasoupWorker

The official version is able to handle multiple rooms, but the version I'm using is simplified to a single room. Technically handling multiple rooms doesn't add too much complexity.

The main idea here is to create a Mediasoup worker and associate it to a global room object. Users will then join this room via the WebSocket server which will allow the appropriate video/audio connections to be made.

```javascript
async function runMediasoupWorker() {
  mediasoupWorker = await mediasoup.createWorker({
    logLevel: 'warn',
    logTags: [],
    rtcMinPort : 40000,
    rtcMaxPort : 49999,
  })

  mediasoupWorker.on('died', () => {
    console.error(
      'Mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid
    )
    setTimeout(() => process.exit(1), 2000)
  })

  room = await Room.create({ mediasoupWorker })
  room.on('close', () => {
    console.warn('Room closed')
  })
}
```

### 3.1.2 runSocketServer

This function is also straightforward. The main idea is that we forward the connection request to the global room object to handle.

```javascript
async function runSocketServer() {
  socketServer = new protoo.WebSocketServer(httpServer, {
    maxReceivedFrameSize     : 960000, // 960 KBytes.
    maxReceivedMessageSize   : 960000,
    fragmentOutgoingMessages : true,
    fragmentationThreshold   : 960000
  })

  socketServer.on('connectionrequest', (info, accept, reject) => {
    const url = new URL(info.request.url, info.request.headers.origin)
    const peerId  = url.searchParams.get('peerId')
    if (!peerId) {
      reject(400, 'Connection request without peerId')
      return
    }

    try {
      room.handleProtooConnection({ peerId, consume: true, protooWebSocketTransport: accept() })
    } catch (error) {
      console.error('Room creation or room joining failed: %o', error)
      reject(error)
    }
  })
}
```

## 3.2 room.js

The `room.js` contains the main logic for the server. The basic idea is that the Protoo WebSocket server forwards messages between peers and Mediasoup workers. This means that Protoo can be replaced with something like Socket.io. You can also replace WebSockets with HTTP. You just need a way to get the WebRTC signaling messages to the right places.

Here is an overview of the main methods that the Room object provides:

- **close**
  - Closes the room which means no one can join and everyone is disconnected
- **handleProtooConnection**
  - Called when a WebSocket connection is started. Basically initializes the data structures needed to keep track of the new peers metadata (i.e. transports, consumers, and producers).
- **_handleRequest**
  - Helper method that listens for events and performs an action based on the incoming message: getRouterRtpCapabilities, join, createWebRtcTransport, connectWebRtcTransport, restartIce, produce, and closeProducer
- **_createConsumer**
 - Helper method for creating consumers

### 3.2.1 _handleRequest

This function handles requests sent from the peer.

This is a long function and should probably be broken up into smaller functions for each message type.

I'm only going go through the relevant request types.

#### 3.2.1a createWebRtcTransport

```javascript
case 'createWebRtcTransport': {
  // NOTE: Don't require that the peer is joined here, so the client can
  // initiate mediasoup transports and be ready when he later joins.
  const {
    producing,
    consuming,
    sctpCapabilities
  } = request.data

  const webRtcTransportOptions = {
    listenIps: [
      {
        ip: '127.0.0.1',  // Hardcoded for demo purposes. Won't work on prod.
      }
    ],
    initialAvailableOutgoingBitrate: 1000000,
    minimumAvailableOutgoingBitrate: 600000,
    maxSctpMessageSize: 262144,
    enableSctp     : Boolean(sctpCapabilities),
    numSctpStreams : (sctpCapabilities || {}).numStreams,
    appData        : { producing, consuming },
  }

  // Get WebRTC transport info on the server for signaling
  const transport = await this._mediasoupRouter.createWebRtcTransport(
    webRtcTransportOptions,
  )

  transport.on('sctpstatechange', (sctpState) => {
    console.debug('WebRtcTransport "sctpstatechange" event [sctpState:%s]', sctpState)
  })

  transport.on('dtlsstatechange', (dtlsState) => {
    if (dtlsState === 'failed' || dtlsState === 'closed') {
      console.warn('WebRtcTransport "dtlsstatechange" event [dtlsState:%s]', dtlsState)
    }
  })

  // Store the WebRRC transport into the protoo Peer data Object.
  peer.data.transports.set(transport.id, transport)

  // Send WebRTC transport metadata so the peer knows how to connect
  // I believe this is the initial WebRTC offer?
  accept({
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
    sctpParameters: transport.sctpParameters,
  })
  break
}
```

#### 3.2.1b connectWebRtcTransport

The part handles the WebRTC answer. Basically the peer sends their WebRTC info to the SFU server.

This needs to be done after a WebRTC transport has been created on the server.

```
case 'connectWebRtcTransport': {
  const { transportId, dtlsParameters } = request.data
  const transport = peer.data.transports.get(transportId)
  if (!transport) {
    throw new Error(`transport with id "${transportId}" not found`)
  }
  await transport.connect({ dtlsParameters })
  accept()
  break
}
```

#### 3.2.1c produce

This event is processed when a peer produces a video or audio stream. This information is sent to the server, so the streams can be sent to consumers.

```javascript
case 'produce': {
  // Ensure the peer is joined.
  if (!peer.data.joined) {
    throw new Error('Peer not yet joined')
  }

  const { transportId, kind, rtpParameters } = request.data
  let { appData } = request.data
  const transport = peer.data.transports.get(transportId)

  if (!transport) {
    throw new Error(`transport with id "${transportId}" not found`)
  }

  // Add peerId into appData which we can use later for connecting the
  // stream to specific players in the game.
  appData = { ...appData, peerId: peer.id }

  // Create a producer from the metadata sent by the peer
  const producer = await transport.produce({
    kind,
    rtpParameters,
    appData,
  })

  // Store the producer into the Protoo peer data Object.
  peer.data.producers.set(producer.id, producer)

  accept({ id: producer.id })

  // Optimization: Create a server-side Consumer for each peer.
  for (const otherPeer of this._getJoinedPeers({ excludePeer: peer })) {
    this._createConsumer({
      consumerPeer : otherPeer,
      producerPeer : peer,
      producer,
    })
  }
}
```

### 3.2.2 _createConsumer

```javascript
async _createConsumer({ consumerPeer, producerPeer, producer }) {

  // Get peer's transport for consuming data
  const transport = Array.from(consumerPeer.data.transports.values())
    .find((t) => t.appData.consuming)

  if (!transport) {
    console.warn('_createConsumer() | Transport for consuming not found')
    return
  }

  let consumer

  // Add producer stream to be consumed by peer
  try {
    consumer = await transport.consume({
      producerId: producer.id,
      rtpCapabilities: consumerPeer.data.rtpCapabilities,
      paused: false
    })
  } catch (error) {
    console.warn('_createConsumer() | transport.consume():%o', error)
    return
  }

  // Bookkeeping to track and manage consumer object
  consumerPeer.data.consumers.set(consumer.id, consumer)
  consumer.on('transportclose', () => {
    consumerPeer.data.consumers.delete(consumer.id)
  })

  consumer.on('producerclose', () => {
    consumerPeer.data.consumers.delete(consumer.id)
    consumerPeer.notify('consumerClosed', { consumerId: consumer.id }).catch(() => {})
  })

  // Send consumer metadata to remote peer
  try {
    await consumerPeer.request('newConsumer', {
      peerId: producerPeer.id,
      producerId: producer.id,
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
      appData: producer.appData,
    })
  } catch (error) {
    console.warn('_createConsumer() | failed:%o', error)
  }
}
```
# 4. Repositories

The Simple Soup Github repository can be found here:

- [https://github.com/richard-to/simple-soup](https://github.com/richard-to/simple-soup)


The Too Many Cooks Github repository can be found here:

- [https://github.com/richard-to/too-many-cooks](https://github.com/richard-to/too-many-cooks)
