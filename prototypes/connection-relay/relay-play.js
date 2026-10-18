/* Relay play: the shipped finite Connection rules, plus markers that follow a made tile.
   An objective end with a link {end, made} sits on the tile connection `made` produced and
   moves down with it when gravity drops it. Once that tile is used in any chain (even as the
   chain's last tile) or removed, the marker stays where it was, exactly as in the shipped
   fixed-place rules. Nothing else changes; src/connection-rules.js still decides every move. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../../src/connection-rules'));
  else root.RelayPlay=factory(root.ConnectionRules);
})(typeof globalThis==='object'?globalThis:this,function(rules){
  'use strict';
  const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
  // Where the tile at pos is after a chain (state before the move); null once the chain uses it.
  // Gravity is a pure column drop; the chain's last tile is the one that stays.
  function followMove(chain,pos){
    const removed=chain.slice(0,-1);
    if(chain.some(p=>same(p,pos)))return null;
    const [x,y]=pos;
    return [x,y+removed.filter(([rx,ry])=>rx===x&&ry>y).length];
  }
  function followRemove(at,pos){
    if(same(at,pos))return null;
    return pos[0]===at[0]&&pos[1]<at[1]?[pos[0],pos[1]+1]:pos;
  }
  // A made tile is {at, fixed}; once its tile is gone the marker keeps its last place.
  const track=(made,step)=>made.map(m=>{if(m.fixed)return m;const at=step(m.at);return at?{at,fixed:false}:{at:m.at,fixed:true};});
  // Rewrites linked ends to their tiles. A link that would land on the goal's other end keeps its last place
  // (for example when the second made tile lands where the spent first one was), since one tile cannot be both ends.
  function sync(state){
    const made=state.relay.made;
    for(const goal of [...state.objectives,state.objective].filter(Boolean))for(const link of goal.follow||[]){
      const at=made[link.made]?.at;if(!at)continue;
      const other=goal.ends[1-link.end];
      if(!same(at,other))goal.ends[link.end]=[...at];
    }
    return state;
  }
  function create(level){const state=rules.create(level);state.relay={made:[]};return state;}
  function move(state,chain){
    const next=rules.move(state,chain);
    const made=track(state.relay.made,p=>followMove(chain,p));
    if(next.completed>state.completed)made.push({at:[next.last.landing.x,next.last.landing.y],fixed:false});
    next.relay={made};return sync(next);
  }
  function remove(state,position){
    const next=rules.remove(state,position);
    next.relay={made:track(state.relay.made,p=>followRemove(position,p))};return sync(next);
  }
  const preview=(state,chain)=>move(state,chain);
  function replay(level,actions){
    let state=create(level);const history=[];
    for(const action of actions){
      if(action.type==='undo'){if(!history.length)throw new Error('Nothing to undo');state=history.pop();continue;}
      history.push(state);
      state=action.type==='move'?move(state,action.chain):action.type==='remove'?remove(state,action.position):(()=>{throw new Error('Invalid action');})();
    }
    return state;
  }
  return {create,move,remove,preview,replay,followMove,followRemove};
});
