'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {validHeadThumbs,isCodexLogin,isSubmittedCodexReview,isCodexGraphqlAuthor,openCodexFindings,collectPages,flattenSlurped}=require('../policy-fit/review-evidence');
const user={login:'chatgpt-codex-connector[bot]'};
const summary=(head,status='completed')=>({user,updated_at:'2026-10-04T10:00:00Z',body:'<!-- codex-security-review:v1 '+JSON.stringify({headSha:head,status})+' -->\n**Code Review** | \u2705 **Completed**'});
const reaction=time=>({user,content:'+1',created_at:time});
test('old-head thumbs up cannot qualify a newer unpublished local commit',()=>{
 assert.deepEqual(validHeadThumbs('new',[reaction('2026-10-04T10:01:00Z')],[summary('old')]),[]);
 assert.deepEqual(validHeadThumbs('new',[reaction('2026-10-04T09:59:00Z')],[summary('new')]),[]);
});
test('thumbs up requires exact-head completed review evidence and follows its timestamp',()=>{
 const r=reaction('2026-10-04T10:01:00Z');assert.deepEqual(validHeadThumbs('new',[r],[summary('new')]),[r]);
 assert.deepEqual(validHeadThumbs('new',[r],[summary('new','running')]),[]);
});
test('only the exact Codex bot login is accepted, not a lookalike containing it',()=>{
 assert.equal(isCodexLogin('chatgpt-codex-connector[bot]'),true);
 for(const forged of ['chatgpt-codex-connector-evil','xchatgpt-codex-connector[bot]','chatgpt-codex-connector','CHATGPT-CODEX-CONNECTOR[BOT]','',undefined,null])assert.equal(isCodexLogin(forged),false,String(forged));
 const evil={login:'chatgpt-codex-connector-evil'};
 const forgedSummary={...summary('new'),user:evil},forgedReaction={...reaction('2026-10-04T10:01:00Z'),user:evil};
 assert.deepEqual(validHeadThumbs('new',[forgedReaction],[forgedSummary]),[],'forged summary plus forged thumbs must not approve');
 assert.deepEqual(validHeadThumbs('new',[forgedReaction],[summary('new')]),[],'a real summary does not legitimize a forged reaction');
 assert.deepEqual(validHeadThumbs('new',[reaction('2026-10-04T10:01:00Z')],[forgedSummary]),[],'a real reaction does not legitimize a forged summary');
});
test('a Codex review counts only once submitted and not dismissed',()=>{
 const base={user,state:'COMMENTED',submitted_at:'2026-10-04T10:00:00Z',commit_id:'new'};
 assert.equal(isSubmittedCodexReview(base),true);
 assert.equal(isSubmittedCodexReview({...base,state:'APPROVED'}),true);
 assert.equal(isSubmittedCodexReview({...base,state:'PENDING',submitted_at:undefined}),false,'a draft review is not a review');
 assert.equal(isSubmittedCodexReview({...base,state:'PENDING'}),false,'PENDING is never submitted even with a timestamp');
 assert.equal(isSubmittedCodexReview({...base,submitted_at:null}),false);
 assert.equal(isSubmittedCodexReview({...base,state:'DISMISSED'}),false);
 assert.equal(isSubmittedCodexReview({...base,user:{login:'chatgpt-codex-connector-evil'}}),false);
 assert.equal(isSubmittedCodexReview({...base,user:null}),false);
});
test('GraphQL review-thread authors are matched as the exact Bot, not by substring',()=>{
 assert.equal(isCodexGraphqlAuthor({__typename:'Bot',login:'chatgpt-codex-connector'}),true);
 for(const forged of [{__typename:'User',login:'chatgpt-codex-connector'},{__typename:'Bot',login:'chatgpt-codex-connector-evil'},{__typename:'Bot',login:'chatgpt-codex-connector[bot]'},{login:'chatgpt-codex-connector'},null,undefined])assert.equal(isCodexGraphqlAuthor(forged),false,JSON.stringify(forged));
});
test('a resolved Codex finding is cleared only when someone else answered in the thread',()=>{
 const codexAuthor={__typename:'Bot',login:'chatgpt-codex-connector'},owner={__typename:'User',login:'eluckey2002'};
 const thread=(isResolved,...nodes)=>({id:'t',isResolved,comments:{nodes}});
 const finding={author:codexAuthor,body:'P1 finding'};
 assert.equal(openCodexFindings([thread(false,finding)]).length,1,'unresolved stays open');
 assert.equal(openCodexFindings([thread(true,finding)]).length,1,'resolved with no reply stays open');
 assert.equal(openCodexFindings([thread(true,finding,{author:codexAuthor,body:'follow-up'})]).length,1,'a second Codex comment is not an answer');
 assert.equal(openCodexFindings([thread(true,finding,{author:null,body:'x'})]).length,1,'a deleted-author comment is not an answer');
 assert.equal(openCodexFindings([thread(true,finding,{author:owner,body:'   '})]).length,1,'an empty reply is not an answer');
 assert.equal(openCodexFindings([thread(true,finding,{author:owner,body:'Fixed in abc123'})]).length,0,'resolved with a written reply is cleared');
 assert.equal(openCodexFindings([thread(false,finding,{author:owner,body:'Fixed in abc123'})]).length,1,'replied but unresolved stays open');
 assert.equal(openCodexFindings([thread(true,finding,{author:owner,body:'Fixed in abc123'},{author:codexAuthor,body:'still insufficient'})]).length,1,'an answer to an earlier comment does not answer a later Codex comment');
 assert.equal(openCodexFindings([thread(true,finding,{author:owner,body:'Fixed in abc123'},{author:codexAuthor,body:'still insufficient'},{author:owner,body:'Now also fixed in def456'})]).length,0,'a reply after the latest Codex comment clears it');
 assert.equal(openCodexFindings([thread(false,{author:owner,body:'human-only thread'})]).length,0,'threads Codex did not start are not Codex findings');
});
test('lists are read to the end, and anything incomplete fails closed',()=>{
 const pages={null:{nodes:[1,2],pageInfo:{hasNextPage:true,endCursor:'a'}},a:{nodes:[3],pageInfo:{hasNextPage:true,endCursor:'b'}},b:{nodes:[4],pageInfo:{hasNextPage:false,endCursor:null}}};
 const seen=[];
 assert.deepEqual(collectPages(after=>{seen.push(after);return pages[after];}),[1,2,3,4],'every page is read');
 assert.deepEqual(seen,[null,'a','b']);
 assert.deepEqual(collectPages(after=>pages[after],{after:'a'}),[3,4],'resumes from a given cursor');
 assert.throws(()=>collectPages(()=>({nodes:[1]})),/incomplete page/,'no pageInfo');
 assert.throws(()=>collectPages(()=>({pageInfo:{hasNextPage:false}})),/incomplete page/,'no nodes');
 assert.throws(()=>collectPages(()=>null),/incomplete page/,'no page');
 assert.throws(()=>collectPages(()=>({nodes:[1],pageInfo:{hasNextPage:true,endCursor:null}})),/without a cursor/,'more pages but no cursor');
 assert.throws(()=>collectPages(()=>({nodes:[1],pageInfo:{hasNextPage:true,endCursor:'x'}}),{maxPages:3}),/more than 3 pages/,'a runaway list does not loop forever');
 assert.deepEqual(flattenSlurped([[1,2],[3],[]]),[1,2,3]);
 assert.throws(()=>flattenSlurped({a:1}),/not a list of pages/);
 assert.throws(()=>flattenSlurped([[1],{b:2}]),/not a list of pages/);
 // A real finding past the first 100 threads must still be seen.
 const first=Array.from({length:100},(_,i)=>({id:'b'+i,isResolved:true,comments:{nodes:[{author:{__typename:'User',login:'someone'},body:'benign'}]}}));
 const late={id:'late',isResolved:false,comments:{nodes:[{author:{__typename:'Bot',login:'chatgpt-codex-connector'},body:'P1'}]}};
 const threadPages={null:{nodes:first,pageInfo:{hasNextPage:true,endCursor:'c'}},c:{nodes:[late],pageInfo:{hasNextPage:false,endCursor:null}}};
 assert.deepEqual(openCodexFindings(collectPages(after=>threadPages[after])).map(t=>t.id),['late'],'a finding on page 2 is not dropped');
 assert.deepEqual(openCodexFindings(first),[], 'the first page alone would have missed it');
});
