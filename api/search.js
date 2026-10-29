'use strict';

const {searchShopping, ShoppingError, authorized} = require('../lib/shopping.cjs');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).json({error: 'Use GET.'});
  if (!authorized(process.env.SEARCH_ACCESS_CODE, req.headers && req.headers['x-shopwise-search-code'])) {
    return res.status(401).json({error: 'Enter the search access code configured by the site owner.', code: 'ACCESS_CODE_REQUIRED'});
  }

  try {
    const result = await searchShopping(req.query && req.query.q);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err instanceof ShoppingError ? err.status : 500).json({
      error: err instanceof ShoppingError ? err.message : 'Shopping search failed.'
    });
  }
};
