const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Default voice ID (Sikedewi - Young Indonesian Woman, Very Clear)
// Fallback: Marizka (WALVsLZpjUuIGhgYInuz - Energetic, Friendly)
const DEFAULT_VOICE_ID = 'yLyL4E4r0QfLyYpCwPir'; 
const FALLBACK_VOICE_ID = 'WALVsLZpjUuIGhgYInuz';



// Ensure audio directory exists
const AUDIO_DIR = path.join(__dirname, '../uploads/audio');
if (!fs.existsSync(AUDIO_DIR)){
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

exports.speak = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      console.error('[TTS_ERROR] Request received but "text" is missing. Body:', req.body);
      return res.status(400).json({ message: 'Text is required' });
    }

    // 1. Generate unique filename based on text content (Cache Key)
    // We use MD5 hash of the text + voiceID to ensure uniqueness
    const textHash = crypto.createHash('md5').update(text + DEFAULT_VOICE_ID).digest('hex');
    const filePath = path.join(AUDIO_DIR, `${textHash}.mp3`);

    // 2. CHECK CACHE: If file exists AND has content, serve it directly
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 0) {
        // console.log('Serving from cache:', text.substring(0, 20) + '...');
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': stats.size
        });
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
        return;
      } else {
        // Delete empty file if it exists
        try {
            fs.unlinkSync(filePath);
            console.log('Deleted empty cache file:', filePath);
        } catch (err) {
            console.error('Error deleting empty cache file:', err);
        }
      }
    }

    // 3. IF NOT CACHED: Call ElevenLabs SDK
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is missing in .env');
      return res.status(500).json({ message: 'Server configuration error: Missing API Key' });
    }

    const client = new ElevenLabsClient({
        apiKey: process.env.ELEVENLABS_API_KEY,
    });

    let audioStream;
    try {
        console.log(`Attempting TTS with Voice ID: ${DEFAULT_VOICE_ID} for text: "${text.substring(0, 20)}..."`);
        audioStream = await client.textToSpeech.convert(
            DEFAULT_VOICE_ID,
            {
                text: text,
                model_id: "eleven_multilingual_v2", 
                output_format: "mp3_44100_128",
                voice_settings: {
                    stability: 0.5,  // Standard stability for clarity
                    similarity_boost: 0.75, // Standard boost
                    style: 0.0, // Neutral style for maximum clarity
                    use_speaker_boost: true
                }
            }
        );
    } catch (voiceError) {
        console.warn(`Voice ID ${DEFAULT_VOICE_ID} failed or API error. Detail:`, voiceError?.body || voiceError.message);
        console.log(`Trying fallback Voice ID: ${FALLBACK_VOICE_ID}`);
        
        try {
            // Fallback to Rachel if primary voice fails (e.g. 404 not found)
            audioStream = await client.textToSpeech.convert(
                FALLBACK_VOICE_ID,
                {
                    text: text,
                    model_id: "eleven_multilingual_v2",
                    output_format: "mp3_44100_128",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        style: 0.0,
                        use_speaker_boost: true
                    }
                }
            );
        } catch (fallbackError) {
             console.error('Fallback Voice ID also failed:', fallbackError?.body || fallbackError.message);
             // Return 500 but with more detail so client can fallback to WebSpeech
             return res.status(500).json({ 
                 message: 'TTS Provider Error', 
                 detail: fallbackError?.body || fallbackError.message 
             });
        }
    }

    // 4. Buffer the stream to handle it easily
    const chunks = [];
    for await (const chunk of audioStream) {
        chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    if (audioBuffer.length === 0) {
        throw new Error("Received empty audio buffer from ElevenLabs");
    }

    // Save to file (Cache)
    fs.writeFileSync(filePath, audioBuffer);

    // Send to response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length
    });
    
    res.send(audioBuffer);

  } catch (error) {
    console.error('ElevenLabs TTS Error:', error);
    res.status(500).json({ 
      message: 'Failed to generate speech', 
      error: error.message || 'Unknown error'
    });
  }
};
