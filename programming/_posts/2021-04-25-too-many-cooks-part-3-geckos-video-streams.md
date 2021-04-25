---
layout: post
title: "Too Many Cooks - Part 3: Integrating video into geckos.io"
---

One of the main features in Too Many Cooks will be the use of video stream avatars for each player instead of a sprite.

It turns out that geckos.io currently only supports data channels. This makes sense since the use cases for audio/video streaming are limited for multiplayer games. In addition it adds more latency which could make games unplayable.

This post walks through how I integrated video streaming into Too Many Cooks by modifying geckos.io. Once I get the code to a more stable point, I will see if I can get audio/video streaming into the main geckos.io repository if the creator is interested.

Here is a screenshot of the video stream avatar. Note that the video is black due to my webcam cover.

![Video stream gameplay](/images/too-many-cooks/p3-gameplay.png)

## SFU approach

Unlike the poker game where I used a full-mesh topology where each player sends their video stream to every other player, Too Many Cooks will take the SFU (selective forwarding unit) approach. Basically this means each client will connect to the WebRTC backend server, which will route the video streams of all connected clients to every other client.

This is slightly more performant than full-mesh topology since the client only needs to send their stream to the server. The clients will still need to download the same number of streams though.

One drawback of this approach is that bandwidth costs get shuffled to the backend server, which means it would cost more to run the server.

![Basic SFU diagram](/images/too-many-cooks/p3-sfu.png)

## Routing video streams

There are two things we need to do in order to correctly route the streams:

1. Need to renegotiate the WebRTC connection when a new stream is added, otherwise the clients will not know about the new stream
2. Need to make sure the client knows which stream belongs to which client

### Renegotiating WebRTC connections

At a high level, renegotiating a WebRTC connection amounts to sending a new offer to the client. This makes it so new streams will be recognized and the `ontrack` event will be triggered.

In depth resources on this process:

