'use strict';
// Exact login, never a substring: any public account named like
// 'chatgpt-codex-connector-evil' must not be mistaken for the reviewer app.
const CODEX_LOGIN='chatgpt-codex-connector[bot]';
const codex=u=>u===CODEX_LOGIN;
// A review counts as completed evidence only when submitted and in a state that
// does not ask for more work. An allowlist, not a denylist: PENDING is a draft,
// DISMISSED was withdrawn, and CHANGES_REQUESTED is an open request even when it
// has no inline thread. Codex reports findings as COMMENTED plus threads, or
// APPROVED.
const COMPLETED_REVIEW_STATES=['COMMENTED','APPROVED'];
const submittedCodexReview=r=>codex(r?.user?.login)&&Boolean(r.submitted_at)&&COMPLETED_REVIEW_STATES.includes(r.state);
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
// GitHub caps GraphQL connections at 100 items and REST lists at 30 per page by
// default. Reading only the first page lets a commenter push a real finding off
// it, so every list is read to the end, and anything that looks incomplete
// throws: a readiness check must fail closed, never report ready on a guess.
function collectPages(fetchPage,{maxPages=100,after=null}={}){
 const nodes=[];
 for(let i=0;i<maxPages;i++){
  const page=fetchPage(after);
  if(!page||!Array.isArray(page.nodes)||!page.pageInfo||typeof page.pageInfo.hasNextPage!=='boolean')throw new Error('incomplete page: failing closed');
  nodes.push(...page.nodes);
  if(!page.pageInfo.hasNextPage)return nodes;
  if(!page.pageInfo.endCursor)throw new Error('next page without a cursor: failing closed');
  after=page.pageInfo.endCursor;
 }
 throw new Error(`more than ${maxPages} pages: failing closed`);
}
// `gh api --paginate --slurp` yields one array per page.
function flattenSlurped(pages){
 if(!Array.isArray(pages)||!pages.every(Array.isArray))throw new Error('paginated REST result is not a list of pages: failing closed');
 return pages.flat();
}
module.exports={validHeadThumbs,isCodexLogin:codex,isSubmittedCodexReview:submittedCodexReview,isCodexGraphqlAuthor:codexGraphqlAuthor,openCodexFindings,collectPages,flattenSlurped};
