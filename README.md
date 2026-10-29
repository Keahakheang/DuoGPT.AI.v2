# Shopwise — actual Singapore shopping listings (v4)

**What is real:** When `SERPAPI_KEY` is set, Search requests Singapore-localized Google Shopping listings through SerpApi. Product titles, listed prices, merchants, source links, old prices (if present) and retrieval timestamps come from the response. The app does not contain fictional product offers or fake vouchers.

**What this does not claim:** Shopwise does not have official account integrations with FairPrice, Shopee, Lazada, Amazon SG, Cold Storage or RedMart. Google Shopping indexing is incomplete and results may mix pack sizes. Listed item prices can be stale; no guaranteed final delivery, taxes, checkout price, stock, coupon eligibility, or accurate seller matching. Search shortcuts link out to each real store. Saved shopping list is *not* a retailer checkout/cart.

## Deploy on Vercel

Import this repository into Vercel with the project root set to this folder and the **Other** framework preset. Leave the build command blank, set the output directory to `public`, and Vercel will deploy the server-side API handlers in `api/`.

Add these in **Vercel → Project → Settings → Environment Variables**:

- Name: `OPENAI_API_KEY`; Value: your provider key (secret; server-side only). Enter the name and value in their separate fields—do not include `=` or quotes.
- `OPENAI_BASE_URL`: `https://newapi.omgteam.me/v1`
- `OPENAI_MODEL`: `gpt-5.6-luna`

Redeploy after changing environment variables. Check `/api/status` to verify the server sees the key; this only confirms it is set, not that the provider accepts the key or model.

The chat API and product search are separate. The OpenAI-compatible chat model does not itself provide verified live retailer prices. Without optional `SERPAPI_KEY`, the product search form gives direct retailer search links instead of inventing prices. To show indexed price comparisons, configure `SERPAPI_KEY` as a server-side environment variable. `CHAT_ACCESS_CODE` and `SEARCH_ACCESS_CODE` are optional.

The Netlify Functions and local Node server remain supported as well.

### Verify backend

Open `https://YOUR-SITE/api/status` to check whether the server sees the configured API key. This confirms presence only, not whether the provider accepts it.

Search through the website and look for real listing links. A missing FairPrice or Shopee result means Google Shopping did not return one; it does **not** mean the store has no product.

If there is a problem, check your deployment platform's function logs. Do not share logs containing secrets.

## Local development

Node.js 20+ required, no npm dependencies. In your terminal:

```sh
cd "shopwise_demo 2"
# Optional search provider for indexed price comparisons:
export SERPAPI_KEY="your_secret_key"
# Optional chat configuration:
export OPENAI_API_KEY="your_provider_api_key"
export OPENAI_BASE_URL="https://newapi.omgteam.me/v1"
export OPENAI_MODEL="gpt-5.6-luna"
# optional: export SEARCH_ACCESS_CODE="your_secret_code"
npm start
```

Open http://localhost:3000. Run automated tests with `npm test`.

## Security / scalability notes

- Third-party API keys are used **server-side only**; never embed them into `app.js` or `index.html`.
- Published product links are checked to be HTTPS; externally sourced text is escaped before display.
- Client storage contains notes and shortlist; it is local to the browser, not a synced user account.
- Five-minute in-memory cache helps local throughput, but serverless instances may not share cache. Google/SerpApi may also apply their own caching.
- A shared access code is only a basic guard. A public production service needs persistent per-user rate limiting, authentication, usage caps, logging and vendor terms compliance. Consider Netlify platform controls and a durable database before scaling.
- Never collect store usernames/passwords, payment card data, or secretly access retailer accounts. Real retailer cart or voucher support requires an approved integration and the user's consent.
- Review search shortcuts open YouTube / Google results; reviews are **not** automatically analyzed.

## Sources

- SerpApi: https://serpapi.com/google-shopping-api and https://serpapi.com/pricing
- Netlify: https://docs.netlify.com/build/functions/overview/
- Google Merchant API handles a merchant's own catalog; it does not offer an unrestricted cross-retailer inventory API: https://developers.google.com/merchant/api/reference/rest/products_v1/accounts.products/list
