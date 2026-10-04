'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {validHeadThumbs}=require('../policy-fit/review-evidence');
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
