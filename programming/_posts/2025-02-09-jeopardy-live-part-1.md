---
layout: post
title: "Mesop Jeopardy Live - Part 1: Mesop + Gemini Multimodal Live API"
---

After seeing the [Gemini Multimodal Live API](https://ai.google.dev/gemini-api/docs/multimodal-live) on [AI Studio](https://aistudio.google.com/live), it gave me the idea of extending the [Mesop Jeopardy demo](https://richard.to/programming/mesop-jeopardy.html) with audio input/output.

This post covers the initial of approach of creating the Gemni Multimodal Live API connection on the backend Mesop server.

## 1 Websocket connection

The main question was whether [Mesop](https://github.com/google/mesop) would work with the Gemini Multimodal Live API which uses websockets to help achieve lower latency response times. Mesop does have experimental websocket support, but does not support push events, which would be needed to handle responses from the API that
may not be triggered by a user event. Another related problem was how to keep the websocket connection running.

The other issue was the lack of documentation and examples since the API is so new. Luckily, there's a good example of using the websocket API in python at [https://github.com/google-gemini/cookbook/blob/main/gemini-2/websockets/live_api_starter.py](https://gi.thub.com/google-gemini/cookbook/blob/main/gemini-2/websockets/live_api_starter.py).

## 1.1 Websocket mode

Since the websocket connection to the Gemini Multimodal Live API is going to be on the backend Mesop server, the Mesop server also needs to establish a websocket connection to the client. The reason will be explained in section 1.2.

As mentioned in the previous section, Mesop has support for websockets. This feature needs to be enabled with the following environment variable.

```
MESOP_WEBSOCKETS_ENABLED=true
```

## 1.2 Gemini Live API class

This class is a modified version of the example at [https://github.com/google-gemini/cookbook/blob/main/gemini-2/websockets/live_api_starter.py](https://gi.thub.com/google-gemini/cookbook/blob/main/gemini-2/websockets/live_api_starter.py).

We will cover specific parts of the code in more detail later. But for now, just posting the class for context.

```python
_HOST = "generativelanguage.googleapis.com"
_MODEL = "gemini-2.0-flash-exp"

_API_KEY = os.getenv("GOOGLE_API_KEY")
_GEMINI_BIDI_WEBSOCKET_URI = f"wss://{_HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={_API_KEY}"


_GEMINI_LIVE_LOOP_MAP = {}


class GeminiLiveLoop:
  def __init__(self):
    self.audio_in_queue = None
    self.out_queue = None

    self.ws = None

  async def startup(self):
    setup_msg = {"setup": {"model": f"models/{_MODEL}"}}
    await self.ws.send(json.dumps(setup_msg))
    raw_response = await self.ws.recv(decode=False)
    json.loads(raw_response.decode("ascii"))

  async def send_video_direct(self, data):
    """Sends video input chunks to Gemini."""
    msg = {
      "realtime_input": {
        "media_chunks": [
          {
            "data": data,
            "mime_type": "image/jpeg",
          }
        ]
      }
    }
    await self.ws.send(json.dumps(msg))

  async def send_audio_direct(self, data):
    """Sends audio input chunks to Gemini.

    - Audio chunks need to be sent with a sample rate of 16000hz and be in PCM format.
    - The audio data needs to be base64 encoded since we're using JSON.
    """
    msg = {
      "realtime_input": {
        "media_chunks": [
          {
            "data": data,
            "mime_type": "audio/pcm",
          }
        ]
      }
    }
    await self.ws.send(json.dumps(msg))

  async def send_text_direct(self, text):
    """Sends text input to Gemini."""
    msg = {
      "client_content": {
        "turn_complete": True,
        "turns": [{"role": "user", "parts": [{"text": text}]}],
      }
    }
    await self.ws.send(json.dumps(msg))

  async def receive_audio(self):
    """Process the audio responses returned by Gemini"""
    async for raw_response in self.ws:
      # Other things could be returned here, but we'll ignore those for now.
      response = json.loads(raw_response.decode("ascii"))
      try:
        b64data = response["serverContent"]["modelTurn"]["parts"][0]["inlineData"]["data"]
      except KeyError:
        pass
      else:
        pcm_data = base64.b64decode(b64data)
        self.audio_in_queue.put_nowait(pcm_data)

      try:
        turn_complete = response["serverContent"]["turnComplete"]
      except KeyError:
        pass
      else:
        if turn_complete:
          # If you interrupt the model, it sends an end_of_turn.
          # For interruptions to work, we need to empty out the audio queue
          # Because it may have loaded much more audio than has played yet.
          while not self.audio_in_queue.empty():
            self.audio_in_queue.get_nowait()

  async def run(self):
    """Yields audio chunks off the input queue."""
    try:
      async with (
        await connect(
          _GEMINI_BIDI_WEBSOCKET_URI,
          additional_headers={"Content-Type": "application/json"},
        ) as ws,
        asyncio.TaskGroup() as tg,
      ):
        self.ws = ws
        await self.startup()

        self.audio_in_queue = asyncio.Queue()

        tg.create_task(self.receive_audio())

        while True:
          bytestream = await self.audio_in_queue.get()
          yield bytestream

    except asyncio.CancelledError:
      pass
    except ExceptionGroup as EG:
      traceback.print_exception(EG)
```

## 1.3 Connecting to the API

Since Mesop does not have a way to send push events, one hack is to use a click event that never ends (i.e. an event that continuously yields).

In SSE mode, Mesop would block and make the UI unusable. However in websocket mode, Mesop allows async event handling and does not block the UI.

Here is what the event handler looks like:

```python
async def initialize_gemini_api(e: me.ClickEvent):
  """Initializes a long running event handler to send audio response data to the client."""
  global _GEMINI_LIVE_LOOP_MAP
  state = me.state(State)
  state.gemini_connection_enabled = True
  yield
  if state.session_id not in _GEMINI_LIVE_LOOP_MAP:
    _GEMINI_LIVE_LOOP_MAP[state.session_id] = GeminiLiveLoop()
    async for bytestream in _GEMINI_LIVE_LOOP_MAP[state.session_id].run():
      me.state(State).data = bytestream
      yield
```

All this code does is start the websocket connection and continuously yield audio response chunks from the API.

We also store the websocket connection in a global dict to ensure each user has their own connection to the API.

The `GeminiLiveLoop.run` method looks like:

```python
async def run(self):
  """Yields audio chunks off the input queue."""
  try:
    async with (
      await connect(
        _GEMINI_BIDI_WEBSOCKET_URI,
        additional_headers={"Content-Type": "application/json"},
      ) as ws,
      asyncio.TaskGroup() as tg,
    ):
      self.ws = ws
      await self.startup()

      self.audio_in_queue = asyncio.Queue()

      tg.create_task(self.receive_audio())

      while True:
        bytestream = await self.audio_in_queue.get()
        yield bytestream

  except asyncio.CancelledError:
    pass
  except ExceptionGroup as EG:
    traceback.print_exception(EG)
```

The main thing to know for this block is that we create an async task group that receives audio input from the API, processess the chunk, and adds it the `audio_in_queue`.

We then have an infinite loop that keeps waiting for data to be added to the `audio_in_queue` which then gets yielded to the event handler, which updates the state with the new chunk of audio.

## 1.4 Drawbacks

This whole setup feels pretty hacky, which it is. Mesop wasn't built for this use case. Here are the current issues:

1. No clear way to close the connection once the infinite event loop has been started
2. Support for handling error cases is unclear
3. Mesop server is no longer focused on just UI rendering
4. Mesop server has to take on the extra load of the websockets (i.e. data input and output can take a lot of bandwidth).

# 2 Audio

The high level design for handling audio input and audio output was to create two web components to handle recording audio from the user and playing audio from the Gemini Multimodal Live API.

Getting the audio to work was one of the bigger challenges. Reasons:

1. Docs do not specify the audio output format
2. Docs do not specify the audio input format
3. The experimental API has a low quota

## 2.1 Audio Player web component

The audio player web component works processing audio chunks sent from the API via Mesop state.

In order to save bandwidth, the audio chunks are not saved. Everytime state gets updated, a new audio chunk is added.

The audio player will save the unplayed chunks in a queue. It will play the chunks until the queue is empty.

The main consideration (which is not explicitly documented) is that the data returned by Gemini is in PCM format at 24000hz.

```python
@mel.web_component(path="./audio_player.js")
def audio_player(
  *,
  enabled: bool = False,
  data: bytes = b"",
  on_play: Callable[[mel.WebEvent], Any],
):
  """Plays audio streamed from the server.

  An important thing to note is that the audio player does not persist the data it
  receives. Instead the data is stored in a queue and removed once the audio has been
  played.

  This is a barebones configuration that sets the sample rate to 24000hz since that is
  what Gemini returns. In addition we expect the data to be in PCM format.
  """
  return mel.insert_web_component(
    name="audio-player",
    events={
      "playEvent": on_play,
    },
    properties={
      "enabled": enabled,
      "data": base64.b64encode(data).decode("utf-8"),
    },
  )
```

The audio_player.js file is relatively straightforward, so there's no need to post it here. I mainly just asked Claude to help with that part.

## 2.2 Audio Recorder web component

The audio recorder web component took the most work to get working.

The general idea of the audio recording web component is that it sends data as events for each chunk of audio.

The main problem was the lack of clear and explicit documentation for what input format was accepted. Turns out that Gemini is looking for base64 encoded PCM data that is at 16000hz. If the audio is not properly formatted, no response is returned from the API.

This is slightly problematic since on the JS side it's not easy to change the sampling rate. For example, my laptop records audio at 48000hz and the browser can't override it.

One other thing to note is that the Gemini Multimodal Live API can do Voice Activity Detection (VAD). This is nice since it means you don't have to implement it yourself. However, due to the limited quota, you'll run out of quota pretty quickly if you send a continuous audio stream to the API.

Also the current implementation requires that the user wear headphones since system noise cancellation isn't implemented.

The javascript for the audio recorder ended being pretty messy due to all the adjustments and debugging that I needed to make to get things working.

Out of laziness or perhaps increasing dependence, I also relied heavily on Claude to write the code here. I just continuously asked it to make adjustments and brainstorm potential solutions to issues.

This is where the Gemini Multimodal Live API being very new did not help since Claude did not have this data ingested. Nor did it have any examples.

In the end, I was able to figure out the 16000hz sampling rate requirement by looking at the example code. I wondered why it chose that explicitly. It was also oddly different than the 24000hz for output. From there, though, I was able to ask Claude for ways to get the input audio to the right sampling rate. This took a lot of trial and error since Claude did take me down some directions that led to dead ends.

The audio recorder javascript also uses the deprecated `createScriptProcessor` approach. It should use the audio worklet approach. But after so many issues, I didn't bother asking Claude to get a working version using the audio worklet approach.

```javascript
import {
  LitElement,
  html,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js";

class AudioRecorder extends LitElement {
  static properties = {
    dataEvent: { type: String },
    recordEvent: { type: String },
    isRecording: { type: Boolean },
    debugBuffer: { state: true },
    debug: { type: Boolean },
    enabled: { type: Boolean },
    voiceDetectionEnabled: { type: Boolean },
    voiceThreshold: { type: Number },
    voiceHoldTime: { type: Number },
  };

  constructor() {
    super();
    this.debug = false;
    this.mediaStream = null;
    this.audioContext = null;
    this.processor = null;
    this.isStreaming = false;
    this.isRecording = false;
    this.isInitializing = false;
    this.sequenceNumber = 0;
    this.debugBuffer = [];
    this.debugBufferSize = 50;
    this.targetSampleRate = 16000;
    this.enabled = false;

    // Voice detection parameters
    this.voiceDetectionEnabled = true; // Enable by default
    this.voiceThreshold = 0.01; // RMS threshold for voice detection
    this.voiceHoldTime = 500; // Time to hold voice detection state in ms
    this.lastVoiceDetectedTime = 0; // Last time voice was detected
    this.isVoiceDetected = false; // Current voice detection state
    this.consecutiveSilentFrames = 0; // Counter for silent frames
    this.silenceThreshold = 10; // Number of silent frames before cutting off
  }

  disconnectedCallback() {
    this.stop();
    super.disconnectedCallback();
  }

  firstUpdated() {
    if (this.enabled) {
      this.startStreaming();
    }
  }

  log(...args) {
    if (this.debug) {
      console.log(...args);
    }
  }

  warn(...args) {
    if (this.debug) {
      console.warn(...args);
    }
  }

  error(...args) {
    if (this.debug) {
      console.error(...args);
    }
  }

  isVoiceFrame(audioData) {
    // Calculate RMS of the audio frame
    let sumSquares = 0;
    for (let i = 0; i < audioData.length; i++) {
      sumSquares += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sumSquares / audioData.length);

    const now = Date.now();

    // Check if we detect voice in this frame
    if (rms > this.voiceThreshold) {
      this.lastVoiceDetectedTime = now;
      this.consecutiveSilentFrames = 0;
      this.isVoiceDetected = true;
      return true;
    }

    // Check if we're still within the hold time
    if (now - this.lastVoiceDetectedTime < this.voiceHoldTime) {
      return true;
    }

    // Increment silent frames counter
    this.consecutiveSilentFrames++;

    // If we've seen enough silent frames, mark as silent
    if (this.consecutiveSilentFrames > this.silenceThreshold) {
      this.isVoiceDetected = false;
    }

    return this.isVoiceDetected;
  }

  async startStreaming() {
    if (!this.enabled) {
      this.dispatchEvent(new MesopEvent(this.recordEvent, {}));
    }
    this.isInitializing = true;
    const initialized = await this.initialize();
    this.isInitializing = false;
    if (initialized) {
      this.isRecording = true;
      this.start();
    }
  }

  async initialize() {
    try {
      // First check what sample rates are supported with echo cancellation
      const testStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Get the actual sample rate from the system
      const systemTrack = testStream.getAudioTracks()[0];
      const settings = systemTrack.getSettings();
      this.log("System audio settings:", settings);

      // Clean up the test stream
      testStream.getTracks().forEach((track) => track.stop());

      // Now create the real stream using the system's capabilities
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: settings.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          echoCancellationType: "system",
          latency: 0,
        },
        video: false,
      });

      // Log the actual constraints that were applied
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      const actualConstraints = audioTrack.getSettings();
      this.log("Applied audio constraints:", actualConstraints);

      // Set up audio context matching the system rate
      this.audioContext = new AudioContext({
        sampleRate: settings.sampleRate,
      });
      this.log(
        "AudioContext created with sample rate:",
        this.audioContext.sampleRate
      );

      const micSource = this.audioContext.createMediaStreamSource(
        this.mediaStream
      );

      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      // Connect the audio nodes
      micSource.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      return true;
    } catch (error) {
      this.error("Error initializing audio streamer:", error);
      return false;
    }
  }

  downsampleBuffer(buffer, originalSampleRate) {
    if (originalSampleRate === this.targetSampleRate) {
      return buffer;
    }

    const ratio = originalSampleRate / this.targetSampleRate;
    const newLength = Math.floor(buffer.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const startIndex = Math.floor(i * ratio);
      const endIndex = Math.floor((i + 1) * ratio);
      let sum = 0;
      let count = 0;

      for (let j = startIndex; j < endIndex && j < buffer.length; j++) {
        sum += buffer[j];
        count++;
      }

      result[i] = count > 0 ? sum / count : 0;
    }

    this.log("Downsampling details:", {
      originalRate: originalSampleRate,
      targetRate: this.targetSampleRate,
      originalLength: buffer.length,
      newLength: result.length,
      actualRatio: buffer.length / result.length,
    });

    return result;
  }

  addAudioDebugger(sourceNode, label) {
    if (!this.debug) return;

    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 2048;
    sourceNode.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    this.debugInterval = setInterval(() => {
      if (!this.isStreaming) return;

      analyser.getFloatTimeDomainData(dataArray);
      let rms = 0;
      for (let i = 0; i < bufferLength; i++) {
        rms += dataArray[i] * dataArray[i];
      }
      rms = Math.sqrt(rms / bufferLength);
      this.log(`${label} RMS Level: ${rms.toFixed(6)}`);
    }, 1000);
  }

  start() {
    this.isStreaming = true;
    this.debugBuffer = [];
    this.lastVoiceDetectedTime = 0;
    this.isVoiceDetected = false;
    this.consecutiveSilentFrames = 0;

    this.processor.onaudioprocess = (event) => {
      if (!this.isStreaming) return;

      const inputData = event.inputBuffer.getChannelData(0);
      const originalSampleRate = event.inputBuffer.sampleRate;

      // Log initial processing details if needed
      if (this.sequenceNumber === 0) {
        this.log("Audio Processing Details:", {
          bufferSize: this.processor.bufferSize,
          inputChannels: this.processor.numberOfInputs,
          outputChannels: this.processor.numberOfOutputs,
          originalSampleRate: originalSampleRate,
          targetSampleRate: this.targetSampleRate,
          length: inputData.length,
          timestamp: event.timeStamp,
        });
      }

      // Check for voice activity if enabled
      if (this.voiceDetectionEnabled && !this.isVoiceFrame(inputData)) {
        // Skip this frame if no voice is detected
        this.sequenceNumber++; // Still increment to maintain sequence
        return;
      }

      const downsampledData = this.downsampleBuffer(
        inputData,
        originalSampleRate
      );

      const processedData = new Float32Array(downsampledData.length);
      const gain = 5.0;
      for (let i = 0; i < downsampledData.length; i++) {
        processedData[i] = downsampledData[i] * gain;
      }

      // Debug logging
      if (this.sequenceNumber % 50 === 0 && this.debug) {
        const stats = {
          originalLength: inputData.length,
          downsampledLength: downsampledData.length,
          maxValue: Math.max(...processedData),
          minValue: Math.min(...processedData),
          originalSampleRate,
          targetSampleRate: this.targetSampleRate,
          isVoiceDetected: this.isVoiceDetected,
        };
        this.log("Audio buffer stats:", stats);
      }

      // Store in debug buffer
      this.debugBuffer.push(processedData);
      if (this.debugBuffer.length > this.debugBufferSize) {
        this.debugBuffer.shift();
      }

      // Audio level monitoring
      let rms = 0;
      for (let i = 0; i < processedData.length; i++) {
        rms += processedData[i] * processedData[i];
      }
      rms = Math.sqrt(rms / processedData.length);

      if (this.sequenceNumber % 10 === 0 && this.debug) {
        this.log(
          `Audio Level (RMS): ${rms.toFixed(4)}, Voice Detected: ${
            this.isVoiceDetected
          }`
        );
        if (rms < 0.0001) {
          this.warn(
            "Warning: Very low audio level detected. Check if microphone is working."
          );
        }
      }

      // Convert to Int16Array for transmission
      const intData = new Int16Array(processedData.length);
      for (let i = 0; i < processedData.length; i++) {
        intData[i] = Math.max(
          -32768,
          Math.min(32767, processedData[i] * 32768)
        );

        if (this.sequenceNumber % 100 === 0 && i < 10 && this.debug) {
          this.log(
            `Sample ${i}: Float=${processedData[i].toFixed(4)}, Int16=${
              intData[i]
            }`
          );
        }
      }

      // Convert to base64 and dispatch
      const bytes = new Uint8Array(intData.buffer);
      const base64Data = btoa(
        Array.from(bytes)
          .map((byte) => String.fromCharCode(byte))
          .join("")
      );

      this.dispatchEvent(
        new MesopEvent(this.dataEvent, {
          sequence: this.sequenceNumber++,
          sampleRate: this.targetSampleRate,
          data: base64Data,
          isVoice: this.isVoiceDetected,
        })
      );
    };

    return true;
  }

  stop() {
    this.isStreaming = false;
    this.isRecording = false;

    if (this.debugInterval) {
      clearInterval(this.debugInterval);
    }

    if (this.processor) {
      this.processor.onaudioprocess = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  async playbackDebug() {
    if (!this.debugBuffer.length) {
      this.log("No audio data available for playback");
      return;
    }

    const playbackContext = new AudioContext();
    const systemSampleRate = playbackContext.sampleRate;

    const totalSamples16k =
      this.debugBuffer.length * this.debugBuffer[0].length;

    const upsampledLength = Math.round(
      totalSamples16k * (systemSampleRate / this.targetSampleRate)
    );

    const audioBuffer = playbackContext.createBuffer(
      1,
      upsampledLength,
      systemSampleRate
    );

    const channelData = audioBuffer.getChannelData(0);

    const combined16kBuffer = new Float32Array(totalSamples16k);
    let offset = 0;
    for (let i = 0; i < this.debugBuffer.length; i++) {
      combined16kBuffer.set(this.debugBuffer[i], offset);
      offset += this.debugBuffer[i].length;
    }

    const ratio = this.targetSampleRate / systemSampleRate;
    for (let i = 0; i < upsampledLength; i++) {
      const position = i * ratio;
      const index = Math.floor(position);
      const decimal = position - index;

      const sample1 = combined16kBuffer[index] || 0;
      const sample2 = combined16kBuffer[index + 1] || sample1;
      channelData[i] = sample1 + decimal * (sample2 - sample1);
    }

    const source = playbackContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(playbackContext.destination);
    source.start();
    this.log("Playing debug audio at system rate...", {
      systemSampleRate,
      originalLength: totalSamples16k,
      upsampledLength,
    });

    source.onended = () => {
      this.log("Debug playback finished");
      playbackContext.close();
    };
  }

  render() {
    if (this.isInitializing) {
      return html`<div>Initializing audio recorder...</div>`;
    }

    if (this.isRecording) {
      return html`
        <button @click="${this.stop}">Stop</button>
        <button
          @click="${this.playbackDebug}"
          ?disabled="${!this.debugBuffer.length}"
        >
          Play Debug Recording
        </button>
      `;
    }

    return html` <button @click="${this.startStreaming}">Record</button>`;
  }
}

customElements.define("audio-recorder", AudioRecorder);
```

## 2.3 Sending audio to Gemini Multimodal Live API

Aside from the PCM formatting issues mentioned above, the other issue was how to forward this data from Mesop to the Gemini API.

In the end, it turned out to be pretty simple. We were able to just send a simple direct websocket call.

```python
async def send_audio_direct(self, data):
  """Sends audio input chunks to Gemini.

  - Audio chunks need to be sent with a sample rate of 16000hz and be in PCM format.
  - The audio data needs to be base64 encoded since we're using JSON.
  """
  msg = {
    "realtime_input": {
      "media_chunks": [
        {
          "data": data,
          "mime_type": "audio/pcm",
        }
      ]
    }
  }
  await self.ws.send(json.dumps(msg))
```

This part is a departure from the example code at [https://github.com/google-gemini/cookbook/blob/main/gemini-2/websockets/live_api_starter.py](https://gi.thub.com/google-gemini/cookbook/blob/main/gemini-2/websockets/live_api_starter.py).

In their example, they a have queue that stores the input data and another task group that reads the queue and sends the data to the API. This made sense in their example, because it's a command line program.

Nonetheless, when I tried this approach with Mesop, I ran into issues with the queue filling up (this queue is set to a max of five entries) and also an issue where the queue was not read immediately. There was a long delay which led to delayed responses from the API.

I never figured out the exact reason for that. Thankfully, just calling the websocket directly worked fine.

## 3 Video

After getting audio to work, getting video to work was relatively straightforward. I imagine screenshare would also be fairy easy to do and fairly similar to video.

For video, I think the main things here are to limit the FPS. Especially for this scenario where not much will be changing in the background, sending 30-60 FPS is overkill. So we just send two FPS.

There's also a step to pre-process the frames using canvas, which is an old and common technique. I used this in [Too Many Cooks](https://github.com/richard-to/too-many-cooks).

Here are some snippets from the Video Recorder web component.

```javascript
async initialize() {
  try {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    this.video.srcObject = this.mediaStream;
    await this.video.play();

    // Wait for video to be ready
    await new Promise((resolve) => {
      this.video.onloadedmetadata = () => {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        resolve();
      };
    });

    // Request a redraw to show the video preview
    this.requestUpdate();
    return true;
  } catch (error) {
    this.error("Error accessing webcam:", error);
    return false;
  }
}

captureFrame() {
  if (!this.mediaStream) {
    this.error("Webcam not started");
    return null;
  }

  // Draw current video frame to canvas
  this.ctx.drawImage(this.video, 0, 0);

  // Convert to JPEG and base64 encode
  const base64Data = this.canvas.toDataURL("image/jpeg", this.quality);

  // Remove the data URL prefix to get just the base64 data
  return base64Data.replace("data:image/jpeg;base64,", "");
}

start() {
  this.isStreaming = true;

  // Start capturing frames at specified FPS
  const intervalMs = 1000 / this.fps;
  this.captureInterval = setInterval(() => {
    const base64Frame = this.captureFrame();
    if (base64Frame) {
      this.dispatchEvent(
        new MesopEvent(this.dataEvent, {
          data: base64Frame,
        })
      );
    }
  }, intervalMs);

  return true;
}

stop() {
  this.isStreaming = false;
  this.isRecording = false;

  if (this.captureInterval) {
    clearInterval(this.captureInterval);
    this.captureInterval = null;
  }

  if (this.mediaStream) {
    this.mediaStream.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }

  // Clear video source
  if (this.video.srcObject) {
    this.video.srcObject = null;
  }
}
```

# 4 Tool usage

One problem that I knew I would need to handle for Mesop Jeopardy Live was the question of how to keep the game state in sync with the Gemini Live API.

The current version of the API has the limitation of only being able to handle one modality. So it's not possible to do both Audio and Text. This meant, we can't get a text respnse with some JSON out to use for updating the Mesop UI when we are in audio mode.

Luckily, custom tools is a way to get around this issue.

Custom tools aren't technically called by Gemini. They just send the signature of the function call and the Mesop backend would need to handle the function call. This in theory works great since we can update the Mesop state based on the parameters sent by the API.

So to check if this idea would work, I created a simple demo with a custom tool for selecting boxes.

For the tool demo, I used this example code as reference - [https://github.com/google-gemini/cookbook/blob/main/gemini-2/live_api_tool_use.ipynb](https://github.com/google-gemini/cookbook/blob/main/gemini-2/live_api_tool_use.ipynb).

## 4.1 Defining a custom tool

The tool definition needs to be added during initial configuration of the API.

It's relatively straightforward and uses JSON schema.

```python
async def startup(self):
  setup_msg = {
    "setup": {
      "model": f"models/{_MODEL}",
      "system_instruction": {"role": "user", "parts": [{"text": _SYSTEM_INSTRUCTIONS}]},
      "tools": [
        {
          "functionDeclarations": [
            {
              "name": "pick_box",
              "description": "Picks the box by name",
              "parameters": {
                "type": "OBJECT",
                "properties": {"box_name": {"type": "STRING", "description": "Name of the box"}},
                "required": ["box_name"],
              },
            }
          ]
        }
      ],
      "generation_config": {
        "response_modalities": ["audio"],
        "speech_config": {"voice_config": {"prebuilt_voice_config": {"voice_name": "Puck"}}},
      },
    }
  }
  await self.ws.send(json.dumps(setup_msg))
  raw_response = await self.ws.recv(decode=False)
  json.loads(raw_response.decode("ascii"))
```

## 4.2 Handling function calls

Handling function calls is relatively straight forward as well.

```python
async def handle_tool_call(self, tool_call):
  state = me.state(State)
  for fc in tool_call["functionCalls"]:
    if fc["name"] == "pick_box":
      response = ""
      if fc["args"]["box_name"] not in state.boxes:
        response = "No box found"
      elif fc["args"]["box_name"] in state.opened_boxes:
        response = "You already opened that box"
      else:
        response = state.boxes[fc["args"]["box_name"]]
        state.opened_boxes.add(fc["args"]["box_name"])

      msg = {
        "tool_response": {
          "function_responses": [
            {
              "id": fc["id"],
              "name": fc["name"],
              "response": {
                "result": response,
              },
            }
          ]
        }
      }
      await self.ws.send(json.dumps(msg))
```

In the above snippet, the main thing to see is how we update the Mesop state. The state won't be reflected in the UI until there is a yield. Luckily the yield will come as a soon as the API responds with an audio chunk.

We also send back the tool response to give Gemini context. In this case we give Gemini context on what happend. Does the box exist? Is it already open? And what question was in the box?

The tool call response is parsed out when data is received from the websocket.

```python
async def receive_audio(self):
  """Process the audio responses returned by Gemini"""
  async for raw_response in self.ws:
    # Other things could be returned here, but we'll ignore those for now.
    response = json.loads(raw_response.decode("ascii"))

    # [Code to process audio input]

    tool_call = response.pop("toolCall", None)
    if tool_call is not None:
      await self.handle_tool_call(tool_call)
```

# 5 Screenshot

<img width="1307" alt="Screenshot 2025-02-09 at 12 58 48 PM" src="https://github.com/user-attachments/assets/54a2df88-9053-490c-955e-243a76c0ae1d" />

# 6 Repository

The code can be found at [https://github.com/richard-to/mesop-gemini-2-experiments](https://github.com/richard-to/mesop-gemini-2-experiments]).
