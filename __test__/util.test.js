/**
 * util.test
 */

var util = require('../src/util');

test('util isPromise detect', () => {
  const demo = function() {};
  const demo2 = new Promise(function() {});
  expect(util.isPromise(demo)).toBeFalsy();
  expect(util.isPromise(demo2)).toBeTruthy();
});

describe('util extend function', () => {
  // beforeAll(() => {
    const Supper = function() {
      this.name = 'supper';
    };

    Supper.prototype.whoami = function() {
      return 'My name is ' + this.name;
    };

    Supper.extend = util.extend;

    const Sub = Supper.extend({
      constructor: function() {
        this.name = 'subber';
      },
      whoami: function() {
        return 'My name is ' + this.name + '. speaked by sub';
      }
    });

    const sup = new Supper();
    const sub = new Sub();
  // })

  test('supper name should not be covered', () => {
    expect(sup.name).toBe('supper');
  })

  test('subber name should be new in constructor', () => {
    expect(sub.name).toBe('subber');
  })

  test('supper method should not be covered', () => {
    expect(sup.whoami()).toBe('My name is supper');
  })

  test('supper name should be extended by new', () => {
    expect(sub.whoami()).toBe('My name is subber. speaked by sub');
  })
});
