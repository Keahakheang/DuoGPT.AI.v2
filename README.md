# Shopwise — Singapore shopping search

Product comparisons use the configured OpenAI-compatible API with the Responses API `web_search` tool. Results are accepted only when the API returns a completed web search and citation annotations matching product links. The model/provider must support Responses API web search and structured JSON output; a chat-completions-only gateway will not work for this feature.

Listings can be incomplete, stale, or mismatched; verify the source link and final checkout total. Shopwise does not have official account integrations with retailers. Delivery, vouchers and stock are not guaranteed. Saved shopping list is not a retailer checkout/cart.

## Deploy on Vercel

Import this repository into Vercel with the project root set to this folder and the **Other** framework preset. Leave the build command blank, set the output directory to `public`, and Vercel will deploy the server-side API handlers in `api/`.

Add these in **Vercel → Project → Settings → Environment Variables**:

- Name: `OPENAI_API_KEY`; Value: your provider key (secret; server-side only). Enter the name and value in their separate fields—do not include `=` or quotes.
- `OPENAI_BASE_URL`: `https://newapi.omgteam.me/v1`
- `OPENAI_MODEL`: `gpt-5.6-luna`

Redeploy after changing environment variables. Check `/api/status` to verify the server sees the key; this only confirms it is set, not that the provider accepts the key or model.

Chat and product search use the same API key, base URL, and model. Product search additionally requires your API provider to support the OpenAI Responses API `web_search` tool. If it does not, Shopwise shows a setup error and provides retailer search links; it does not invent prices. No `SERPAPI_KEY` is needed.

The Netlify Functions and local Node server remain supported as well.

### Verify backend

Open `https://YOUR-SITE/api/status` to check whether the server sees the configured API key. This confirms presence only, not whether the provider accepts it.

Try a product search and open each cited retailer link to check its current price and availability.

If there is a problem, check your deployment platform's function logs. Do not share logs containing secrets.

## Local development

Node.js 20+ required, no npm dependencies. In your terminal:

```sh
cd "shopwise_demo 2"
export OPENAI_API_KEY="your_provider_api_key"
export OPENAI_BASE_URL="https://newapi.omgteam.me/v1"
export OPENAI_MODEL="gpt-5.6-luna"
npm start
```

Open http://localhost:3000. Run automated tests with `npm test`.

## Security / scalability notes

- Third-party API keys are used **server-side only**; never embed them into `app.js` or `index.html`.
- Published product links are checked to be HTTPS; externally sourced text is escaped before display.
- Client storage contains notes and shortlist; it is local to the browser, not a synced user account.
- Five-minute in-memory cache helps local throughput, but serverless instances may not share cache.
- A shared access code is only a basic guard. A public production service needs persistent per-user rate limiting, authentication, usage caps, logging and vendor terms compliance. Consider Netlify platform controls and a durable database before scaling.
- Never collect store usernames/passwords, payment card data, or secretly access retailer accounts. Real retailer cart or voucher support requires an approved integration and the user's consent.
- Review search shortcuts open YouTube / Google results; reviews are **not** automatically analyzed.

## Sources

- OpenAI web search: https://developers.openai.com/api/docs/guides/tools-web-search
- Netlify: https://docs.netlify.com/build/functions/overview/
