import {Meteor} from 'meteor/meteor';
import {Students, Tests, Submissions, SubmissionSchema} from 'libs/collections';

const submissionFields = Object.assign(
  ...SubmissionSchema._firstLevelSchemaKeys.map(key => ({[key]: 1}))
);

const testFields = {
  _id: 1,
  name: 1,
  result: 1,
  'commands._id': 1,
  'commands.input': 1,
  'commands.output.line': 1,
  'commands.output.walltime': 1,
  'commands.output.simtime': 1,
  'commands.status': 1,
  'commands.points_avail': 1,
  'commands.points_earned': 1,
  points_avail: 1,
  points_earned: 1
};

const getUserEmail = (userId) => {
  const user = Meteor.users.findOne(userId) || {};
  const {email} = (user.services || {}).auth0 || {};
  return email;
}

const findAllSubmissions = (userId, asst, limit = 10) => {
  const email = getUserEmail(userId);
  const selector = {
    users: { $in: [email] }
  };
  if (asst) {
    selector.target_name = asst;
  }
  const options = {
    sort: {submission_time: -1},
    fields: submissionFields,
    limit: limit
  };
  return Submissions.find(selector, options);
}

const findAllTests = (tests) => {
  const selector = { _id: { $in: tests } };
  const options = { fields: testFields };
  return Tests.find(selector, options);
}

const findAllStudents = (userId) => {
  const email = getUserEmail(userId);
  const selector = {email};
  const options = {};
  return Students.find(selector, options);
}

const findOneStudent = (userId) => {
  const email = getUserEmail(userId);
  const selector = {email};
  const options = {};
  return Students.findOne(selector, options);
}

export {
  getUserEmail,
  findAllSubmissions,
  findAllTests,
  findAllStudents,
  findOneStudent
}
