const LIMIT = 10;

Meteor.publish('performance', function({ _id: target_name, type }) {
  if (!this.userId) {
    this.ready();
    return;
  }

  if (type !== 'perf') {
    this.ready();
    return;
  }


  let initializing = true;
  const localCache = new Set();

  const selector = {
    target_name: target_name,
    hide: { $ne: true },
    performance: { $gt: 0 }
  };

  const pipeline = [
    { $match: selector },
    {
      $group: {
        _id: "$users",
        users: { $first: "$users" },
        target: { $first: "$target_name" },
        performance: { $min: "$performance" },
        max_score: { $max: "$max_score" },
        score: { $max: "$score" }
      }
    },
    { $unwind: "$users" },
    {
      $lookup : {
        from: "users",
        localField: "users",
        foreignField: "services.auth0.email",
        as: "userObjects"
      }
    },
    { $unwind: "$userObjects" },
    {
      $lookup : {
        from: "students",
        localField: "users",
        foreignField: "email",
        as: "students"
      }
    },
    { $unwind: "$students" },
    {
      $group: {
        _id: "$_id",
        users: { $first: "$users" },
        target: { $first: "$target" },
        performance: { $min: "$performance" },
        max_score: { $max: "$max_score" },
        score: { $max: "$score" },
        userObjects: { $push: "$userObjects" },
        students: { $push: "$students" }
      }
    },
    {
      $match: {
        userObjects: {
          $not: {
            $elemMatch: {
              "services.auth0.user_metadata.staff": true
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        performance: 1,
        target: 1,
        score: 1,
        max_score: 1,
        students: 1
      }
    },
    {
      $sort: { performance: 1 }
    }
  ];

  const runAggregation = () => {
    const leaderSet = new Set();
    const performances = [];
    let count = 0;

    Submissions.aggregate(pipeline).map((e) => {
      performances.push(e.performance);

      if (count < LIMIT) {
        if (!filterAggregate(e, target_name, type)) {
          return;
        }

        if (localCache.has(e._id)) {
          this.changed('leaders', e._id, e);
        } else {
          this.added('leaders', e._id, e);
          localCache.add(e._id);
        }
        count++;
        leaderSet.add(e._id);
      }
    });

    for (let id of localCache) {
      if (!leaderSet.has(id)) {
        localCache.delete(id);
        this.removed('leaders', id);
      }
    }

    this.added('leaders', target_name, {performances});
    this.changed('leaders', target_name, {performances});

    this.ready();
  }

  const changeHandler = {
    added: (id) => {
      if (!initializing) {
        runAggregation();
      }
    },
    removed: runAggregation,
    changed: runAggregation,
    error: (err) => {
      throw new Meteor.Error('Uh oh! something went wrong!', err.message);
    }
  }

  const query = Submissions.find(selector);
  const handle = query.observeChanges(changeHandler);

  const studentQuery = Students.find({}, {
    fields: {
      _id: 1,
      email: 1,
      privacy: 1
    }
  });
  const studentHandle = studentQuery.observeChanges(changeHandler);

  initializing = false;
  runAggregation();

  this.onStop(function() {
    handle.stop();
    studentHandle.stop();
  });
});
