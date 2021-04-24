---
layout: post
title: "Too Many Cooks - Part 2: Phaser 3, Geckos.io, WebRTC"
---

I had the idea for making Too Many Cooks almost two years ago. I lost interest in the project. But my recent interest in WebRTC has made me decide to return to Too Many Cooks.

This time, instead of using Firebase, I plan to implement the multiplayer mechanics using WebRTC. In addition, I am planning to integrate audio/video player avatars which I will discuss more in my next post.

This post will cover how I integrated phaser 3 and WebRTC to create a multiplayer game (technically just a demo for now).

## Demo

Here is a link to the [non-multiplayer demo](/projects/too-many-cooks/demo-2/index.html) I created to refresh my memory on using Phaser 3.

**Controls:**

- Move with the arrow keys
- Up arrow key to jump
- Spacebar to get items from the item boxes
- Spacebar to throw items
- Spacebar to to pick up items on the ground
- Make hamburgers by pressing "x" while holding an item next to another item.
  - If you are holding a tomato next to the hamburger bun, you can press "x" to create a tomato burger.
  - Not all combinations work. You cannot hold a tomato burger next to the lettuce. You have to be holding the lettuce next to the tomato burger to create the lettuce tomato burger.

![Too Many Cooks gameplay](/images/too-many-cooks/p2-gameplay.png)

## Geckos.io

