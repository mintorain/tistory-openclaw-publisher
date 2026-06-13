const { config } = require('./config');

async function chat(messages, { json = false, temperature = 0.7, maxTokens = 4096 } = {}) {
  const response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.llm.apiKey}`
    },
    body: JSON.stringify({
      model: config.llm.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {})
    })
  });

  if (!response.ok) {
    throw new Error(`LLM API 오류 ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

module.exports = { chat };
