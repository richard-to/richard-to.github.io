---
layout: post
title: "WebRTC Poker Game - Part 5: WebSockets"
---

WebSockets are an integral aspect of the poker game. They provide the following functionality:

1. The whole WebRTC signaling dance (SDP and ICE candidate exchanges)
2. Provides responsive game state updates to and from the game server

This post focuses on point 2. Part 6 in this series will cover the WebRTC integration.

## Overview

Poker is a turn based game which makes WebSockets a good candidate for creating a realtime
multiple player game that runs smoothly.

For this poker game, a central server will store game state and process player actions which
will be routed to/from the player's browser (client).

The client will be responsible for the following:

- sending player input (bet, raises, chat messages, etc) to the game server.
- rendering the updated game state

The client is designed to perform minimal logic. One reason is that this prevents
cheating since the central server performs all the game logic and input validation which
enforces an authoritative state.

This is a nice simple model. That works well for a game like poker. WebSockets, however, would not
be a good choice for a fast paced FPS game since WebSockets uses TCP which provides reliable
packet transfer. Dropped packets must be resent.

A browser based FPS game would require UDP over WebRTC. This would still require a central server
to prevent cheating. But the server would run the WebRTC protocol. All client connections would
connect to the central server via WebRTC instead of WebSockets (though the latter would still
be needed for signaling). Even with UDP, an FPS would need to account for lag since accuracy
is very important in this type game, so further optimizations would need to be made.

Thankfully in poker, we don't have to worry about those issues.

![Client server diagram](/images/poker-game/client-server.png)

## Server

The game server is built with Go using Gin-Gonic and Gorilla WebSocket.

The server has two main aspects:

- General WebSocket management
  - Keeping track of connected/disconnected client transactions
  - Sending events (messages) to clients
- Processing incoming events to update the state of the poker game

### General WebSocket management

This is mostly handled by Gorilla WebSocket. There is also some associated boilerplate code that
needs to be written.

