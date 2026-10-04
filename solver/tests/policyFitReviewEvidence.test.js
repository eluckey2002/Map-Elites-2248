'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {validHeadThumbs,isCodexLogin,isSubmittedCodexReview,isCodexGraphqlAuthor,openCodexFindings,collectPages,flattenSlurped,headReviewEvidence,validHeadApproval}=require('../policy-fit/review-evidence');
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
 assert.equal(isSubmittedCodexReview({...base,state:'CHANGES_REQUESTED'}),false,'a change request is not completed review evidence');
 assert.equal(isSubmittedCodexReview({...base,state:'SOMETHING_NEW'}),false,'unknown states fail closed');
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
test('the latest same-head Codex review decides, not an earlier accepted one',()=>{
 const r=(id,state,at,head='new',login='chatgpt-codex-connector[bot]')=>({id,user:{login},state,submitted_at:at,commit_id:head});
 const t1='2026-10-04T10:00:00Z',t2='2026-10-04T10:05:00Z',t3='2026-10-04T10:10:00Z';
 assert.deepEqual(headReviewEvidence([r(1,'COMMENTED',t1)],'new').map(x=>x.id),[1]);
 assert.deepEqual(headReviewEvidence([r(1,'APPROVED',t1),r(2,'CHANGES_REQUESTED',t2)],'new'),[],'a later change request invalidates an earlier approval');
 assert.deepEqual(headReviewEvidence([r(2,'CHANGES_REQUESTED',t2),r(1,'APPROVED',t1)],'new'),[],'input order does not matter');
 assert.deepEqual(headReviewEvidence([r(1,'CHANGES_REQUESTED',t1),r(2,'COMMENTED',t2)],'new').map(x=>x.id),[2],'a later completed review supersedes an earlier request');
 assert.deepEqual(headReviewEvidence([r(1,'COMMENTED',t1),r(2,'DISMISSED',t2)],'new'),[],'a later dismissal fails closed');
 assert.deepEqual(headReviewEvidence([r(1,'COMMENTED',t1),r(2,'PENDING',undefined)],'new').map(x=>x.id),[1],'a draft is ignored, not decisive');
 assert.deepEqual(headReviewEvidence([r(1,'COMMENTED',t1,'old')],'new'),[],'a review of another head does not count');
 assert.deepEqual(headReviewEvidence([r(1,'COMMENTED',t1,'new','chatgpt-codex-connector-evil')],'new'),[],'a lookalike does not count');
 assert.deepEqual(headReviewEvidence([r(1,'COMMENTED',t3),r(2,'APPROVED',t3)],'new').map(x=>x.id),[2],'same-instant reviews break ties by id');
});
test('an old thumbs-up does not survive a later negative review of the same head',()=>{
 const codexUser={login:'chatgpt-codex-connector[bot]'};
 const stamp=summary('new'); // updated_at 10:00
 const thumb=at=>({user:codexUser,content:'+1',created_at:at});
 const review=(id,state,at)=>({id,user:codexUser,state,submitted_at:at,commit_id:'new'});
 const early=thumb('2026-10-04T10:01:00Z'),late=thumb('2026-10-04T10:20:00Z');
 assert.deepEqual(validHeadApproval('new',[],[early],[stamp]),[early],'no reviews: a valid thumbs-up counts');
 assert.deepEqual(validHeadApproval('new',[review(1,'COMMENTED','2026-10-04T10:02:00Z')],[early],[stamp]),[early],'a completed latest review does not hide it');
 assert.deepEqual(validHeadApproval('new',[review(1,'CHANGES_REQUESTED','2026-10-04T10:10:00Z')],[early],[stamp]),[],'a later change request invalidates the older thumbs-up');
 assert.deepEqual(validHeadApproval('new',[review(1,'CHANGES_REQUESTED','2026-10-04T10:10:00Z')],[early,late],[stamp]),[late],'a thumbs-up after the request counts');
 assert.deepEqual(validHeadApproval('new',[review(1,'DISMISSED','2026-10-04T10:10:00Z')],[early],[stamp]),[],'a later dismissal fails closed');
 assert.deepEqual(validHeadApproval('new',[review(1,'CHANGES_REQUESTED','2026-10-04T10:10:00Z'),review(2,'COMMENTED','2026-10-04T10:15:00Z')],[early],[stamp]),[early],'a later completed review supersedes the request');
 assert.deepEqual(validHeadApproval('new',[{...review(1,'CHANGES_REQUESTED','2026-10-04T10:10:00Z'),commit_id:'old'}],[early],[stamp]),[early],'a request on another head is irrelevant');
 assert.deepEqual(validHeadApproval('new',[{...review(1,'CHANGES_REQUESTED','2026-10-04T10:10:00Z'),user:{login:'chatgpt-codex-connector-evil'}}],[early],[stamp]),[early],'a lookalike cannot veto');
});
