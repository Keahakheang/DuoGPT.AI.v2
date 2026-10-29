'use strict';

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({error: 'Use GET.'});
  return res.status(200).json({
    aiConfigured: !!process.env.OPENAI_API_KEY,
    requiresCode: !!process.env.CHAT_ACCESS_CODE,
    provider: 'OpenAI-compatible API',
    shoppingConfigured: !!process.env.OPENAI_API_KEY,
    shoppingRequiresCode: !!process.env.SEARCH_ACCESS_CODE,
    shoppingSource: 'OpenAI web search',
    liveRetailersConnected: false
  });
};
