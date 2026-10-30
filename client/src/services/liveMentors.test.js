import test from 'node:test';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { loadLiveMentors } from './liveMentors.js';
const token = `header.${Buffer.from(JSON.stringify({ id: 'self' })).toString('base64url')}.signature`;
test('loads every page, excludes self and maps real mentor fields', async () => {
  const calls = [];
  const request = async (url, options) => {
    calls.push(url);
    assert.equal(options.headers.Authorization, `Bearer ${token}`);
    return { ok: true, json: async () => ({ totalPages: 2, mentors: calls.length === 1 ? [{ _id: 'self' }] : [{ _id: 'real-id', name: 'Real Mentor', skillsToTeach: ['React'], availability: ['Weekends'], hourlyRate: 900 }] }) };
  };
  const users = await loadLiveMentors('/api', token, request);
  assert.equal(calls.length, 2);
  assert.equal(users.length, 1);
  assert.equal(users[0].id, 'real-id');
  assert.deepEqual(users[0].skillsTeach, ['React']);
  assert.equal(users[0].availability, 'Weekends');
});
test('API errors never fall back to demo mentors', async () => {
  await assert.rejects(loadLiveMentors('/api', token, async () => ({ ok: false, status: 401 })), /expired/);
  await assert.rejects(loadLiveMentors('/api', null), /sign in/);
});
