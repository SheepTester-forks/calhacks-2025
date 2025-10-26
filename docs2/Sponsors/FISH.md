Known issue: Fish API does not have CORS enabled, so it must be called from the backend.

Run this [cURL](https://curl.se/) command to generate your first speech:

```bash
curl -X POST https://api.fish.audio/v1/tts\
  -H "Authorization: Bearer $FISH_API_KEY"\
  -H "Content-Type: application/json"\
  -H "model: s1"\
  -d '{
    "text": "Hello! Welcome to Fish Audio. This is my first AI-generated voice.",
    "format": "mp3"
  }'\
  --output welcome.mp3

```

# Create a Voice Clone - Create a voice clone model

```js
const url = 'https://api.fish.audio/model';
const form = new FormData();
form.append('visibility', 'public');
form.append('type', 'tts');
form.append('title', '<string>');
form.append('description', '<string>');
form.append('train_mode', 'fast');
form.append('texts', '<string>');
form.append('tags', '<string>');
form.append('enhance_audio_quality', 'false');
form.append('cover_image', '{
  "fileName": "example-file"
}');

const options = {method: 'POST', headers: {Authorization: 'Bearer <token>'}};

options.body = form;

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error);
}
```

required: type, title, train_mode, voices

Since this endpoint requires uploading file, it only accepts `multipart/form-data` and `application/msgpack`.

type

enum<string>

required

Model type, tts is for text to speech

Available options:

| Title | Const |
| Type | `tts` |

# Generate Speech - Generate realistic speech

```js
const url = 'https://api.fish.audio/v1/tts';
const options = {
  method: 'POST',
  headers: {
    model: '<model>',
    Authorization: 'Bearer <token>',
    'Content-Type': 'application/json',
  },
  body: '{"text":"<string>","temperature":0.9,"top_p":0.9,"references":[{"text":"<string>"}],"reference_id":"<string>","prosody":{"speed":1,"volume":0},"chunk_length":200,"normalize":true,"format":"mp3","sample_rate":123,"mp3_bitrate":128,"opus_bitrate":32,"latency":"normal"}',
};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error);
}
```

This endpoint only accepts `application/json` and `application/msgpack`.For best results, upload reference audio using the [create model](https://docs.fish.audio/api-reference/endpoint/model/create-model) before using this one. This improves speech quality and reduces latency.To upload audio clips directly, without pre-uploading, serialize the request body with MessagePack as per the [instructions](https://docs.fish.audio/text-to-speech/msgpack).

Audio formats supported:

- WAV / PCM
  - Sample Rate: 8kHz, 16kHz, 24kHz, 32kHz, 44.1kHz
  - Default Sample Rate: 44.1kHz
  - 16-bit, mono
- MP3
  - Sample Rate: 32kHz, 44.1kHz
  - Default Sample Rate: 44.1kHz
  - mono
  - Bitrate: 64kbps, 128kbps (default), 192kbps
- Opus
  - Sample Rate: 48kHz
  - Default Sample Rate: 48kHz
  - mono
  - Bitrate: -1000 (auto), 24kbps, 32kbps (default), 48kbps, 64kbps

required: model, text

model

enum<string>

default:s1

required

Specify which TTS model to use. We recommend `s1`

Available options:

`s1`,

`speech-1.6`,

`speech-1.5`

# Real-time Streaming - WebSocket for real-time streaming

Basic Streaming
Stream text and receive audio in real-time:

```py
from fish_audio_sdk import WebSocketSession, TTSRequest

# Create WebSocket session
ws_session = WebSocketSession("your_api_key")

# Define text generator
def text_stream():
    yield "Hello, "
    yield "this is "
    yield "streaming text!"

# Stream and save audio
with ws_session:
    with open("output.mp3", "wb") as f:
        for audio_chunk in ws_session.tts(
            TTSRequest(text=""),  # Empty text for streaming
            text_stream()
        ):
            f.write(audio_chunk)
```

Using Voice Models
Stream with a specific voice:

```py
request = TTSRequest(
    text="",  # Empty for streaming
    reference_id="your_model_id",
    format="mp3"
)

def text_stream():
    yield "This uses "
    yield "my custom voice!"

with ws_session:
    for audio_chunk in ws_session.tts(request, text_stream()):
        # Process audio chunks
        pass
```

Dynamic Text Generation
Stream text as it’s generated:

```py
def generate_text():
    # Simulate dynamic text generation
    responses = [
        "Processing your request...",
        "Here's what I found:",
        "The answer is 42."
    ]

    for response in responses:
        # Split into smaller chunks for smoother streaming
        words = response.split()
        for word in words:
            yield word + " "

with ws_session:
    for audio_chunk in ws_session.tts(
        TTSRequest(text=""),
        generate_text()
    ):
        # Process audio in real-time
        pass
```
