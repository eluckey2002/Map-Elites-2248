'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {verifyReviewed}=require('../../docs/goals/policy-terms-loop/resume-reviewed-closeout');
const {closeoutRoot}=require('./fixtures/policy-closeout-snapshot');
test('LIVE completed result requires the anchored full-history custody proof before completion',()=>{
  const value=verifyReviewed(closeoutRoot());
  assert.equal(value.scientificComplete,true);
  assert.equal(value.scientificAcceptance,false);
  assert.equal(value.reviewedProof,true);
  assert.equal(value.path,'A');
  for(const item of Object.values(value.trustHistory))assert.deepEqual(item.ordinaryChanges,[]);
});
