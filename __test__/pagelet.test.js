//
// var Pagelet = require('../src/Pagelet')
//
// before('create a Pagelet named demo', t => {
//     var demoPagelet = Pagelet.extend({
//         name: 'demo',
//         domID: 'mod-demo',
//         template: 'demo.njk',
//         getService: function() {
//             return {message: 'demo message'}
//         },
//         onServiceDone: function(json) {
//             return json;
//         }
//     })
// })

function sum(a, b) {
    return a + b;
}

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3);
});
