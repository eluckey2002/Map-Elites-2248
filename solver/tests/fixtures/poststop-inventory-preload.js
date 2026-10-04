'use strict';
// Test-only historical fixture for the original immutable arithmetic reducer.
// Validate the exact owner-approved current-file difference before substituting
// that one fixture; all mutated raw inputs and scientific files remain live.
const fs=require('node:fs');
const path=require('node:path');
const {validate,INVENTORY}=require('../../../docs/goals/policy-terms-loop/poststop-recompute');
const root=path.resolve(__dirname,'../../..'),checked=validate(root);
const target=path.join(root,INVENTORY),read=fs.readFileSync;
fs.readFileSync=function(file,options){
  if(typeof file==='string'&&path.resolve(file)===target){const bytes=Buffer.from(checked.before);return typeof options==='string'?bytes.toString(options):options?.encoding?bytes.toString(options.encoding):bytes;}
  return read.call(fs,file,options);
};
console.log('TEST_ONLY_REGISTERED_INVENTORY_FIXTURE',JSON.stringify(checked.exception));
