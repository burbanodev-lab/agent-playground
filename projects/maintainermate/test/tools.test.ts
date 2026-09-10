import test from 'node:test';
import assert from 'node:assert/strict';
import { urgencyScore } from '../src/tools.js';

test('critical production security ticket is capped at 100', () => {
  const score = urgencyScore({
    id: 'x',
    subject: 'Production security breach',
    body: 'Users are blocked and data may leak',
    severity: 'critical',
  });
  assert.equal(score, 100);
});

test('low-severity documentation ticket stays low priority', () => {
  const score = urgencyScore({
    id: 'x',
    subject: 'Docs typo',
    body: 'Small wording issue',
    severity: 'low',
  });
  assert.equal(score, 20);
});
