'use strict';
const {execFileSync}=require('node:child_process');
const {validHeadApproval,isCodexLogin:codex,headReviewEvidence,openCodexFindings,collectPages,flattenSlurped}=require('../../../solver/policy-fit/review-evidence');
const repo='eluckey2002/Map-Elites-2248';
function gh(...args){return JSON.parse(execFileSync('gh',args,{encoding:'utf8',maxBuffer:256*1024*1024}));}
// Every list is read to the end (see collectPages); a partial read throws.
function rest(path){return flattenSlurped(gh('api','--paginate','--slurp',path));}
function graphql(query,vars={}){
 const args=['api','graphql','-f',`query=${query}`];
 for(const [k,v] of Object.entries(vars))if(v!==null&&v!==undefined)args.push('-f',`${k}=${v}`);
 const out=gh(...args);
 if(out.errors)throw new Error('GraphQL errors: failing closed');
 return out.data;
}
const pr=gh('pr','view','codex/policy-learned-judge-r5','--repo',repo,'--json','number,url,state,headRefOid,statusCheckRollup');
const headCommit=gh('api',`repos/${repo}/commits/${pr.headRefOid}`);
const headTime=headCommit.commit.committer.date;
const reviews=rest(`repos/${repo}/pulls/${pr.number}/reviews`);
const reactions=rest(`repos/${repo}/issues/${pr.number}/reactions`);
const comments=rest(`repos/${repo}/pulls/${pr.number}/comments`);
const COMMENT_FIELDS='pageInfo { hasNextPage endCursor } nodes { author { __typename login } body url }';
const THREADS=`query($after: String) { repository(owner: "eluckey2002", name: "Map-Elites-2248") { pullRequest(number: ${pr.number}) { reviewThreads(first: 100, after: $after) { pageInfo { hasNextPage endCursor } nodes { id isResolved comments(first: 100) { ${COMMENT_FIELDS} } } } } } }`;
const MORE_COMMENTS=`query($id: ID!, $after: String) { node(id: $id) { ... on PullRequestReviewThread { comments(first: 100, after: $after) { ${COMMENT_FIELDS} } } } }`;
const threads=collectPages(after=>graphql(THREADS,{after}).repository.pullRequest.reviewThreads).map(t=>{
 if(!t.comments.pageInfo.hasNextPage)return t;
 const more=collectPages(after=>graphql(MORE_COMMENTS,{id:t.id,after}).node.comments,{after:t.comments.pageInfo.endCursor});
 return {...t,comments:{nodes:[...t.comments.nodes,...more]}};
});
const headReviews=headReviewEvidence(reviews,pr.headRefOid);
const summaries=rest(`repos/${repo}/issues/${pr.number}/comments`).filter(c=>codex(c.user?.login));
const approvals=validHeadApproval(pr.headRefOid,reviews,reactions,summaries);
const openFindings=openCodexFindings(threads);
const gate=pr.statusCheckRollup.filter(c=>c.name==='experiment gate');
const gateGreen=gate.length>0&&gate.every(c=>c.status==='COMPLETED'&&c.conclusion==='SUCCESS');
console.log(JSON.stringify({pr,headReviews:headReviews.map(r=>({id:r.id,state:r.state,body:r.body,commit:r.commit_id,submitted_at:r.submitted_at})),codexThumbsUp:approvals.map(r=>({id:r.id,user:r.user.login,created_at:r.created_at,headCommitTime:headTime})),inlineComments:comments.filter(c=>codex(c.user?.login)).map(c=>({id:c.id,body:c.body,path:c.path,line:c.line,original_line:c.original_line,commit_id:c.commit_id,url:c.html_url})),openFindings,gateGreen,reviewComplete:headReviews.length>0||approvals.length>0,finishReady:pr.state==='OPEN'&&gateGreen&&(headReviews.length>0||approvals.length>0)&&openFindings.length===0},null,2));
