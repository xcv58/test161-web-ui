import {Meteor} from 'meteor/meteor';
import {findAllTests} from 'libs/query';

Meteor.publish('tests', function (tests) {
  if (!this.userId) {
    this.ready();
  } else {
    return findAllTests(tests);
  }
});
