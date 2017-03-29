/**
 * bigape.test
 */

const BigPipe = require('../src/BigPipe');
const Pagelet = require('../src/Pagelet');
const request = require('supertest');
const express = require('express');

const app = express()

app.get('/user', function(req, res) {
  res.status(200).json({ name: 'tobi' });
});

var testAction = BigPipe.create({});

test('bigpipe should inherit eventEmitter', done => {
  testAction.on('done', () => done());
  testAction.emit('done')
})

test('request test', done => {
  request(app)
    .get('/user')
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function(err, res) {
      if (err) throw err;
      done()
    });
})
