UserSubs = new SubsManager();

subscribeUserData = function() {
    const data = {ready: false};
    const handle = UserSubs.subscribe("userData");
    if (handle.ready()) {
      data.user = Meteor.user();
      data.student = findOneStudent(Meteor.userId());
      data.ready = true;
    }
    return data;
}

SubmissionSubs = new SubsManager();

TestSubs = new SubsManager();

TargetSubs = new SubsManager();

LeaderboardSubs = new SubsManager();

logout = () => {
  Meteor.logout();
};

login = () => {
  if (Meteor.lock.$container) {
    Meteor.lock.hide();
  }
  Meteor.lock.show({
    closable: true
  });
};

isStaff = (user) => {
  return ((((user || {}).services || {}).auth0 || {}).user_metadata || {}).staff;
}
