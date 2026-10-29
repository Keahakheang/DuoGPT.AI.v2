'use strict';

const {generateReply, verifyAccess, AppError} = require('../lib/ai.cjs');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') return res.status(405).json({error: 'Use POST.'});
  if (!verifyAccess(process.env.CHAT_ACCESS_CODE, req.headers && req.headers['x-shopwise-code'])) {
    return res.status(401).json({error: 'Enter the Shopwise chat access code to continue.'});
  }

  let input = req.body;
  if (typeof input === 'string') {
    try {
      input = JSON.parse(input);
    } catch (_) {
      return res.status(400).json({error: 'Invalid JSON.'});
    }
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return res.status(400).json({error: 'Invalid message format.'});
  if (Buffer.byteLength(JSON.stringify(input)) > 22000) return res.status(413).json({error: 'Request is too large.'});

  try {
    return res.status(200).json({reply: await generateReply(input)});
  } catch (err) {
    return res.status(err instanceof AppError ? err.status : 500).json({
      error: err instanceof AppError ? err.message : 'Unexpected AI service error.'
    });
  }
};
