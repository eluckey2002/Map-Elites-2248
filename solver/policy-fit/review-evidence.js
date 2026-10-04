'use strict';
// Exact login, never a substring: any public account named like
// 'chatgpt-codex-connector-evil' must not be mistaken for the reviewer app.
const CODEX_LOGIN='chatgpt-codex-connector[bot]';
const codex=u=>u===CODEX_LOGIN;
// A review counts only once submitted: PENDING reviews are drafts (no
// submitted_at) and DISMISSED ones were withdrawn.
const submittedCodexReview=r=>codex(r?.user?.login)&&Boolean(r.submitted_at)&&!['PENDING','DISMISSED'].includes(r.state);
function validHeadThumbs(head,reactions,comments){
 const stamps=comments.filter(c=>codex(c.user?.login)).filter(c=>{
  const match=c.body.match(/<!-- codex-security-review:v1 (\{[^\n]+\}) -->/);
  if(!match)return false;
  let state;try{state=JSON.parse(match[1]);}catch{return false;}
  return state.headSha===head&&state.status==='completed'&&c.body.includes('**Code Review** | \u2705 **Completed**');
 });
 return reactions.filter(r=>codex(r.user?.login)&&r.content==='+1'&&stamps.some(c=>r.created_at>=c.updated_at));
}
// GraphQL reports a bot author as {__typename:'Bot', login:'chatgpt-codex-connector'}
// (no '[bot]' suffix, unlike REST), so review threads need their own exact check.
const codexGraphqlAuthor=a=>a?.__typename==='Bot'&&a.login==='chatgpt-codex-connector';
// A thread holds a Codex finding when Codex authored one of its comments. It
// stays open while unresolved, and a resolved one is cleared only when someone
// other than Codex answered AFTER Codex's latest comment (a written rebuttal or
// fix note): resolving alone does not show the finding was addressed, and an
// answer to an earlier comment does not answer a later "still insufficient".
// Thread comments arrive oldest first.
const openCodexFindings=threads=>threads.filter(t=>{
 const nodes=t.comments?.nodes||[];
 let lastCodex=-1;
 nodes.forEach((c,i)=>{if(codexGraphqlAuthor(c.author))lastCodex=i;});
 if(lastCodex<0)return false;
 if(!t.isResolved)return true;
 return !nodes.slice(lastCodex+1).some(c=>c.author&&!codexGraphqlAuthor(c.author)&&String(c.body||'').trim().length>0);
});
module.exports={validHeadThumbs,isCodexLogin:codex,isSubmittedCodexReview:submittedCodexReview,isCodexGraphqlAuthor:codexGraphqlAuthor,openCodexFindings};
