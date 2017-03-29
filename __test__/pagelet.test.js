/**
 * pagelet.test
 */

const Pagelet = require('../src/Pagelet');

describe('pagelet inherit from EventEmitter', () => {
  const p1 = Pagelet.create('p1', {});

  test('events should work', done => {
    p1.on('done', () => {done()});
    p1.emit('done')
  })
})

test('pagelet extend should work', () => {
  const P1 = Pagelet.extend({
    template: 'demo'
  });
  const p1 = P1.create('p1', {});

  expect(p1.template).toBe('demo')
})

test('pagelet create should work', () => {
  const P1 = Pagelet.extend({
    template: 'demo'
  });
  const p1 = P1.create('p1', {});

  expect(p1 instanceof P1).toBeTruthy()
})
