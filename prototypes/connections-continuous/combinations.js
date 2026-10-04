/* Arithmetic examples only: deliberately receives no board or solution witness. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.ValueCombinations=factory();
})(typeof window==='object'?window:globalThis,function(){
  'use strict';
  function recipes(target,maxTiles=30){
    if(!Number.isSafeInteger(target)||target<6||target%2)return [];
    const bases=[];
    for(let value=2;value<=target/3;value*=2)if(target%value===0)bases.push(value);
    bases.reverse();
    const results=[];
    for(let length=3;length<=maxTiles&&results.length<6;length++){
      for(const base of bases){
        const failed=new Set();
        function suffix(remaining,previous,slots){
          if(remaining<previous*slots||remaining>previous*(2**(slots+1)-2))return null;
          if(!slots)return [];
          const key=`${remaining}/${previous}/${slots}`;
          if(failed.has(key))return null;
          for(const value of [previous*2,previous]){
            const rest=suffix(remaining-value,value,slots-1);
            if(rest)return [value,...rest];
          }
          failed.add(key);return null;
        }
        const rest=suffix(target/base-2,1,length-2);
        if(rest){results.push([1,1,...rest].map(n=>n*base));break;}
      }
    }
    return results;
  }
  return {recipes};
});
