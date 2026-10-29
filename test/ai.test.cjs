const test = require('node:test');
const assert = require('node:assert/strict');
const {verifyAccess, validateInput, generateReply, DEFAULT_MODEL, PROVIDER_URL} = require('../lib/ai.cjs');

test('Access code validation', () => {
  assert.equal(verifyAccess(undefined, undefined), true);
  assert.equal(verifyAccess('supersecret', 'supersecret'), true);
  assert.equal(verifyAccess('supersecret', 'wrong'), false);
});
test('Reject empty message and invalid input', () => {
  assert.throws(() => validateInput({message: ''}), /Message must/);
  assert.throws(() => validateInput(null), /format/);
  assert.throws(() => validateInput({message:'x'.repeat(2001)}), /Message must/);
});
test('OpenAI-compatible request supports conversation with shopping context', async () => {
  let outgoing;
  const fakeFetch = async (url, options) => {
    assert.equal(url, PROVIDER_URL);
    assert.equal(options.headers.Authorization, 'Bearer test-api-key');
    outgoing = JSON.parse(options.body);
    return {ok: true, json: async () => ({choices: [{message: {content: '7'}}]})};
  };
  const result = await generateReply({message:'What is 3 + 4?',history:[{role:'user',text:'Help with math'}],context:{selectedProduct:'oats',offers:[{store:'FairPrice',itemPriceSGD:5.95,title:'Rolled oats 1kg',sourceUrl:'https://example.com/oats'}],isSearchData:true}},{OPENAI_API_KEY:'test-api-key'},fakeFetch);
  assert.equal(result, '7');
  assert.equal(outgoing.model, DEFAULT_MODEL);
  assert.equal(outgoing.messages.at(-1).content, 'What is 3 + 4?');
  assert.equal(outgoing.messages[2].content, 'Help with math');
  assert.match(outgoing.messages[1].content,/third-party listings/);
  assert.equal(outgoing.stream, false);
});
test('Missing API key returns a friendly error', async () => {
  await assert.rejects(generateReply({message: 'Hello'}, {}, ()=>{}), /OPENAI_API_KEY/);
});
test('Provider authorization and account errors are friendly', async () => {
  await assert.rejects(generateReply({message:'Hi'}, {OPENAI_API_KEY:'test-key'},async()=>({ok:false,status:402})), /insufficient credits/);
  await assert.rejects(generateReply({message:'Hi'}, {OPENAI_API_KEY:'test-key'},async()=>({ok:false,status:403})), /rejected this request/);
});
test('Rate limiting and invalid API keys return useful errors', async () => {
  await assert.rejects(generateReply({message:'Hi'}, {OPENAI_API_KEY:'test-key'},async()=>({ok:false,status:429})), /limit reached/);
  await assert.rejects(generateReply({message:'Hi'}, {OPENAI_API_KEY:'test-key'},async()=>({ok:false,status:401})), /API key was rejected/);
});
test('Provider URL and model can be configured', async () => {
  const fakeFetch = async (url,opts) => {
    assert.equal(url,'https://api.example.test/v1/chat/completions');
    assert.equal(JSON.parse(opts.body).model,'custom-model');
    return {ok:true,json:async()=>({choices:[{message:{content:'Hello!'}}]})};
  };
  assert.equal(await generateReply({message:'Hi'}, {OPENAI_API_KEY:'test-key',OPENAI_BASE_URL:'https://api.example.test/v1/',OPENAI_MODEL:'custom-model'},fakeFetch),'Hello!');
});