When researching how to create multiplayer networked games on Phaser 3, I came across a library called [Geckos.io](https://github.com/geckosio/geckos.io). It was almost exactly what I was looking for (does not support video/audio).

Geckos.io is a WebRTC backend server that handles data channel connections between multiple clients. It can be thought as something like socket.io, but instead of using WebSockets over TCP, it uses WebRTC over UDP.

UDP is useful for multiplayer games since we need low latency. Otherwise a fast paced game with a lot of players could end up being too choppy to play. UDP has better performance over TCP since the latter needs to ensure all packets arrive whereas UDP is OK with dropped packets.

## Headless Phaser 3

Geckos.io can be combined with Phaser 3 in headless mode. Phaser 3 will run in headless mode on the backend node server. This approach centralizes the game logic on the server to prevent cheating.

The clients will also run Phaser 3. But the code in the browser will only have two main responsibilities:

1. Render the current game state on the server
2. Send user input to the server to be processed

Geckos.io will be responsible for sending inputs to the server and returning the current game state when it is updated.

For Too Many Cooks, I am hoping the game will be simple enough that a basic client/server approach works. There are optimizations, such as client-side prediction and lag compensation which are described in this article called [Latency Compensating Methods in Client/Server In-game Protocol Design and Optimization](https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization#Lag_Compensation) by an SDE at Valve in 2001.

## Backend server

The backend server in Too Many Cooks uses phaser, geckos.io, and express.

### Express + Geckos.io

Express has the following responsibilities:

- Serves game via index.html
- Serves static game assets (sprite sheets, tiled maps, etc)
- Serves endpoint to load the initial game state at `/getState`
- WebRTC signaling endpoints via geckos.io

The last responsibility is interesting since most tutorials I have seen for WebRTC, suggest using WebSockets for signaling, so it is interesting that geckos.io does this using HTTP requests only.

I believe the reason for this is for latency reasons. Having both a WebRTC and WebSocket connection is a bit unnecessary, especially when the WebSockets would only be used for the initial signaling steps.

In order to make this approach work, it seems like it is required that the backend server send the initial offer. Technically, the client will need to send a request to the backend server which will then respond with an offer. The client can then send their answer by posting another HTTP request. The ice candidate exchanges will also work in a similar fashion where client sends HTTP requests.

General flow:

- Client sends a request to `/connections` to get an offer and a connection ID from the server
- Client generates an answer from the offer and sends a request to `/connections/{connection-id}/remote-description`
- Ice candidates are processed by sending requests to `/connections/{connection-id}/additional-candidates`

### Phaser + Geckos.io

Adding geckos.io to the backend to integrate with phaser and express is straightforward. There is a nice [multiplayer game demo](https://github.com/geckosio/phaser3-multiplayer-game-example) that that the creator of geckos.io created which I was able to modify to work with Too Many Cooks.

In `game.js`, we can extend Phaser.Game to include an option to pass in an HTTP server.

```javascript
// server/game.js
class PhaserGame extends Phaser.Game {
  constructor(server) {
    super(config)
    this.server = server
  }
}

// server/server.js
const app = express()
const server = http.createServer(app)
const game = new PhaserGame(server)

// other code...
```

Then when we initialize the first Scene in phaser we can create an instance of geckos.io and set it up to use our HTTP server.

```javascript
class GameScene extends Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.entityID = 1
  }

  init() {
    this.io = geckos({
      iceServers: [],
    })
    this.io.addServer(this.game.server)
  }

  // More code
}
```

We can now use geckos.io to send and receive messages to connected clients.

When a client connects to the server, geckos.io will trigger an `onConnection` event. This event also sets up other events, such as `onDisconnect`, `getID`, `playerMove`, and `addPlayer`.

When a client joins the game, they will emit a `getID` event. This will be followed by an `addPlayer` event.

The `playerMove` listens for player input.

The `onDisconnect` event handles the scenario when a player loses its WebRTC connection. In this case, the server will emit a `removePlayer` event to notify clients that player is no longer in the game.

```javascript
this.io.onConnection((channel) => {
  channel.onDisconnect(() => {
    console.log('Disconnect user ' + channel.id)
    let disconnectedPlayer = null
    this.playersGroup.children.each((player) => {
      if (player.entityID === channel.entityID) {
        disconnectedPlayer = player
      }
    })
    if (disconnectedPlayer) {
      this.playersGroup.remove(disconnectedPlayer)
      disconnectedPlayer.removeEvents()
      disconnectedPlayer.destroy()
    }
    channel.room.emit('removePlayer', channel.entityID)
  })

  channel.on('getID', () => {
    channel.entityID = this.getID()
    channel.emit('getID', channel.entityID.toString(Settings.RADIX))
  })

  channel.on('playerMove', (data) => {
    this.playersGroup.children.iterate((player) => {
      if (player.entityID === channel.entityID) {
        player.setMove(data)
      }
    })
  })

  channel.on('addPlayer', () => {
    this.playersGroup.add(
      new Player(
        this,
        channel.entityID,
        sample(PlayerPrefix),
        Phaser.Math.RND.integerInRange(0, Settings.LEVEL_WIDTH),
      )
    )
  })

  channel.emit('ready')
})
```

When sending back the game state, we could use JSON, which is very readable, but to minimize the data that we are sending, we can use a custom data format.

The `prepareToSync` function takes an entity and creates a comma separated string of the state necessary to render a sprite on the client.

The properties are as follows:

- Sprite ID
- Entity ID
- Player prefix (g, b, or empty string)
- x position of sprite in game
- y position of sprite in game
- flipX is the vertical orientation of the sprite (true/false converted to 1/0)
- flipY is the horizontal orientation of the sprite (true/false converted to 1/0)
- angle of the sprite
- anim is whether the sprite is an animated state (true/false converted to 1/0)

```javascript
prepareToSync(e) {
  const x = Math.round(e.x).toString(Settings.RADIX)
  const y = Math.round(e.y).toString(Settings.RADIX)
  return `${e.type},${e.entityID},${e.prefix},${x},${y},${e.flipX ? 1:0},${e.flipY ? 1:0},${e.angle},${e.anim ? 1:0},`
}
```

Example output for 1 entity:

```
1,1,b,122.22,90.14,1,0,90,1,
```

Example output for 2 entities:

```
1,1,b,122.22,90.14,1,0,90,1,1,2,g,56.1,88.32,0,0,20,1,
```

## Frontend client

### Geckos.io integration

Integrating the geckos.io client on the frontend is similar to the backend approach.

On the frontend, we establish a connection in the BootScene. Once we establish a WebRTC connection with the server, we will transition to the actual game.

```javascript
export class BootScene extends Scene {
  constructor() {
    super({ key: 'BootScene' })

    const channel = geckos({ port: Settings.SERVER_PORT })

    channel.onConnect(error => {
      if (error) {
        console.error(error.message)
      }

      channel.on('ready', () => {
        this.scene.start('GameScene', { channel: channel })
      })
    })
  }
}
```

On the client we listen for the following events:

- **getID**
  - Need to get an entity ID from the server so we can track the client's avatar
- **removePlayer**
  - If a player is removed from the game we need to remove them from the entity list
  - This also includes non-player sprites, such as the food items
- **updateEntities**
  - Updates the game state

 On the client we send the following events:

- **getID**
  - Ask to be assigned an entity ID
- **addPlayer**
  - Once we are assigned an ID, we can be added to the game
- **playerMove**
  - Sends player input to the server

### Updating game state

In order to update the game state we need to process the comma separated string of entity properties.

We parse the the game state data in the `parsedUpdates` function. Every time we change the format we need to update this function. For example if we add a new parameter or swap the order.

The algorithm to process the string is follows:

- Split the string in parts using a comma as the separator
- There will be a trailing comma so we will need to exclude that from processing
- If we have nine properties per entity, that means we will have 27 items in the array if we have three entities in the game.
- Knowing that each entity has the same number of properties, we can then loop through the array to update the state of our entities
- For each entity, we will need to convert each property to the right data type.

```javascript
const parseUpdates = updates => {
  if (!updates) {
    return []
  }

  const numParams = 9

  // parse
  const updateParts = updates.split(',')
  updateParts.pop() // Handle trailing comma
  const parsedUpdates = []

  const n = updateParts.length
  if (n % numParams !== 0) {
    return []
  }

  for (let i = 0; i < n;) {
    parsedUpdates.push({
      spriteType: parseInt(updateParts[i++]),
      entityID: updateParts[i++],
      prefix: updateParts[i++],
      x: parseInt(updateParts[i++], Settings.RADIX),
      y: parseInt(updateParts[i++], Settings.RADIX),
      flipX: updateParts[i++] === "1" ? true : false,
      flipY: updateParts[i++] === "1" ? true : false,
      angle: parseInt(updateParts[i++]),
      anim: updateParts[i++] === "1" ? true : false,
    })
  }
  return parsedUpdates
}
```

### Sending player input

Similar to game state updates, we want to minimize the data we send to and from the server. So instead of JSON, we once again rely on a custom data format which is more compact.

In this case we send a number that encodes a player's inputs. Examples:

- Left -> 1
- Up -> 4
- Left + Up -> 5
- Spacebar -> 8
- Left + Spacebar -> 9
- Left + Up + Spacebar -> 13

This encoding is basically how Linux encodes file permissions. Examples:

- Execute -> 1
- Write -> 2
- Read -> 4
- Execute + Write -> 3
- Read + Write -> 6
- Execute + Read + Write -> 7

```javascript
export default class Cursors {
  constructor(scene, channel) {
    this.channel = channel
    this.cursors = scene.input.keyboard.createCursorKeys()
    this.space = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.xKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X)
    scene.events.on('update', this.update, this)
  }

  update() {
    let move = {
      left: false,
      right: false,
      up: false,
      space: false,
      x: false,
      none: true,
    }

    if (this.cursors.left.isDown) {
      move.left = true
      move.none = false
    } else if (this.cursors.right.isDown) {
      move.right = true
      move.none = false
    }

    if (this.cursors.up.isDown) {
      move.up = true
      move.none = false
    }

    if (Phaser.Input.Keyboard.JustDown(this.space)) {
      move.space = true
    } else {
      move.space = false
    }

    if (Phaser.Input.Keyboard.JustDown(this.xKey)) {
      move.x = true
    } else {
      move.x = false
    }

    if (
      move.left ||
      move.right ||
      move.up ||
      move.space !== this.prevSpace ||
      move.x !== this.prevX ||
      move.none !== this.prevNoMovement
    ) {
      let total = 0
      if (move.left) total += 1
      if (move.right) total += 2
      if (move.up) total += 4
      if (move.space) total += 8
      if (move.x) total += 16
      let str36 = total.toString(Settings.RADIX)

      this.channel.emit('playerMove', str36)
    }
    this.prevSpace = move.space
    this.prevX = move.x
    this.prevNoMovement = move.none
  }
}
```

## Repository

The Github repository can be found here:

- [https://github.com/richard-to/too-many-cooks](https://github.com/richard-to/too-many-cooks)
