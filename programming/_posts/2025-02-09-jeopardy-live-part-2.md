---
layout: post
title: "Mesop Jeopardy Live - Part 2: Implementation"
---

<img width="1312" alt="jeopardy-live-2" src="https://github.com/user-attachments/assets/6bf149b7-79a8-47a1-8760-68bf6751fc81" />

[Part 1](https://richard.to/programming/jeopardy-live-part-1.html) of this series focused on evaluating the feasibility of using the [Gemini Multimodal Live API](https://ai.google.dev/gemini-api/docs/multimodal-live) with [Mesop](https://github.com/google/mesop).

This post will focus on the actual implementation of Mesop Jeopardy Live.

You can also view the [Mesop Jeopardy Live demo](https://huggingface.co/spaces/richard-to/mesop-jeopardy-live) on [HuggingFace Spaces](https://huggingface.co/spaces).

# 1 A brief detour

It should be noted that I went with a slightly different approach for connecting to the Gemini Multimodal Live API than was described in [Part 1](https://richard.to/programming/jeopardy-live-part-1.html).

Someone pointed me to the [Gemini Multimodal Live Dev Guide](https://github.com/heiko-hotz/gemini-multimodal-live-dev-guide) which provides examples in javascript. Mainly, it showed that it's possible to connect to the API directly from the browswer.

This approach is not that secure since it exposes the API key. For demo purposes this is a fine if the API key is not one that is enabled for billing. For production implementations, you'd probably need a proxy websocket server in front of the Gemini Multimodal Live API connection.

Even for Mesop, ideally, you'd want to use a separate server for the websocket server. This is more scalable since you want the Mesop server to primarily focus on the UI. In addition, this allows you to use the default SSE-based event flow.

There are demo cases where you may want to run the Gemini Multimodal Live API on the same Mesop backend server. Primarily, it simplifies the server setup. But generally, for demos, it's probably better to use direct websocket connection to the Gemini Multimodal Live API.

## 1.1 Old data flow

![diagram-2](https://github.com/user-attachments/assets/c0172cb3-8140-4f55-9a1e-0bc60b94c387)

This diagram roughly shows the flow of data when creating the API websocket connection on the Mesop backend.

The data flow is a lot easier to follow for the most part since Mesop acts as the proxy to the API.

Unfortunately, this approach is not that scalable since the Mesop server will have to make a lot of websocket connections and handle all the data that's getting sent in both directions.

This approach may also not be that reliable since errors with the websocket connection may cause the entire server to crash. Granted I have not verified if this is the case or not. In addition, this issue probably can be resolved with better handling.

## 1.2 New data flow

![diagram-1](https://github.com/user-attachments/assets/d734cd9b-dbb5-43b2-8fb5-61a7b71fa41f)

As you can see, it is much harder to follow the data flow in this diagram.

This will be discussed later in this post, but you'll notice that the Audio Player and Audio Recorder receive and send data to the Gemini Live API web component directly. We do not send the data to the Mesop server and then send to the Gemini Live API web component.

At the same time, we still need to manage the visual state of the Audio Player and Audio Recorder, so they will still need to communicate with the Mesop server.

# 2 Custom web components

In Mesop, new components can be added by creating custom web components. Mesop uses [Lit](https://lit.dev/) as the framework for this. For more details on how web components work, see the [Mesop docs on web components](https://google.github.io/mesop/web-components/). The Mesop docs also has a blog post [explaining the rationale for using web components](https://google.github.io/mesop/blog/2024/07/12/is-mesop--web-components-the-cure-to-front-end-fatigue/).

In general custom web components are easy to make. The main drawback is that it does not hook into the React ecosystem, which would unlock a large amount of functionality.

This means devs either need to find an existing non-react library and create a wrapper web component or roll their own implementation.

In the case of the audio recorder, audio player, and Gemini Live web components, I just rolled my own with some help from Claude.

## 2.1 Native Mesop UI elements

One issue with custom web components is that you can't use the native Mesop UI elements (mainly Angular Material components). This means that buttons will look like plain HTML buttons rather than Angular material buttons.

The workaround for this is to use slots. Then inside of the slot, you can use native Mesop components.

This allows you to place a click handler on the web component. And inside the web component, a native Mesop button can be rendered. The Mesop button itself does not do anything since just let the event bubbule to the click handler on the web component.

<img width="243" alt="Screenshot 2025-02-09 at 4 29 47 PM" src="https://github.com/user-attachments/assets/5b82194d-7231-4ce4-b1fa-07230ccbe26b" />

One drawback of this approach is that you must add extra state code to handle the state changes of the button. Basically it boils down to ensuring the web component sends some extra events and stores some extra properties.

One big limitation of this approach is that web components currently only have one slot, which means you likely can't have multiple native Mesop buttons on your web component.

We can work around this issue, however, by creating a "headless" web component. Essentially this is an invisible web component. Events are forwarded to it from Mesop through other UI elements. For Mesop Jeopardy Live, I did not need to go with this approach.

As an example, here is a snippet of the audio recorder button.

```python
@me.component
def audio_recorder_button():
  state = me.state(State)
  with audio_recorder(
    state=state.audio_recorder_state, on_state_change=on_audio_recorder_state_change
  ):
    with me.tooltip(message=get_audio_recorder_tooltip()):
      with me.content_button(
        disabled=not state.gemini_live_api_enabled,
        style=css.mic_button(),
        type="icon",
      ):
        if state.audio_recorder_state == "initializing":
          me.icon(icon="pending")
        else:
          me.icon(icon="mic")
```

On the javascript side, here is an example of how the events are sent. Notice how we dispatch the stateChange event. These are only necessary for updating the button state.

```javascript
  async startStreaming() {
    if (this.state === "disabled") {
      this.dispatchEvent(new MesopEvent(this.stateChangeEvent, "initializing"));
    }
    this.isInitializing = true;
    const initialized = await this.initialize();
    this.isInitializing = false;
    if (initialized) {
      this.isRecording = true;
      this.dispatchEvent(new MesopEvent(this.stateChangeEvent, "recording"));
      this.start();
    }
  }
```

## 2.2 Direct web component communication

This is one of the key implementation details for getting Mesop Jeopardy Live to work well.

Since we're going with a direct websocket connection to the Gemini API on the client, we don't want to provide unnecessary latency by routing all incoming and outgoing data from the Gemini Live API web component to the Mesop server and then having Mesop route those events to the audio player and audio recorder web components.

Turns out in Lit that it is possible to send events to other web components.

The drawback is that the current implementation is very hardcoded and heavily couples the custom web components together. I do think, that it would be possible to make this more generic. But for demo purposes, I was OK with the coupling.

The key is to dispatch a custom event. It looks like this:

```javascript
this.onAudioData = (base64Data) => {
  this.dispatchEvent(
    new CustomEvent("audio-output-received", {
      detail: { data: base64Data },
      // Allow event to cross shadow DOM boundaries (both need to be true)
      bubbles: true,
      composed: true,
    })
  );
};
```

This code can be found in the `gemini_live_connection.js` file. This event is dispatched when the Gemini Multimodal Live API sends audio data to the browser.

Next we need our Audio Player web component to listen for this event. It can be done like this:

```javascript
window.addEventListener("audio-output-received", this.onAudioOutputReceived);
```

Here is the implementation of `this.onAudioOutputReceived`:

```javascript
this.onAudioOutputReceived = (e) => {
  this.addToQueue(e.detail.data);
};
```

Overall it is pretty simple to setup.

You also need to make sure to clean up the event handlers. Here you'll see that there are multiple events that the Audio Player component is listening to. I think this also shows how heavily coupled it is to the Gemini Live web component.

```javascript
connectedCallback() {
  super.connectedCallback();
  window.addEventListener(
    "audio-output-received",
    this.onAudioOutputReceived
  );
  window.addEventListener(
    "gemini-live-api-started",
    this.onGeminiLiveStarted
  );
  window.addEventListener(
    "gemini-live-api-stopped",
    this.onGeminiLiveStopped
  );
}

disconnectedCallback() {
  super.disconnectedCallback();
  if (this.audioContext) {
    this.audioContext.close();
  }
  window.removeEventListener(
    "audio-output-received",
    this.onAudioInputReceived
  );
  window.removeEventListener(
    "gemini-live-api-started",
    this.onGeminiLiveStarted
  );
  window.removeEventListener(
    "gemini-live-api-stopped",
    this.onGeminiLiveStopped
  );
}
```

## 2.3 Gemini Live web component

In [Part 1](https://richard.to/programming/jeopardy-live-part-1.html), we did not need a web component for the Gemini Live API since the websocket connection was being established on the Mesop backend server.

But now, since we're making the connection on the JS client side, we need a custom web component.

Mostly, the code is modified from the example code in [Gemini Multimodal Live Dev Guide](https://github.com/heiko-hotz/gemini-multimodal-live-dev-guide). I mainly modified it to work as Mesop web component. In hindsight, I could have kept the API class separate from the web component implementation.

```javascript
class GeminiLiveConnection extends LitElement {
  static properties = {
    api_config: { type: String },
    enabled: { type: Boolean },
    endpoint: { type: String },
    startEvent: { type: String },
    stopEvent: { type: String },
    text_input: { type: String },
    toolCallEvent: { type: String },
    tool_call_responses: { type: String },
  };

  constructor() {
    super();
    this.onSetupComplete = () => {
      console.log("Setup complete...");
    };
    this.onAudioData = (base64Data) => {
      this.dispatchEvent(
        new CustomEvent("audio-output-received", {
          detail: { data: base64Data },
          // Allow event to cross shadow DOM boundaries (both need to be true)
          bubbles: true,
          composed: true,
        })
      );
    };
    this.onInterrupted = () => {};
    this.onTurnComplete = () => {};
    this.onError = () => {};
    this.onClose = () => {
      console.log("Web socket closed...");
    };
    this.onToolCall = (toolCalls) => {
      this.dispatchEvent(
        new MesopEvent(this.toolCallEvent, {
          toolCalls: JSON.stringify(toolCalls.functionCalls),
        })
      );
    };
    this.pendingSetupMessage = null;

    this.onAudioInputReceived = (e) => {
      this.sendAudioChunk(e.detail.data);
    };
  }

  connectedCallback() {
    super.connectedCallback();
    // Start listening for events when component is connected
    window.addEventListener("audio-input-received", this.onAudioInputReceived);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(
      "audio-input-received",
      this.onAudioInputReceived
    );
    if (this.ws) {
      this.ws.close();
    }
  }

  firstUpdated() {
    if (this.enabled) {
      this.setupWebSocket();
    }
  }

  updated(changedProperties) {
    if (
      changedProperties.has("tool_call_responses") &&
      this.tool_call_responses.length > 0
    ) {
      this.sendToolResponse(JSON.parse(this.tool_call_responses));
    }
    if (changedProperties.has("text_input") && this.text_input.length > 0) {
      this.sendTextMessage(this.text_input);
    }
  }

  start() {
    if (!this.enabled) {
      this.dispatchEvent(new MesopEvent(this.startEvent, {}));
      this.dispatchEvent(
        new CustomEvent("gemini-live-api-started", {
          detail: {},
          // Allow event to cross shadow DOM boundaries (both need to be true)
          bubbles: true,
          composed: true,
        })
      );
    }
    this.setupWebSocket();
  }

  stop() {
    this.dispatchEvent(new MesopEvent(this.stopEvent, {}));
    this.dispatchEvent(
      new CustomEvent("gemini-live-api-stopped", {
        detail: {},
        // Allow event to cross shadow DOM boundaries (both need to be true)
        bubbles: true,
        composed: true,
      })
    );
    if (this.ws) {
      this.ws.close();
    }
  }

  setupWebSocket() {
    this.ws = new WebSocket(this.endpoint);
    this.ws.onopen = () => {
      console.log("WebSocket connection is opening...");
      this.sendSetupMessage();
    };

    this.ws.onmessage = async (event) => {
      try {
        let wsResponse;
        if (event.data instanceof Blob) {
          const responseText = await event.data.text();
          wsResponse = JSON.parse(responseText);
        } else {
          wsResponse = JSON.parse(event.data);
        }

        if (wsResponse.setupComplete) {
          this.onSetupComplete();
        } else if (wsResponse.toolCall) {
          this.onToolCall(wsResponse.toolCall);
        } else if (wsResponse.serverContent) {
          if (wsResponse.serverContent.interrupted) {
            this.onInterrupted();
            return;
          }

          if (wsResponse.serverContent.modelTurn?.parts?.[0]?.inlineData) {
            const audioData =
              wsResponse.serverContent.modelTurn.parts[0].inlineData.data;
            this.onAudioData(audioData);

            if (!wsResponse.serverContent.turnComplete) {
              this.sendContinueSignal();
            }
          }

          if (wsResponse.serverContent.turnComplete) {
            this.onTurnComplete();
          }
        }
      } catch (error) {
        console.error("Error parsing response:", error);
        this.onError("Error parsing response: " + error.message);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      this.onError("WebSocket Error: " + error.message);
    };

    this.ws.onclose = (event) => {
      console.log("Connection closed:", event);
      this.onClose(event);
    };
  }

  sendMessage(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error(
        "WebSocket is not open. Current state:",
        this.ws.readyState
      );
      this.onError("WebSocket is not ready. Please try again.");
    }
  }

  sendSetupMessage() {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(this.api_config);
    } else {
      console.error("Connection not ready.");
    }
  }

  sendAudioChunk(base64Audio) {
    const message = {
      realtime_input: {
        media_chunks: [
          {
            mime_type: "audio/pcm",
            data: base64Audio,
          },
        ],
      },
    };
    this.sendMessage(message);
  }

  sendEndMessage() {
    const message = {
      client_content: {
        turns: [
          {
            role: "user",
            parts: [],
          },
        ],
        turn_complete: true,
      },
    };
    this.sendMessage(message);
  }

  sendContinueSignal() {
    const message = {
      client_content: {
        turns: [
          {
            role: "user",
            parts: [],
          },
        ],
        turn_complete: false,
      },
    };
    this.sendMessage(message);
  }

  sendTextMessage(text) {
    this.sendMessage({
      client_content: {
        turn_complete: true,
        turns: [{ role: "user", parts: [{ text: text }] }],
      },
    });
  }

  sendToolResponse(functionResponses) {
    const toolResponse = {
      tool_response: {
        function_responses: functionResponses,
      },
    };
    this.sendMessage(toolResponse);
  }

  async ensureConnected() {
    if (this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 5000);

      const onOpen = () => {
        clearTimeout(timeout);
        this.ws.removeEventListener("open", onOpen);
        this.ws.removeEventListener("error", onError);
        resolve();
      };

      const onError = (error) => {
        clearTimeout(timeout);
        this.ws.removeEventListener("open", onOpen);
        this.ws.removeEventListener("error", onError);
        reject(error);
      };

      this.ws.addEventListener("open", onOpen);
      this.ws.addEventListener("error", onError);
    });
  }

  render() {
    if (this.enabled) {
      return html`<span @click="${this.stop}"><slot></slot></span>`;
    } else {
      return html`<span @click="${this.start}"><slot></slot></span>`;
    }
  }
}
```

# 3 Custom tool calls

Custom tool calls were the critical part in getting this demo to work.

In the end, it sort of works and sort of doesn't. More on that later.

## 3.1 Tool call definitions

The tool calls are written in JSON Schema. They need to be defined in the API configuration.

You also need to make sure that your system instructions instruct Gemini on when the tool calls should be used.

```python
_TOOL_DEFINITIONS = {
  "functionDeclarations": [
    {
      "name": "get_clue",
      "description": "Gets the clue from the board which returns the clue and answer",
      "parameters": {
        "type": "object",
        "properties": {
          "category_index": {"type": "integer", "description": "Index of selected category."},
          "dollar_index": {"type": "integer", "description": "Index of selected dollar amount."},
        },
        "required": ["category_index", "dollar_index"],
      },
    },
    {
      "name": "update_score",
      "description": "Updates whether user got the question correct or not.",
      "parameters": {
        "type": "object",
        "properties": {
          "is_correct": {"type": "boolean", "description": "True if correct. False is incorrect."},
        },
        "required": ["is_correct"],
      },
    },
  ]
}
```

## 3.2 Basic implementation

When Gemini makes a tool call, we forward the tool call to the Mesop server for processing.

```javascript
this.onToolCall = (toolCalls) => {
  this.dispatchEvent(
    new MesopEvent(this.toolCallEvent, {
      toolCalls: JSON.stringify(toolCalls.functionCalls),
    })
  );
};
```

The Mesop server listens for the event and handles it like a normal Mesop event.

For Mesop Jeopardy Live, we have two tool calls.

The first use case is when the user asks for a clue (e.g. "Some category for $400"). In order for the game to work, Gemini needs to know what clue to ask. We also need to update the UI accordingly based on this change.

The second use case is when the user answers the clue. Gemini must determine if the user is right or wrong. The UI needs to update the Jeopardy board and score based on this result.

```python
def handle_tool_calls(e: mel.WebEvent):
  """Proceses tool calls from Gemini Live API.

  Supported tool calls:

  - get_clue
  - update_score
  """
  state = me.state(State)
  tool_calls = json.loads(e.value["toolCalls"])
  responses = []
  for tool_call in tool_calls:
    result = None
    if tool_call["name"] == "get_clue":
      result = tool_call_get_clue(
        tool_call["args"]["category_index"], tool_call["args"]["dollar_index"]
      )
      result = True  # For now just return true due to buggy behavior
    elif tool_call["name"] == "update_score":
      result = tool_call_update_score(tool_call["args"]["is_correct"])

    responses.append(
      {
        "id": tool_call["id"],
        "name": tool_call["name"],
        "response": {"result": result},
      }
    )

  if responses:
    state.tool_call_responses = json.dumps(responses)
```

Once the tool calls are processed, you'll see that we update the Mesop state, which then updates the Gemini Live web component. This is similar to the strategy we used with the Audio Player, notifying it of new audio chunks to play.

```javascript
updated(changedProperties) {
  if (
    changedProperties.has("tool_call_responses") &&
    this.tool_call_responses.length > 0
  ) {
    this.sendToolResponse(JSON.parse(this.tool_call_responses));
  }
  if (changedProperties.has("text_input") && this.text_input.length > 0) {
    this.sendTextMessage(this.text_input);
  }
}
```

Also here are the actual implementations of the tool calls. One thing you'll see is that we do not return a JSON response.

This is not ideal. It was mainly done to work around inconsistent behavior in the Gemini API from recognizing and handling tool calls. More about this later.

```python
def tool_call_update_score(is_correct: bool) -> str:
  """Updates the user's score

  Gemini will determine if the user is correct and then call this tool which will
  allow the game state to be updated appropriately.
  """
  state = me.state(State)
  selected_question = get_selected_question(state.board, state.selected_question_key)
  if is_correct:
    state.score += selected_question.normalized_value
  else:
    state.score -= selected_question.normalized_value

  # Clear question so another can be picked.
  state.answered_questions.add(state.selected_question_key)
  state.selected_question_key = ""

  return f"The user's score is {state.score}"


def tool_call_get_clue(category_index, dollar_index) -> str:
  """Gets the selected clue.

  Gemini will parse the user request and make a tool call with the row/col indexes.

  Example: "Category X for $400".
  """
  cell_key = f"clue-{category_index}-{dollar_index}"
  response = handle_select_clue(cell_key)

  if isinstance(response, str):
    return "There was an error. " + response

  return f"The clue is {response.question}\n\n The answer to the clue is {response.answer}\n\n Please read the clue to the user."
```

# 4 System instructions

I struggled a lot with the system instructions. During my testing, I got a lot of inconsistent behavior in how the instructions were being interpreted, even when setting the temperature to 0.0.

In the end, I'm not fully happy with the system instructions, but here they are:

    You are the host of Jeopardy!, an engaging and knowledgeable quiz show host. Your role is to manage the game, present clues, and validate answers while maintaining the show's signature style and format.

    # Game Rules and Structure

    1. Turn Structure:
    - Allow players to select a category and dollar amount
    - Validate selections using the get_clue tool
    - Retrieve the corresponding clue from the dataset
    - Present the clue clearly and wait for the player's response
    - Evaluate answers and update scores accordingly

    2. Answer Validation Rules:
    - Accept answers phrased as either questions ("What is...?") or direct answers
    - Allow for common spelling variations and typos
    - Consider partial answers based on key terms
    - Handle multiple acceptable forms of the same answer
    - Response must contain the key concept(s) from the official answer

    # Available Tools

    ## get_clue(category_index, value_index)
    Purpose: Retrieves and validates clue selection
    Parameters:
    - category_index: Integer (0-based index of the category)
    - value_index: Integer (0-based index of the dollar amount)
    Usage: Must be called before presenting any clue so the UI can be updated.

    ## update_score(is_correct)
    Purpose: Updates and tracks player score
    Parameters:
    - is_correct: Boolean (true if answer was correct, false otherwise)
    Usage: Must be called after each answer evaluation so the UI can be updated.

    # Error Handling

    1. Invalid Selections:
    - If category or value doesn't exist, inform player and request new selection
    - If clue was already used, inform player and request new selection

    2. Answer Processing:
    - Handle empty responses by requesting an answer
    - Allow one attempt per clue
    - If answer is incorrect, provide the correct answer before moving on

    # Game Flow

    1. Each Turn:
    - Accept category and value selection
    - Validate selection using get_clue
    - Present clue
    - Accept and evaluate answer
    - Update score using update_score
    - If the user is wrong, subtract the value from the current score
    - Show current score and remaining board

    2. End of Game:
    - Trigger when all clues are used
    - Display final score and summary
    - Offer to start new game

    # Response Format

    1. Clue Presentation:
    ```
    [Category Name] for $[Value]

    [Clue Text]
    ```

    2. Answer Evaluation:
    - For correct answers: "Correct! [Brief explanation if needed]"
    - For incorrect answers: "I'm sorry, that's incorrect. The correct response was [Answer]. [Brief explanation]"

    3. Score Updates:
    "Your score is now $[Amount]"

    # Dataset Schema

    {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "array",
      "description": "A collection of Jeopardy! categories and their clues",
      "items": {
        "type": "array",
        "description": "A category of Jeopardy! clues",
        "items": {
          "type": "object",
          "description": "A single Jeopardy! clue",
          "required": [
            "category",
            "value",
            "clue",
            "answer",
          ],
          "properties": {
            "category": {
              "type": "string",
              "description": "The category of the clue"
            },
            "clue": {
              "type": "string",
              "description": "The clue given to contestants"
            },
            "answer": {
              "type": "string",
              "description": "The expected answer to the clue"
            },
            "value": {
              "type": "integer",
              "description": "The value of the clue"
            }
          }
        },
        "minItems": 5,
        "maxItems": 5
      },
      "examples": [{
        "category": "Secret Languages",
        "question": "This language, used in ancient Greece, involved writing words backwards",
        "value": "200",
        "answer": "Mirror writing",
      }]
    }

    ## Dataset

    [[clue_data]]

    Remember to maintain the engaging, professional tone of a game show host while keeping the game moving at a good pace. Focus on making the experience enjoyable while fairly enforcing the rules.

## 4.1 Inconsistent interpretation of tool call responses

In the original version, the system instructions did not include the JSON dataset of questions for the game board.

The reason why the JSON data needed to be included was because Gemini was not intepreting the tool call responses correctly.

Originally I was returning a JSON response with the clue, answer, category, and dollar amount.

Sometimes this would work correctly. Gemini would respond by reading out the clue.

But other times, it would do other things:

- Just say something like "here is the question"
- Make up a completely different question
- Read the JSON word for word

I think something is not right with the API's handling of tool call responses.

In addition, the tool calls responses seem to interrupt Gemini's current response. This leads to some repetition, such as "You picked category X for $X...You picked category X..."

So to work around this issue, I included the data in the system instructions.

This is also why only the value of `True` is returned for the `get_clue` tool call.

```python
result = None
if tool_call["name"] == "get_clue":
  result = tool_call_get_clue(
    tool_call["args"]["category_index"], tool_call["args"]["dollar_index"]
  )
  result = True  # For now just return true due to buggy behavior
```

# 5 Screenshots

Here are some screenshots of the UI.

## 5.1 Starting state

<img width="1312" alt="jeopardy-live-1" src="https://github.com/user-attachments/assets/bdd05263-907e-4908-a806-ac42bef988ad" />

## 5.2 Active game state

<img width="1312" alt="jeopardy-live-2" src="https://github.com/user-attachments/assets/6bf149b7-79a8-47a1-8760-68bf6751fc81" />

# 6 Repository

The code can be found at [https://github.com/richard-to/mesop-jeopardy-live](https://github.com/richard-to/mesop-jeopardy-live).
