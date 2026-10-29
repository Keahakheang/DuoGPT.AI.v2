'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {ShoppingError,normalizeStore,normalizeResult,validateQuery,searchShopping,authorized}=require('../lib/shopping.cjs');

const fairPriceUrl='https://www.fairprice.com.sg/product/rolled-oats-1kg';
function response(products=[{title:'Brand Oats 1 kg',merchant:'FairPrice',price:5.95,old_price:7,url:fairPriceUrl,source:'FairPrice product listing',delivery:'Delivery varies',rating:4.5}]){
 return {
   output:[
     {type:'web_search_call',status:'completed',action:{type:'search',query:'Singapore rolled oats 1kg price'}},
     {type:'message',content:[{type:'output_text',text:JSON.stringify({products}),annotations:[{type:'url_citation',url:fairPriceUrl,title:'FairPrice listing'}]}]}
   ]
 };
}
const mock=async()=>({ok:true,status:200,json:async()=>response()});

test('validates query and blocks age-restricted products',()=>{assert.equal(validateQuery(' rolled   oats 1kg '),'rolled oats 1kg');assert.throws(()=>validateQuery(''),e=>e.status===400);assert.throws(()=>validateQuery('vape'),e=>e.status===400)});
test('token code constant-time verification logic',()=>{assert.equal(authorized('abcd','abcd'),true);assert.equal(authorized('abcd','oops'),false);assert.equal(authorized('abcd','abcde'),false)});
test('retailer classification',()=>{assert.equal(normalizeStore('NTUC FairPrice'),'FairPrice');assert.equal(normalizeStore('Shopee Singapore'),'Shopee')});
test('normalizes prices safely and computes only actual markdowns',()=>{const s=normalizeResult({title:'Brand Oats 1 kg',source:'FairPrice',extracted_price:5.95,extracted_old_price:7,link:fairPriceUrl},0);assert.equal(s.discount,15);assert.equal(s.price,5.95);assert.equal(s.merchant,'FairPrice');assert.equal(normalizeResult({title:'No URL',source:'Store',price:'S$2',link:'javascript:alert(1)'},0),null)});
test('missing OpenAI key returns a clear setup error',async()=>{await assert.rejects(()=>searchShopping('oats',{},mock),e=>e.status===503&&e.message.includes('OPENAI_API_KEY'))});
test('uses Responses web_search and returns only cited product URLs',async()=>{
 let requestUrl,requestOptions;
 const data=response([
   {title:'Brand Oats 1 kg',merchant:'FairPrice',price:5.95,old_price:7,url:fairPriceUrl,source:'FairPrice',delivery:'Delivery varies',rating:4.5},
   {title:'Uncited product',merchant:'Shopee',price:3,url:'https://shopee.sg/product/2',source:'Shopee',delivery:'',rating:null}
 ]);
 const result=await searchShopping('rolled oats 1kg',{OPENAI_API_KEY:'test-key'},async(url,options)=>{requestUrl=url;requestOptions=options;return {ok:true,status:200,json:async()=>data}});
 assert.equal(requestUrl,'https://newapi.omgteam.me/v1/responses');
 assert.equal(requestOptions.headers.Authorization,'Bearer test-key');
 const sent=JSON.parse(requestOptions.body);
 assert.equal(sent.model,'gpt-5.6-luna');
 assert.equal(sent.tools[0].type,'web_search');
 assert.equal(result.products.length,1);
 assert.equal(result.products[0].price,5.95);
 assert.equal(result.products[0].merchant,'FairPrice');
 assert.equal(result.source,'OpenAI web search');
 assert.equal(result.cached,false);
 const cached=await searchShopping('rolled oats 1kg',{OPENAI_API_KEY:'test-key'},()=>{throw Error('must use cache')});
 assert.equal(cached.cached,true);
});
test('reports provider web-search incompatibility clearly',async()=>{
 const unsupported=async()=>({ok:false,status:404});
 await assert.rejects(()=>searchShopping('milk',{OPENAI_API_KEY:'test-key'},unsupported),e=>e.status===503&&e.message.includes('Responses API web_search'));
});
test('requires a completed web search',async()=>{
 await assert.rejects(()=>searchShopping('milk',{OPENAI_API_KEY:'test-key'},async()=>({ok:true,json:async()=>({output:[]})})),e=>e.status===503&&e.message.includes('no completed web search'));
});
