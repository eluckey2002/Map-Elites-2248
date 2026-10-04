'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {validHeadThumbs,isCodexLogin,isSubmittedCodexReview,isCodexGraphqlAuthor}=require('../policy-fit/review-evidence');
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