I based my code off the [chat example](https://github.com/gorilla/websocket/tree/master/examples/chat)
provided by Gorilla WebSocket.

One change that was critical and easy to miss was the `maxMessageSize` value. Since the game state of the
poker game is basically a big JSON message, I was running into errors with the server. Unfortunately I
forgot to jot down the specific error, so I cannot provide any specifics. But the solution was to increase
the default of 512 bytes set in the example to 8192 bytes.

Some other adjustments:

- Added some game specific fields to the Client struct, such as a GameState object which will be discussed
  in the next section
- In the Hub struct, I changed the channel data type from []byte to BroadcastEvent which contains a structured
  message that will be converted to JSON.
- JSON message conversions

Overall I aimed to keep the game logic mostly out of the client.go and hub.go files unless necessary.

### GameState or the game engine

The game engine processes incoming events, updates the game state, and then broadcasts that new state
to the clients to render.

Messages sent to and from the server are in JSON format. This is how the events are represented on the
server.

```go
// BroadcastEvent is an event that is broadcasted to multiple clients.
//
// There are cases where we don't want to broadcast to everyone. In this scenario
// the exclude clients map can be used. This will prevent messages from being sent
// to the specified client ID
type BroadcastEvent struct {
	Event          Event
	ExcludeClients map[string]bool
}

// Event is a JSON message in the game loop.
type Event struct {
	Action string                 `json:"action"`
	Params map[string]interface{} `json:"params"`
}
```

The server can respond to the following events.

```go
// General actions
const actionDisconnect string = "disconnect"
const actionError string = "error"
const actionOnJoin string = "on-join"
const actionOnTakeSeat string = "on-take-seat"
const actionJoin string = "join"
const actionMuteVideo string = "mute-video"
const actionNewMessage string = "new-message"
const actionSendMessage string = "send-message"
const actionTakeSeat string = "take-seat"

// WebRTC Signaling actions
const actionOnReceiveSignal string = "on-receive-signal"
const actionSendSignal string = "send-signal"

// Game actions
const actionBet string = "bet"
const actionCall string = "call"
const actionCheck string = "check"
const actionFold string = "fold"
const actionOnHoleCards string = "on-hole-cards"
const actionRaise string = "raise"
const actionUpdateGame string = "update-game"
```

The event naming could have been more consistent. And I should figure out a way to
delineate between incoming and outgoing events better.

Currently the incoming events are processed in a big conditional statement.

```go
// ProcessEvent process event
func ProcessEvent(c *Client, e Event) {
	var err error
	if e.Action == actionJoin {
		err = HandleJoin(c, e.Params["username"].(string))
	} else if e.Action == actionSendMessage {
		err = HandleSendMessage(c, e.Params["username"].(string), e.Params["message"].(string))
	} else if e.Action == actionSendSignal {
		err = HandleSendSignal(
			c,
			e.Params["peerID"].(string),
			e.Params["streamID"].(string),
			e.Params["signalData"],
		)
	} else if e.Action == actionTakeSeat {
		err = HandleTakeSeat(c, e.Params["seatID"].(string))
	} else if e.Action == actionMuteVideo {
		err = HandleMuteVideo(c, e.Params["muted"].(bool))
	} else {
		// The remaining actions are turn dependent. The player can only act if it's their turn.
		if c.gameState.Stage < Preflop || c.gameState.Stage > River {
			err = fmt.Errorf("You cannot move during the %s stage", c.gameState.Stage.String())
		} else if c.gameState.CurrentSeat.Player.ID != c.seatID {
			err = fmt.Errorf("You cannot move out of turn")
		} else if e.Action == actionFold {
			err = HandleFold(c)
		} else if e.Action == actionCheck {
			err = HandleCheck(c)
		} else if e.Action == actionCall {
			err = HandleCall(c)
		} else if e.Action == actionRaise {
			raiseAmount := int(e.Params["value"].(float64))
			err = HandleRaise(c, raiseAmount)
		} else {
			err = fmt.Errorf("Unknown action encountered: %s", e.Action)
		}
	}

	if err != nil {
		HandlePlayerError(c, err)
	}
}
```

I debated whether to take a fancier approach and implement an FSM. Specifically
I think a hierarchical FSM would probably be needed. However it is not a pattern
I am used to implementing (even though I will typically diagram out the logic as
a rough state diagram).

I imagine there would be an FSM for the high level poker game. Here is a cleaned up
diagram that I had written in my notes:

![State diagram 1](/images/poker-game/state-diagram-1.png)

Then I was imagining a nested FSM that would look something like this:

![State diagram 2](/images/poker-game/state-diagram-2.png)

## Client

The client is written in React. This was trickier than the server since it is hard to
determine how best to set up the WebSocket connection in React.

I settled on using the createContext strategy. This approach creates a context/provider
for the WebSocket around the the main app component.

The AppStateProvider context would wrap the WebSocketProvider context since the latter
needs access to the app store.

```javascript
ReactDOM.render(
  <React.StrictMode>
    <AppStateProvider>
      <WebSocketProvider>
        <App />
      </WebSocketProvider>
    </AppStateProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
```

The WebSocket context file looks like this:

```javascript
const BASE_WS_URL = process.env.REACT_APP_WEBSOCKET_URL

const WebSocketContext = createContext(null)

const WebSocketProvider = ({ children }) => {
  let ws

  const [client, setClient] = useState(null)

  const appContext = useContext(appStore)
  const { appState, dispatch } = appContext

  useEffect(() => {
    const _client = w3cwebsocket(BASE_WS_URL)
    _client.onerror = function() {
      error(dispatch, {error: 'Could not connect to the server.'})
    }

    _client.onopen = function() {
      console.log('WebSocket client connected')
    }

    _client.onclose = function() {
      error(dispatch, {error: 'Lost connection to the server.'})
    }

    setClient(_client)
  }, [dispatch])

  if (client) {
    client.onmessage = (payload) => {
      let event = JSON.parse(payload.data)
      if (event.action === Event.ERROR) {
        error(dispatch, event.params)
      } else if (event.action === Event.NEW_MESSAGE) {
        newMessage(dispatch, event.params)
      } else if (event.action === Event.ON_HOLE_CARDS) {
        onHoleCards(dispatch, event.params, appState)
      } else if (event.action === Event.ON_JOIN) {
        onJoinGame(dispatch, event.params)
      } else if (event.action === Event.ON_TAKE_SEAT) {
        onTakeSeat(dispatch, event.params, client, appState)
      } else if (event.action === Event.ON_RECEIVE_SIGNAL) {
        onReceiveSignal(dispatch, event.params, client, appState)
      } else if (event.action === Event.UPDATE_GAME) {
        updateGame(dispatch, event.params, client, appState)
      } else {
        error(dispatch, {error: 'Unknown message received.'})
      }
    }
  }

  ws = {
    client,
    joinGame: partial(joinGame, client),
    sendMessage: partial(sendMessage, client, appState.username),
    sendMuteVideo: partial(sendMuteVideo, client),
    sendPlayerAction: partial(sendPlayerAction, client),
    takeSeat: partial(takeSeat, client),
  }

  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  )
}

WebSocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export { WebSocketContext, WebSocketProvider }
```

### UseEffect

One of the trickiest parts was initializing the WebSocket connection. This is because
of how React component state works.

Basically we do not want the WebSocket to be reinitialized every time an update to the
WebSocket context is triggered.

To do this, the WebSocket connection will be initialized inside a useEffect hook to
ensure it runs only once.

This is used in combination with useState to prevent the client from being reinitialized
repeatedly.

```javascript
const [client, setClient] = useState(null)

useEffect(() => {
    const _client = w3cwebsocket(BASE_WS_URL)
    _client.onerror = function() {
        error(dispatch, {error: 'Could not connect to the server.'})
    }

    _client.onopen = function() {
        console.log('WebSocket client connected')
    }

    _client.onclose = function() {
        error(dispatch, {error: 'Lost connection to the server.'})
    }

    setClient(_client)
}, [dispatch])
  ```

### Event loop

One thing you will notice is the client onmessage listener is implemented outside of the
useEffect hook.

This is because the onmessage function needs the app state. The problem is the app state
will be updated, which means that useEffect would be triggered more than once since we
would need to add `[dispatch, appState]` to the useEffect dependencies. Technically we
could exclude appState from the dependencies, but that will trigger a warning from React.

```javascript
if (client) {
    client.onmessage = (payload) => {
        let event = JSON.parse(payload.data)
        if (event.action === Event.ERROR) {
            error(dispatch, event.params)
        } else if (event.action === Event.NEW_MESSAGE) {
            newMessage(dispatch, event.params)
        } else if (event.action === Event.ON_HOLE_CARDS) {
            onHoleCards(dispatch, event.params, appState)
        } else if (event.action === Event.ON_JOIN) {
            onJoinGame(dispatch, event.params)
        } else if (event.action === Event.ON_TAKE_SEAT) {
            onTakeSeat(dispatch, event.params, client, appState)
        } else if (event.action === Event.ON_RECEIVE_SIGNAL) {
            onReceiveSignal(dispatch, event.params, client, appState)
        } else if (event.action === Event.UPDATE_GAME) {
            updateGame(dispatch, event.params, client, appState)
        } else {
           error(dispatch, {error: 'Unknown message received.'})
        }
    }
}
```

### Sending messages to the server

In order to send user input to the server, an object with websocket based
actions are passed in through the WebSocket context which will make those
actions usable from the app components.

Since each action requires that the WebSocket context be passed in, the lodash
partial function is used to create a wrapper function with the client
pre-populated.

```javascript
ws = {
    client,
    joinGame: partial(joinGame, client),
    sendMessage: partial(sendMessage, client, appState.username),
    sendMuteVideo: partial(sendMuteVideo, client),
    sendPlayerAction: partial(sendPlayerAction, client),
    takeSeat: partial(takeSeat, client),
}

return (
    <WebSocketContext.Provider value={ws}>
        {children}
    </WebSocketContext.Provider>
)
```

Here is a rough usage example:

```javascript
// Get the WebSocket context
const ws = useContext(WebSocketContext)
// Then pass it in to the component
<Chat messages={chat.messages} onSend={ws.sendMessage} />
```

### Synchronous updates

One issue I have not solved yet are scenarios where it would be nice to process
events synchronously rather than asynchronously.

This is primarily to avoid race conditions that could cause the state to be updated
incorrectly, missed, or delayed.

This caused trouble when orchestrating the WebRTC connections, which caused delayed
rendering of video when a player sits down at the table. This will be discussed more
in the next post.

The main thing I am wondering is how best to pipeline events to run in a serialized
pipeline instead of writing code to handle the race condition possibilities which
made the code less readable.

## Repository

The Github repository can be found here:

- [https://github.com/richard-to/poker](https://github.com/richard-to/poker)
