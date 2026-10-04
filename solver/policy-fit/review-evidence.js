'use strict';
const codex=u=>/chatgpt-codex-connector/.test(u||'');
function validHeadThumbs(head,reactions,comments){
 const stamps=comments.filter(c=>codex(c.user?.login)).filter(c=>{
  const match=c.body.match(/<!-- codex-security-review:v1 (\{[^\n]+\}) -->/);
  if(!match)return false;
  let state;try{state=JSON.parse(match[1]);}catch{return false;}
  return state.headSha===head&&state.status==='completed'&&c.body.includes('**Code Review** | \u2705 **Completed**');
 });
 return reactions.filter(r=>codex(r.user?.login)&&r.content==='+1'&&stamps.some(c=>r.created_at>=c.updated_at));
}
module.exports={validHeadThumbs};
