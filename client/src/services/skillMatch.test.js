import test from 'node:test';
import assert from 'node:assert/strict';
import { hasMatchingSkill } from './skillMatch.js';

test('unrelated or blank searches cannot recommend mentors', () => {
  for (const query of ['kmaskn', '', '   ', '&', 'Data Structures & DAA']) {
    assert.equal(hasMatchingSkill(['React', 'Java'], query), false, query);
  }
  assert.equal(hasMatchingSkill([], 'React'), false);
});
test('matches skill phrases case-insensitively without substring collisions', () => {
  assert.equal(hasMatchingSkill(['React', 'Java'], '  REACT  '), true);
  assert.equal(hasMatchingSkill(['Data Structures'], 'data structures'), true);
  assert.equal(hasMatchingSkill(['React'], 'I want to learn React'), true);
  assert.equal(hasMatchingSkill(['JavaScript'], 'Java'), false);
  assert.equal(hasMatchingSkill(['Java'], 'JavaScript'), false);
  assert.equal(hasMatchingSkill(['C++'], 'C'), false);
  assert.equal(hasMatchingSkill(['C++'], 'C++'), true);
});
