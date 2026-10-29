const test = require('node:test');
const assert = require('node:assert/strict');
const statusHandler = require('../api/status.js');
const chatHandler = require('../api/chat.js');
const searchHandler = require('../api/search.js');

function responseMock() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('Vercel status function reports server configuration', () => {
  const res = responseMock();
  statusHandler({method: 'GET'}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.provider, 'OpenAI-compatible API');
  assert.equal(res.body.aiConfigured, !!process.env.OPENAI_API_KEY);
});

test('Vercel chat function proxies a reply without exposing the key', async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  const oldFetch = global.fetch;
  process.env.OPENAI_API_KEY = 'test-key';
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://newapi.omgteam.me/v1/chat/completions');
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    return {ok: true, json: async () => ({choices: [{message: {content: 'Hello!'}}]})};
  };
  try {
    const res = responseMock();
    await chatHandler({method: 'POST', headers: {}, body: {message: 'Hi'}}, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {reply: 'Hello!'});
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});

test('Vercel product search explains missing optional search provider', async () => {
  const oldKey = process.env.SERPAPI_KEY;
  delete process.env.SERPAPI_KEY;
  try {
    const res = responseMock();
    await searchHandler({method: 'GET', headers: {}, query: {q: 'oats'}}, res);
    assert.equal(res.statusCode, 503);
    assert.match(res.body.error, /retailer search links/);
  } finally {
    if (oldKey === undefined) delete process.env.SERPAPI_KEY;
    else process.env.SERPAPI_KEY = oldKey;
  }
});
