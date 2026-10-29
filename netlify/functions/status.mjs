export default async function handler(request){
 if(request.method!=='GET')return Response.json({error:'Use GET.'},{status:405});
 return Response.json({aiConfigured:!!process.env.OPENAI_API_KEY,requiresCode:!!process.env.CHAT_ACCESS_CODE,provider:'OpenAI-compatible API',shoppingConfigured:!!process.env.OPENAI_API_KEY,shoppingRequiresCode:!!process.env.SEARCH_ACCESS_CODE,shoppingSource:'OpenAI web search',liveRetailersConnected:false},{headers:{'Cache-Control':'no-store'}});
}
