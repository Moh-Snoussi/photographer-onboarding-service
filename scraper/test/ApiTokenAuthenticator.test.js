import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiTokenAuthenticator } from '../src/security/createApiTokenAuthenticator.js';

test('allows requests with the configured bearer token', () => {
  const next = createNext();
  const response = createResponse();

  createApiTokenAuthenticator('expected-token')(
    createRequest('Bearer expected-token'),
    response,
    next,
  );

  assert.equal(next.called, true);
  assert.equal(response.statusCode, undefined);
});

test('rejects missing and invalid bearer tokens', () => {
  for (const authorization of ['', 'Basic expected-token', 'Bearer wrong-token']) {
    const next = createNext();
    const response = createResponse();

    createApiTokenAuthenticator('expected-token')(createRequest(authorization), response, next);

    assert.equal(next.called, false);
    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.body, { error: 'Unauthorized' });
  }
});

function createRequest(authorization) {
  return { get: () => authorization };
}

function createResponse() {
  return {
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
    },
  };
}

function createNext() {
  const next = () => {
    next.called = true;
  };
  next.called = false;
  return next;
}
