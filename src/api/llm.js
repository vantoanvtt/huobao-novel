import axios from 'axios'

// LLM API service
// Handles all AI model interactions

/**
 * Create chat completion request
 */
export async function chatCompletion(config, prompt, onStream = null) {
  const { baseUrl, apiKey, model, temperature, maxTokens, timeout } = config

  const requestBody = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    max_tokens: maxTokens,
    stream: !!onStream
  }

  if (onStream) {
    // Streaming response
    return streamCompletion(baseUrl, apiKey, requestBody, timeout, onStream)
  }

  // Non-streaming response
  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    requestBody,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: timeout * 1000
    }
  )

  return response.data.choices[0].message.content
}

/**
 * Stream completion with callback
 */
async function streamCompletion(baseUrl, apiKey, requestBody, timeout, onStream) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter(line => line.trim() !== '')

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content || ''
          if (content) {
            fullContent += content
            onStream(content, fullContent)
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }

  return fullContent
}

/**
 * Clean AI response - remove markdown formatting
 */
export function cleanResponse(text) {
  if (!text) return ''

  // Remove markdown code blocks
  let cleaned = text.replace(/```[\s\S]*?```/g, '')
  cleaned = cleaned.replace(/`/g, '')

  // Trim whitespace
  cleaned = cleaned.trim()

  return cleaned
}
