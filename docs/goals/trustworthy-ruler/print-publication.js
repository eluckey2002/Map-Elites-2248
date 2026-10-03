#!/usr/bin/env node
'use strict';

// Publication state is read live; a saved pending review must not masquerade
// as the final verdict. This script performs no GitHub write.
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
function show(args) {
  console.log('\n$ gh ' + args.join(' '));
  console.log(execFileSync('gh', args, { cwd: root, encoding: 'utf8' }).trimEnd());
}
show(['pr', 'view', '61', '--json', 'state,url,headRefOid,statusCheckRollup', '--jq',
  '{state,url,headRefOid,checks:[.statusCheckRollup[] | {name,status,conclusion,detailsUrl}]}']);
show(['api', 'repos/eluckey2002/Map-Elites-2248/pulls/61/reviews', '--jq',
  '.[] | {id,state,submitted_at,commit_id,html_url,body,user:.user.login}']);
show(['api', 'repos/eluckey2002/Map-Elites-2248/issues/61/comments', '--jq',
  '.[] | select(.user.login=="chatgpt-codex-connector[bot]" or (.body|contains("@codex review")))'
    + ' | {id,created_at,html_url,body,user:.user.login}']);
show(['api', 'repos/eluckey2002/Map-Elites-2248/issues/61/reactions', '--jq',
  '.[] | {content,created_at,user:.user.login}']);
show(['api', 'graphql', '-f', 'query=query { repository(owner:"eluckey2002",name:"Map-Elites-2248")'
  + ' { pullRequest(number:61) { reviewThreads(first:100) { nodes { id isResolved'
  + ' comments(first:10) { nodes { databaseId url author { login } } } } } } } }']);
