'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {verifyReviewed}=require('../../docs/goals/policy-terms-loop/resume-reviewed-closeout');
test('LIVE completed result requires the anchored full-history custody proof before completion',()=>{
  const value=verifyReviewed(path.resolve(__dirname,'../..'));
  assert.equal(value.scientificComplete,true);
  assert.equal(value.scientificAcceptance,false);
  assert.equal(value.reviewedProof,true);
  assert.equal(value.path,'A');
  for(const item of Object.values(value.trustHistory))assert.deepEqual(item.ordinaryChanges,[]);
});