- [Perfect negotiation in WebRTC](https://blog.mozilla.org/webrtc/perfect-negotiation-in-webrtc/)
- [Perfect negotiation example](https://w3c.github.io/webrtc-pc/#perfect-negotiation-example)

I did not implement the robust negotiation flows described in those two articles. I used the fact that in geckos.io we will always send an offer from the server. This makes it so we do not have to worry about polite and impolite peers. I guess technically we could call the server the impolite peer and the client the polite peer.

In the geckos.io server code we can reuse the `doOffer` method.

```typescript
// packages/server/src/wrtc/webrtcConnection.ts


/**
 * Reconnect renegotiates the WebRTC connection so we can retrieve updated video/audio tracks
 * as new clients join.
 *
 * Renegotiating a connection requires sending a new offer which should be done by the server
 * since the signal workflow uses HTTP requests and not WebSockets. This means that the server
 * wouldn't be able to send requests to the client. The client must send the HTTP requests.
 */
async reconnect() {
  await this.doOffer()
}
```

One question you may have is how do we know when to reconnect? In terms of a multiplayer game we can tell when we need to renegotiate the WebRTC connection whenever a new player joins the game. We know we will need to add their video stream.

The reason we need to do it this way is because we do not have a WebSocket connection (geckos.io performs signaling using HTTP). Otherwise the server could send an offer through the WebSocket. Technically it seems like it could be possible to send the signaling data across the data channel of the WebRTC connection, but that seems like an anti-pattern.

In order to trigger a new offer from the server, we need to send an HTTP request much like we could do when establishing the initial WebRTC connection. Then the flow is basically the same except we send a request to a new reconnect endpoint.

General flow:

- Client sends a request to `/connections/{connection-id}/reconnect` to get a new offer from the server
- Client generates an answer from the offer and sends a request to `/connections/{connection-id}/remote-description`
- Ice candidates are processed by sending requests to `/connections/{connection-id}/additional-candidates`

Add a new endpoint:

```typescript
// packages/server/src/httpServer/httpServer.ts


// Endpoint for renegotiating a WebRTC connection so we can retrieve updated video/audio tracks
// as new clients join. We need to hit this endpoint since we want the server to send the initial
// offer.
const reconnectPath = new RegExp(`${prefix}\/${version}\/connections\/[0-9a-zA-Z]+\/reconnect`).test(pathname)
```

Code to send a new offer:

```typescript
// packages/server/src/httpServer/httpServer.ts

} else if (method === 'POST' && reconnectPath) {
  const ids = pathname.match(/[0-9a-zA-Z]{24}/g)
  if (ids && ids.length === 1) {
    const id = ids[0]
    const connection = connectionsManager.getConnection(id)

    if (!connection) {
      end(res, 404)
      return
    }

    try {
      await connection.reconnect()
      let connectionJSON = connection.toJSON()
      res.write(JSON.stringify(connectionJSON))
      res.end()
      return
    } catch (error) {
      console.error(error.message)
      end(res, 400)
      return
    }
  } else {
    end(res, 400)
    return
  }
}
```

### Routing video streams

In order to correctly route the video streams we need to be able to match a client with their video stream.

The important thing to know is that track ID will not be the same on the client and the server.

We will need to use a property named `mid`. This is the negotiated media ID apparently. This will be the same between the client and the server and allow us to map tracks to the correct players in Too Many Cooks.

One thing we need to know about this is that the mid needs to be negotiated so it will not be properly set until that negotiation is complete. This depends on the renegotiation process described in the previous section.

I took the simplest approach for routing the streams. The server keeps a map of streams and connections for each client. This needs to be done since each client will have a copy of each stream.

When a client joins the game, the server will add the streams of all currently connected clients to the new client's connection/stream map. Then the client will add their stream to all existing client connections.

![Connection stream map diagram](/images/too-many-cooks/p3-stream-map.png)

Key points from the diagram:

- Each connection has their own map of streams
- Each transceiver has a different ID but we reuse the streams
- The map key is the client connection ID
- We store the transceiver since the mid will be null when setting up the map

```typescript
// packages/server/src/wrtc/webrtcConnection.ts


/**
   * Setup audio/video streams
   *
   * The server is connected to multiple clients. The server will
   * forward audio/video streams to all connected clients.
   *
   * The server also needs to ensure that each client knows which
   * track belongs to which client.
   *
   * The track id cannot be used because that will not be the same on
   * on the server and client.
   *
   * The track's mid will be the same on the server and client, so we
   * will use that.
   *
   * The track's mid does not get generated when calling addTransceiver. This
   * is why we store the transceiver and not just the mid
   *
   * @param enableAudio Enables audio streams
   * @param enableVideo Enables video streams
   */
setupStreams(enableAudio: boolean, enableVideo: boolean) {
  if (enableVideo) {
    if (!this.video) {
      // Video track that we will forward to other tracks
      this.video = this.peerConnection.addTransceiver('video')
    }

    this.connections.forEach((theirConnection) => {
      // Send my video to their client
      const theirVideo = theirConnection.peerConnection.addTransceiver('video')
      theirVideo.sender.replaceTrack(this.video.receiver.track)
      theirConnection.videoMap.set(this.id, theirVideo)
      // Send their video to my client
      const myVideo = this.peerConnection.addTransceiver('video')
      myVideo.sender.replaceTrack(theirConnection.video.receiver.track)
      if (myVideo.sender.track) {
        this.videoMap.set(theirConnection.id, myVideo)
      }
    })
  }

  if (enableAudio) {
    if (!this.audio) {
      // Audio track that we will forward to other tracks
      this.audio = this.peerConnection.addTransceiver('audio')
    }

    this.connections.forEach((theirConnection) => {
      // Send my audio to their client
      const theirAudio = theirConnection.peerConnection.addTransceiver('audio')
      theirAudio.sender.replaceTrack(this.audio.receiver.track)
      theirConnection.audioMap.set(this.id, theirAudio)

      // Send their audio to my client
      const myAudio = this.peerConnection.addTransceiver('audio')
      myAudio.sender.replaceTrack(theirConnection.audio.receiver.track)
      if (myAudio.sender.track) {
        this.audioMap.set(theirConnection.id, myAudio)
      }
    })
  }
}
```

Once we have established the map of streams for each client connection we need a way for the client to retrieve the updated map.

Once again we use the HTTP approach since we are not using WebSockets.

I considered using the WebRTC data channel, but it seemed better to use the HTTP approach since it allows us to get the map data in a synchronous way using async/await. With WebRTC, we'd have to let the server push the updates which may not be in sync with the `ontrack` events. Remember we need to wait until the `mid` has been negotiated.

We will add the following endpoint: `/connections/{connection-id}/streams`.

```typescript
// packages/server/src/httpServer/httpServer.ts

// Endpoint for retrieving a map of audio/video streams by client connection ID
//
// This map is necessary since the server is forwarding audio/video from connected clients to the local
// client. This means that we need a way to distinguish which audio/video streams belong to which client.
//
// This can be done using the track's mid which we can map to the channel's ID
const streamsPath = new RegExp(`${prefix}\/${version}\/connections\/[0-9a-zA-Z]+\/streams`).test(pathname)
```

This endpoint will return a map of mids to client connection IDs for both audio/video streams.

```json
{
    "audio": {
        "1": "1",
        "3": "3"
    },
    "video": {
        "4": "1",
        "6": "3"
    }
}
```

Code implementation:

```typescript
} else if (method === 'POST' && streamsPath) {
  const ids = pathname.match(/[0-9a-zA-Z]{24}/g)
  if (ids && ids.length === 1) {
    const id = ids[0]
    const myConnection = connectionsManager.getConnection(id)

    if (!myConnection) {
      end(res, 404)
      return
    }

    try {
      const videoMap = new Map()
      const audioMap = new Map()

      myConnection.videoMap.forEach((transceiver, channelId) => {
        videoMap.set(transceiver.mid, channelId)
      })

      myConnection.audioMap.forEach((transceiver, channelId) => {
        audioMap.set(transceiver.mid, channelId)
      })

      res.write(JSON.stringify({
        audio: Object.fromEntries(audioMap),
        video: Object.fromEntries(videoMap),
      }))
      res.end()
    } catch (error) {
      console.error(error.message)
      end(res, 400)
      return
    }
  }
}
```

### Geckos.io client changes

The changes in the previous sections were changes to the geckos.io server code. We also need to make a few changes to the geckos.io client as well.

In the connect method the client needs to send our audio/video tracks to the WebRTC server.

```typescript
// packages/client/src/wrtc/connectionsManager.ts

// Only add audio/video tracks if stream has been provided
if (this.stream) {
  this.stream.getTracks().forEach(track => (
    this.localPeerConnection.addTrack(track, this.stream as MediaStream)))
}
```

We also need to listen to the `ontrack` event:

```typescript
// packages/client/src/wrtc/connectionsManager.ts

this.localPeerConnection.addEventListener('track', this.onTrack)
```

Our callback will forward to other listeners using the event emitter bridge. This makes it so we do not have to pass in a custom callback to the connection manager.

```typescript
// packages/client/src/wrtc/connectionsManager.ts

onTrack = (ev: RTCTrackEvent) => {
  // Forward ontrack event to listeners as AddTrack event
  this.bridge.emit(EVENTS.ADD_TRACK, ev)
}
```

## Phaser 3 integration

Integrating video with phaser 3 is relatively straightforward. The following steps are needed:

1. Optimize video streams
2. Render video sprites
3. Match video streams to player entities

### Optimize video streams

One limitation of the MediaStream from getUserMedia is that you cannot alter the resolution of the video.

This is problematic for two reasons:

1. The video avatars need to be a specific size (tentatively 140px by 190px)
2. The video avatars will be a lower resolution so it makes no sense to stream in 720p for example

The workaround is to crop and resize the MediaStream using a canvas. This is a trick I learned many years ago (I think 2014).

We can then pass this modified stream into geckos.io to use as our MediaStream which will use less bandwidth and also be the correct dimensions.

In this snippet, we initialize the geckos.io client connection and our video stream in the BootScene.

```javascript
constructor() {
  super({
    key: 'BootScene'
  })

  const initGeckosServer = async () => {
    const stream = await window.navigator.mediaDevices.getUserMedia({
      audio: Settings.ENABLE_AUDIO,
      video: Settings.ENABLE_VIDEO,
    })

    const channel = geckos({
      port: Settings.SERVER_PORT,
      stream: this.makeOptimizedStream(stream),
    })

    channel.onConnect(error => {
      if (error) {
        console.error(error.message)
      }
      channel.on('ready', () => {
        this.scene.start('GameScene', {
          channel
        })
      })
    })
  }
  initGeckosServer()
}
```

The `makeOptimizedStream` method is where the video stream to canvas logic occurs.

Key points:

- Create a canvas element to store video stream frames
- Crop and resize the frames to the canvas
- In order for the video to update, need to keep calling `requestAnimationFrame`
- The canvas element has a `captureStream` method that returns a MediaStream object
- Need to add our audio track to the canvas MediaStream object
- This MediaStream can then be passed into geckos.io
- If we wanted to do more complicated pre-processing of the video stream we could add another canvas object and perform pixel manipulations, such as grayscale conversion

```javascript
  /**
   * Makes an optimized stream to send to the WebRTC server
   *
   * The player's local media stream cannot be modified. This means that we will
   * receive video with a set resolution. This does not work for our player sprite
   * since the dimensions (width/height) will be different both in size and resolution.
   *
   * In addition we do not want to waste bandwidth since it's critical for performance.
   *
   * In order to optimize the player's video stream, we can save it to a canvas and
   * use the cropped stream from the canvas.
   *
   * @param {MediaStream} stream
   *
   * @returns {MediaStream}
   */
  makeOptimizedStream(stream) {
    // Create a video element to hold the stream that we will pass to the canvas
    const playerVideo = document.createElement("video")
    playerVideo.playsInline = true
    playerVideo.srcObject = stream
    playerVideo.width = stream.getVideoTracks()[0].getSettings().width
    playerVideo.height = stream.getVideoTracks()[0].getSettings().height
    playerVideo.autoplay = true

    // Canvas to hold our optimized and cropped stream
    const playerCanvas = document.createElement('canvas')
    playerCanvas.width = Settings.PLAYER_WIDTH
    playerCanvas.height = Settings.PLAYER_HEIGHT
    const playerCtx = playerCanvas.getContext('2d')

    // Crops and resizes our video stream to the canvas
    const resizeCropVideo = () => {
      playerCtx.drawImage(
        playerVideo,
        // Try to crop near the center of the video
        // TODO: This strategy may not work well if the video's dimensions are too small
        (stream.getVideoTracks()[0].getSettings().width / 2) - Settings.PLAYER_WIDTH,
        (stream.getVideoTracks()[0].getSettings().height / 2) - Settings.PLAYER_HEIGHT,
        // Using double the player size since it worked better during initial testing
        Settings.PLAYER_WIDTH * 2,
        Settings.PLAYER_HEIGHT * 2,
        // Position video frames on canvas
        0,
        0,
        Settings.PLAYER_WIDTH,
        Settings.PLAYER_HEIGHT,
      )
      // Need to keep updating the canvas with new frames
      requestAnimationFrame(resizeCropVideo)
    }
    resizeCropVideo()

    // Add audio tracks to the our optimized media stream
    const optimizedMediaStream = playerCanvas.captureStream()
    const audioTracks = stream.getAudioTracks()
    audioTracks.forEach(track => optimizedMediaStream.addTrack(track))

    return optimizedMediaStream
  }
}
```

### Render video sprites

Rendering the video sprites in phaser is straightforward since they have a GameObject that supports video.

Basically all we need to do is extend the GameObjects.Video class. Then we add a method called `setStream` since the video streams will be added shortly after the entity has been created. This means that the video will initially be a black box.

```javascript
/**
 * VideoPlayer is a sub-component of the Player container
 */
export class PlayerVideo extends Phaser.GameObjects.Video {
  constructor(scene, entityID, x, y) {
    super(scene, x, y, `PlayerVideo${entityID}`)
    this.type = SpriteType.PlayerVideo
    this.entityID = entityID
    scene.add.existing(this)
  }

  /**
   * Set the player's video stream
   *
   * @param {MediaStream} stream
   */
  setStream(stream) {
    this.video = document.createElement('video')
    this.video.playsInline = true
    this.video.srcObject = stream
    this.video.width = Settings.PLAYER_WIDTH
    this.video.height = Settings.PLAYER_HEIGHT
    this.video.autoplay = true
    return this
  }
}
```

### Match video streams to player entities

To match a video stream to a player entity we need to know the following:

1. when new video streams are added
2. which stream to add to which entity ID (different from connection ID)

We know when new streams are added by listening to the `ontrack` event that my modified version of geckos.io forwards via an event named `addTrack`.

The only thing to notice here is we wait one second before updating the player streams. The reason is that the mid on the server may not yet be set when the `ontrack` event fires for the client.

```javascript
this.channel.on('addTrack', async () => {
  // - Listen for add track event which is forwarded by the channel
  // - Since this event listener is added after connection, we will miss the first few events, which is OK
  //   since we call this.updatePlayerStreams() during initialization

  // We wait 0.5 seconds before updating the player streams since there seems to be a small delay between when
  // the ontrack event is triggered and when the connection/stream map is updated on the server.
  await new Promise(resolve => setTimeout(resolve, 1000))
  this.updatePlayerStreams()
})
```

This `ontrack` event does not fire for the initial tracks. This is because we are not able to listen to the `ontrack` event until we establish the initial WebRTC connection (this is not a limitation with WebRTC or geckos.io, but a limitation with how we set up the WebRTC connection using the BootScene). So in this scenario we can simply call `updatePlayerStreams` when we first make a connection to the WebRTC server.

The `updatePlayerStreams` method works like this:

- Send an HTTP request to the streams endpoint
- Check our WebRTC client connection (aka channel in geckos.io terms) for tracks
- For each track, use the mid to look up the corresponding connection ID
- With the connection ID, look up the entity ID
- With the entity ID, look up the entity
- With the entity, add the video stream

```javascript
async updatePlayerStreams() {
  // TODO: Handle audio tracks
  try {
    // Get a mapping of tracks to channels so we know which player to associate audio/video to
    let res = await axios.post(`${this.serverURL}/.wrtc/v1/connections/${this.channel.id}/streams`)

    // Loop through the audio/video tracks the client is receiving and try to match it up with
    // the channel mapping
    this.channel.tracks.forEach(transceiver => {
      // Sometimes the audio/video track may not exist yet or we're looping through our own tracks
      if (!has(res.data.video, transceiver.mid)) {
        return
      }

      const channelID = res.data.video[transceiver.mid].toString()
      if (!has(this.channelEntityMap, channelID)) {
        console.debug(`Channel ID ${channelID} not found in channelEntityMap`)
        return
      }

      const entityID = this.channelEntityMap[channelID]
      if (!has(this.entities, entityID)) {
        console.debug(`Entity ID ${entityID} not found in entities`)
        return
      }

      // We're using the player's local video stream so don't need to use the incoming stream
      if (entityID === this.playerID) {
        return
      }

      // Only add a stream if the entity is not already connected to video
      if (!this.entities[entityID].sprite.video) {
        this.entities[entityID].sprite.setStream(new MediaStream([transceiver.receiver.track]))
      }
    })
  } catch (error) {
    console.error(error)
  }
}
```

## Repository

The Too Many Cooks Github repository can be found here:

- [https://github.com/richard-to/too-many-cooks](https://github.com/richard-to/too-many-cooks)

The geckos.io fork can be found here (see with-streams branch):

- [https://github.com/richard-to/geckos.io](https://github.com/richardo-to/geckos.io)
