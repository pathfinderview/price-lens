import{test}from'node:test';import assert from'node:assert/strict';import{parseAmount,extractPrices,convert}from'../src/core.js';
test('parses travel price conventions',()=>{for(const [s,n]of [['589',589],['1,234.56',1234.56],['1.234,56',1234.56],['1 234,50',1234.5],['₹1,25,000',125000],['0.589',null],['18,52',18.52],['1,234',1234],['0',0]])assert.equal(parseAmount(s),n,s)});
test('rejects invalid and negative input',()=>{for(const s of ['','abc','1e3','1+2','-20','1.2.3','99999999999999'])assert.equal(parseAmount(s),null,s)});
test('finds deduplicated candidate prices',()=>{assert.deepEqual(extractPrices('THB 589.00\nTHB 589.00\nSALE 1,250.50').map(x=>x.value),[589,1250.5])});
test('conversion requires valid amount and rate',()=>{assert.equal(convert(589,2.5),1472.5);assert.equal(convert(null,2),null);assert.equal(convert(10,0),null)});
