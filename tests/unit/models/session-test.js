import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import moment from 'moment';
import { waitForResource } from 'ilios-common';

module('Unit | Model | Session', function (hooks) {
  setupTest(hooks);

  test('check required publication items', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    assert.strictEqual(model.get('requiredPublicationIssues').length, 2);
    model.set('title', 'nothing');
    assert.strictEqual(model.get('requiredPublicationIssues').length, 1);
    model.get('offerings').addObject(store.createRecord('offering'));
    assert.strictEqual(model.get('requiredPublicationIssues').length, 0);
  });

  test('check required ILM publication items', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    model.set('title', 'nothing');
    assert.strictEqual(model.get('requiredPublicationIssues').length, 1);
    const ilmSession = store.createRecord('ilmSession');
    model.set('ilmSession', ilmSession);
    assert.strictEqual(model.get('requiredPublicationIssues').length, 1);
  });

  test('check optional publication items', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('session');
    assert.strictEqual(model.optionalPublicationIssues.length, 4);
    assert.deepEqual(model.optionalPublicationIssues, [
      'terms',
      'learnerGroups',
      'sessionObjectives',
      'meshDescriptors',
    ]);
    model.get('terms').addObject(store.createRecord('term'));
    assert.strictEqual(model.optionalPublicationIssues.length, 3);
    assert.deepEqual(model.optionalPublicationIssues, [
      'learnerGroups',
      'sessionObjectives',
      'meshDescriptors',
    ]);
    const learnerGroup = store.createRecord('learner-group');
    const ilm = store.createRecord('ilm-session', {
      learnerGroups: [learnerGroup],
    });
    const offering = store.createRecord('offering', {
      learnerGroups: [learnerGroup],
    });
    model.set('ilmSession', ilm);
    await waitForResource(model, '_ilmLearnerGroups');
    assert.strictEqual(model.optionalPublicationIssues.length, 2);
    assert.deepEqual(model.optionalPublicationIssues, ['sessionObjectives', 'meshDescriptors']);
    model.set('ilmSession', null);
    await waitForResource(model, '_ilmLearnerGroups');
    assert.strictEqual(model.optionalPublicationIssues.length, 3);
    assert.deepEqual(model.optionalPublicationIssues, [
      'learnerGroups',
      'sessionObjectives',
      'meshDescriptors',
    ]);
    model.get('offerings').addObject(offering);
    await waitForResource(model, 'offeringLearnerGroups');
    assert.strictEqual(model.optionalPublicationIssues.length, 2);
    assert.deepEqual(model.optionalPublicationIssues, ['sessionObjectives', 'meshDescriptors']);
    model.get('sessionObjectives').addObject(store.createRecord('session-objective'));
    assert.strictEqual(model.optionalPublicationIssues.length, 1);
    assert.deepEqual(model.optionalPublicationIssues, ['meshDescriptors']);
    model.get('meshDescriptors').addObject(store.createRecord('meshDescriptor'));
    assert.strictEqual(model.optionalPublicationIssues.length, 0);
  });

  test('check empty associatedOfferingLearnerGroups', async function (assert) {
    assert.expect(1);
    const session = this.owner.lookup('service:store').createRecord('session');
    const groups = await waitForResource(session, 'associatedOfferingLearnerGroups');
    assert.strictEqual(groups.length, 0);
  });

  test('check first level associatedOfferingLearnerGroups', async function (assert) {
    assert.expect(4);
    const session = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const learnerGroup1 = store.createRecord('learner-group');
    const learnerGroup2 = store.createRecord('learner-group');
    const learnerGroup3 = store.createRecord('learner-group');
    const offering1 = store.createRecord('offering', {
      learnerGroups: [learnerGroup1, learnerGroup2],
    });
    const offering2 = store.createRecord('offering', {
      learnerGroups: [learnerGroup3],
    });

    session.get('offerings').pushObjects([offering1, offering2]);

    const groups = await waitForResource(session, 'associatedOfferingLearnerGroups');
    assert.strictEqual(groups.length, 3);
    assert.ok(groups.includes(learnerGroup1));
    assert.ok(groups.includes(learnerGroup2));
    assert.ok(groups.includes(learnerGroup3));
  });

  test('check multi level associatedOfferingLearnerGroups', async function (assert) {
    assert.expect(6);
    const session = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const learnerGroup1 = store.createRecord('learner-group');
    const learnerGroup2 = store.createRecord('learner-group');
    const learnerGroup3 = store.createRecord('learner-group');
    const learnerGroup4 = store.createRecord('learner-group');
    const learnerGroup5 = store.createRecord('learner-group');
    const offering1 = store.createRecord('offering', {
      learnerGroups: [learnerGroup1, learnerGroup2, learnerGroup5],
    });
    const offering2 = store.createRecord('offering', {
      learnerGroups: [learnerGroup3],
    });
    const offering3 = store.createRecord('offering', {
      learnerGroups: [learnerGroup4],
    });
    session.get('offerings').pushObjects([offering1, offering2, offering3]);

    const groups = await waitForResource(session, 'associatedOfferingLearnerGroups');
    assert.strictEqual(groups.length, 5);
    assert.ok(groups.includes(learnerGroup1));
    assert.ok(groups.includes(learnerGroup2));
    assert.ok(groups.includes(learnerGroup3));
    assert.ok(groups.includes(learnerGroup4));
    assert.ok(groups.includes(learnerGroup5));
  });

  test('check empty associatedIlmLearnerGroups without ilm session', async function (assert) {
    assert.expect(1);
    const session = this.owner.lookup('service:store').createRecord('session');

    const groups = await waitForResource(session, 'associatedIlmLearnerGroups');
    assert.strictEqual(groups.length, 0);
  });

  test('check empty associatedIlmLearnerGroups with ilm session', async function (assert) {
    assert.expect(1);
    const store = this.owner.lookup('service:store');
    const session = store.createRecord('session');
    store.createRecord('ilm-session', { id: 13, session });

    const groups = await waitForResource(session, 'associatedIlmLearnerGroups');
    assert.deepEqual(groups.length, 0);
  });

  test('check associatedIlmLearnerGroups', async function (assert) {
    assert.expect(4);
    const session = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const learnerGroup1 = store.createRecord('learner-group');
    const learnerGroup2 = store.createRecord('learner-group');
    const learnerGroup3 = store.createRecord('learner-group');
    store.createRecord('ilm-session', {
      id: 11,
      learnerGroups: [learnerGroup1, learnerGroup2, learnerGroup3],
      session,
    });

    const groups = await waitForResource(session, 'associatedIlmLearnerGroups');
    assert.strictEqual(groups.length, 3);
    assert.ok(groups.includes(learnerGroup1));
    assert.ok(groups.includes(learnerGroup2));
    assert.ok(groups.includes(learnerGroup3));
  });

  test('check empty associatedLearnerGroups', async function (assert) {
    assert.expect(1);
    const session = this.owner.lookup('service:store').createRecord('session');
    const groups = await waitForResource(session, 'associatedLearnerGroups');
    assert.strictEqual(groups.length, 0);
  });

  test('check associatedLearnerGroups', async function (assert) {
    assert.expect(6);
    const session = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const learnerGroup1 = store.createRecord('learner-group');
    const learnerGroup2 = store.createRecord('learner-group');
    const learnerGroup3 = store.createRecord('learner-group');
    const learnerGroup4 = store.createRecord('learner-group');
    const learnerGroup5 = store.createRecord('learner-group');

    const ilm = store.createRecord('ilm-session', {
      id: 11,
      learnerGroups: [learnerGroup1, learnerGroup2, learnerGroup3, learnerGroup4],
    });
    const offering1 = store.createRecord('offering', {
      learnerGroups: [learnerGroup1, learnerGroup2, learnerGroup5],
    });
    const offering2 = store.createRecord('offering', {
      learnerGroups: [learnerGroup3],
    });

    session.set('ilmSession', ilm);
    session.get('offerings').pushObjects([offering1, offering2]);

    const groups = await waitForResource(session, 'associatedLearnerGroups');
    assert.strictEqual(groups.length, 5);
    assert.ok(groups.includes(learnerGroup1));
    assert.ok(groups.includes(learnerGroup2));
    assert.ok(groups.includes(learnerGroup3));
    assert.ok(groups.includes(learnerGroup4));
    assert.ok(groups.includes(learnerGroup5));
  });

  test('check learner groups count', async function (assert) {
    assert.expect(2);
    const session = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const learnerGroup1 = store.createRecord('learner-group');
    const learnerGroup2 = store.createRecord('learner-group');
    const learnerGroup3 = store.createRecord('learner-group');
    const offering1 = store.createRecord('offering', {
      learnerGroups: [learnerGroup1, learnerGroup2],
    });
    const offering2 = store.createRecord('offering', {
      learnerGroups: [learnerGroup3],
    });

    session.get('offerings').pushObjects([offering1, offering2]);

    assert.strictEqual(await waitForResource(session, 'learnerGroupCount'), 3);

    const learnerGroup4 = store.createRecord('learner-group');
    const offering3 = store.createRecord('offering', {
      learnerGroups: [learnerGroup4],
    });
    session.get('offerings').pushObject(offering3);
    const learnerGroup5 = store.createRecord('learner-group');
    offering1.get('learnerGroups').pushObject(learnerGroup5);

    assert.strictEqual(await waitForResource(session, 'learnerGroupCount'), 5);
  });

  test('isIndependentLearning', async function (assert) {
    assert.expect(2);
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('session');
    assert.notOk(model.get('isIndependentLearning'));
    await store.createRecord('ilmSession', { id: 1, session: model });
    assert.ok(await waitForResource(model, 'isIndependentLearning'));
  });

  test('associatedVocabularies', async function (assert) {
    assert.expect(3);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    const vocab1 = store.createRecord('vocabulary', { title: 'Zeppelin' });
    const vocab2 = store.createRecord('vocabulary', { title: 'Aardvark' });
    const term1 = store.createRecord('term', { vocabulary: vocab1 });
    const term2 = store.createRecord('term', { vocabulary: vocab1 });
    const term3 = store.createRecord('term', { vocabulary: vocab2 });
    subject.get('terms').pushObjects([term1, term2, term3]);
    const vocabularies = await waitForResource(subject, 'associatedVocabularies');
    assert.strictEqual(vocabularies.length, 2);
    assert.strictEqual(vocabularies[0], vocab2);
    assert.strictEqual(vocabularies[1], vocab1);
  });

  test('termCount', function (assert) {
    assert.expect(2);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    assert.strictEqual(subject.termCount, 0);
    const term1 = store.createRecord('term', { id: 1, sessions: [subject] });
    const term2 = store.createRecord('term', { id: 2, sessions: [subject] });
    subject.get('terms').pushObjects([term1, term2]);
    assert.strictEqual(subject.termCount, 2);
  });

  test('sortedSessionObjectives', async function (assert) {
    assert.expect(5);
    const store = this.owner.lookup('service:store');
    const session = store.createRecord('session');
    const sessionObjective1 = store.createRecord('session-objective', {
      id: 1,
      position: 10,
      session,
    });
    const sessionObjective2 = store.createRecord('session-objective', {
      id: 2,
      position: 5,
      session,
    });
    const sessionObjective3 = store.createRecord('session-objective', {
      id: 3,
      position: 5,
      session,
    });
    const sessionObjective4 = store.createRecord('session-objective', {
      id: 4,
      position: 0,
      session,
    });
    const sortedObjectives = await waitForResource(session, 'sortedSessionObjectives');
    assert.strictEqual(sortedObjectives.length, 4);
    assert.strictEqual(sortedObjectives[0], sessionObjective4);
    assert.strictEqual(sortedObjectives[1], sessionObjective3);
    assert.strictEqual(sortedObjectives[2], sessionObjective2);
    assert.strictEqual(sortedObjectives[3], sessionObjective1);
  });

  test('totalSumOfferingsDuration', async function (assert) {
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    let total = await waitForResource(subject, 'totalSumOfferingsDuration');

    assert.strictEqual(total, 0);

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01').toDate(),
      endDate: moment('2017-01-02').toDate(),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00').toDate(),
      endDate: moment('2017-01-01 10:00:00').toDate(),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);
    total = await waitForResource(subject, 'totalSumOfferingsDuration');
    assert.strictEqual(Number(total), 24.5);
  });

  test('maxSingleOfferingDuration', async function (assert) {
    assert.expect(2);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    let max = await waitForResource(subject, 'maxSingleOfferingDuration');
    assert.strictEqual(max, 0);

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01').toDate(),
      endDate: moment('2017-01-02').toDate(),
      session: subject,
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00').toDate(),
      endDate: moment('2017-01-01 10:00:00').toDate(),
      session: subject,
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);
    max = await waitForResource(subject, 'maxSingleOfferingDuration');
    assert.strictEqual(Number(max), 24.0);
  });

  test('firstOfferingDate - no offerings, and no ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const firstDate = await waitForResource(subject, 'firstOfferingDate');
    assert.strictEqual(firstDate, null);
  });

  test('firstOfferingDate - ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    const ilm = store.createRecord('ilmSession', {
      dueDate: moment('2015-01-01').toDate(),
    });
    subject.set('ilmSession', ilm);
    const firstDate = await waitForResource(subject, 'firstOfferingDate');
    assert.strictEqual(firstDate, ilm.get('dueDate'));
  });

  test('firstOfferingDate - offerings', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    const offering1 = store.createRecord('offering', {
      startDate: moment('2017-01-01').toDate(),
    });
    const offering2 = store.createRecord('offering', {
      startDate: moment('2016-01-01').toDate(),
    });
    subject.get('offerings').pushObjects([offering1, offering2]);
    const firstDate = await waitForResource(subject, 'firstOfferingDate');
    assert.strictEqual(offering2.get('startDate'), firstDate);
  });

  test('sortedOfferingsByDate', async function (assert) {
    assert.expect(4);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');
    const offering1 = store.createRecord('offering', {
      startDate: moment('2017-01-01').toDate(),
    });
    const offering2 = store.createRecord('offering', {
      startDate: moment('2016-01-01').toDate(),
    });
    const offering3 = store.createRecord('offering', {
      startDate: moment('2015-01-01').toDate(),
    });
    const offeringWithNoStartDate = store.createRecord('offering');
    subject
      .get('offerings')
      .pushObjects([offering1, offering2, offering3, offeringWithNoStartDate]);
    const sortedDates = await waitForResource(subject, 'sortedOfferingsByDate');
    assert.strictEqual(sortedDates.length, 3);
    assert.strictEqual(sortedDates[0], offering3);
    assert.strictEqual(sortedDates[1], offering2);
    assert.strictEqual(sortedDates[2], offering1);
  });

  test('maxDuration with ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01').toDate(),
      endDate: moment('2017-01-02').add(30, 'minutes').toDate(),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00').toDate(),
      endDate: moment('2017-01-01 10:00:00').toDate(),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);
    const ilmSession = store.createRecord('ilmSession', { hours: 2.1 });
    subject.set('ilmSession', ilmSession);

    const max = await waitForResource(subject, 'maxDuration');
    assert.strictEqual(Number(max), 26.6);
  });

  test('maxDuration without ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01').toDate(),
      endDate: moment('2017-01-02').toDate(),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00').toDate(),
      endDate: moment('2017-01-01 10:00:00').toDate(),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);

    const max = await waitForResource(subject, 'maxDuration');
    assert.strictEqual(Number(max), 24.0);
  });

  test('maxDuration only ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const ilmSession = store.createRecord('ilmSession', { hours: 2 });
    subject.set('ilmSession', ilmSession);

    const max = await waitForResource(subject, 'maxDuration');
    assert.strictEqual(Number(max), 2.0);
  });

  test('totalSumDuration with ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01').toDate(),
      endDate: moment('2017-01-02').add(30, 'minutes').toDate(),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00').toDate(),
      endDate: moment('2017-01-01 10:00:00').toDate(),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);
    const ilmSession = store.createRecord('ilmSession', { hours: 2.1 });
    subject.set('ilmSession', ilmSession);

    const total = await waitForResource(subject, 'totalSumDuration');
    assert.strictEqual(Number(total), 27.1);
  });

  test('totalSumDuration without ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01').toDate(),
      endDate: moment('2017-01-02').toDate(),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00').toDate(),
      endDate: moment('2017-01-01 10:00:00').toDate(),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);

    const total = await waitForResource(subject, 'totalSumDuration');
    assert.strictEqual(Number(total), 24.5);
  });

  test('totalSumDuration only ILM', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const ilmSession = store.createRecord('ilmSession', { hours: 2 });
    subject.set('ilmSession', ilmSession);

    const total = await waitForResource(subject, 'totalSumDuration');
    assert.strictEqual(Number(total), 2.0);
  });

  test('allInstructors gets offerings data', async function (assert) {
    assert.expect(3);
    const store = this.owner.lookup('service:store');
    const subject = this.owner.lookup('service:store').createRecord('session');

    const offering = store.createRecord('offering');
    const instructorGroup = store.createRecord('instructorGroup', {
      offerings: [offering],
    });
    const user1 = store.createRecord('user', {
      instructedOfferings: [offering],
    });
    const user2 = store.createRecord('user', {
      instructorGroups: [instructorGroup],
    });
    subject.set('offerings', [offering]);

    const allInstructors = await waitForResource(subject, 'allInstructors');
    assert.strictEqual(allInstructors.length, 2);
    assert.ok(allInstructors.includes(user1));
    assert.ok(allInstructors.includes(user2));
  });

  test('allInstructors gets ilmSession data', async function (assert) {
    assert.expect(3);
    const subject = this.owner.lookup('service:store').createRecord('session');
    const store = this.owner.lookup('service:store');

    const ilmSession = store.createRecord('ilmSession', { id: 24 });
    const instructorGroup = store.createRecord('instructorGroup', {
      ilmSessions: [ilmSession],
    });
    const user1 = store.createRecord('user', {
      instructorIlmSessions: [ilmSession],
    });
    const user2 = store.createRecord('user', {
      instructorGroups: [instructorGroup],
    });
    subject.set('ilmSession', ilmSession);

    const allInstructors = await waitForResource(subject, 'allInstructors');
    assert.strictEqual(allInstructors.length, 2);
    assert.ok(allInstructors.includes(user1));
    assert.ok(allInstructors.includes(user2));
  });

  test('text only empty description', async function (assert) {
    assert.expect(1);
    const subject = this.owner.lookup('service:store').createRecord('session');
    assert.strictEqual(subject.textDescription, '');
  });

  test('test showUnlinkIcon shows when only some sessionObjectives are linked to courseObjectives', async function (assert) {
    assert.expect(1);
    const store = this.owner.lookup('service:store');
    const course = store.createRecord('course');
    const courseObjective = store.createRecord('course-objective', { course });
    const session = store.createRecord('session', { course });
    store.createRecord('session-objective', {
      session,
      courseObjectives: [courseObjective],
    });
    store.createRecord('session-objective', {
      session,
    });
    const showUnlinkIcon = await waitForResource(session, 'showUnlinkIcon');
    assert.ok(showUnlinkIcon);
  });

  test('test showUnlinkIcon shows when no sessionObjectives are linked to courseObjectives', async function (assert) {
    assert.expect(1);
    const store = this.owner.lookup('service:store');
    const course = store.createRecord('course');
    store.createRecord('course-objective', { course });
    const session = store.createRecord('session', { course });
    store.createRecord('session-objective', {
      session,
    });
    store.createRecord('session-objective', {
      session,
    });
    const showUnlinkIcon = await waitForResource(session, 'showUnlinkIcon');
    assert.ok(showUnlinkIcon);
  });

  test('test dont showUnlinkIcon when all session objectives are linked to course objectives', async function (assert) {
    const store = this.owner.lookup('service:store');
    const course = store.createRecord('course');
    const courseObjective1 = store.createRecord('course-objective', { course });
    const courseObjective2 = store.createRecord('course-objective', { course });
    const courseObjective3 = store.createRecord('course-objective', { course });
    const session = store.createRecord('session', { course });
    store.createRecord('session-objective', {
      session,
      courseObjectives: [courseObjective1],
    });
    store.createRecord('session-objective', {
      session,
      courseObjectives: [courseObjective2, courseObjective3],
    });
    const showUnlinkIcon = await waitForResource(session, 'showUnlinkIcon');
    assert.notOk(showUnlinkIcon);
  });

  test('getAllInstructors', async function (assert) {
    const store = this.owner.lookup('service:store');
    const instructor1 = store.createRecord('user');
    const instructor2 = store.createRecord('user');
    const instructor3 = store.createRecord('user');
    const instructor4 = store.createRecord('user');
    const instructor5 = store.createRecord('user');
    const instructor6 = store.createRecord('user');
    const instructor7 = store.createRecord('user');
    const instructor8 = store.createRecord('user');
    const instructor9 = store.createRecord('user');
    const instructorGroup1 = store.createRecord('instructorGroup', {
      users: [instructor1, instructor2],
    });
    const instructorGroup2 = store.createRecord('instructorGroup', {
      users: [instructor3],
    });
    const instructorGroup3 = store.createRecord('instructorGroup', {
      users: [instructor4, instructor5],
    });
    const ilmSession = store.createRecord('ilmSession', {
      instructorGroups: [instructorGroup1],
      instructors: [instructor6, instructor1],
    });
    const offering1 = store.createRecord('offering', {
      instructorGroups: [instructorGroup2],
      instructors: [instructor7, instructor2],
    });
    const offering2 = store.createRecord('offering', {
      instructorGroups: [instructorGroup3],
      instructors: [instructor8, instructor9, instructor9],
    });
    const model = store.createRecord('session', {
      ilmSession,
      offerings: [offering1, offering2],
    });

    const allInstructors = await model.getAllInstructors();
    assert.strictEqual(allInstructors.length, 9);
    assert.ok(allInstructors.includes(instructor1));
    assert.ok(allInstructors.includes(instructor2));
    assert.ok(allInstructors.includes(instructor3));
    assert.ok(allInstructors.includes(instructor4));
    assert.ok(allInstructors.includes(instructor5));
    assert.ok(allInstructors.includes(instructor6));
    assert.ok(allInstructors.includes(instructor7));
    assert.ok(allInstructors.includes(instructor8));
    assert.ok(allInstructors.includes(instructor9));
  });

  test('getTotalSumDuration with ILM', async function (assert) {
    const store = this.owner.lookup('service:store');
    const subject = store.createRecord('session');

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01').toDate(),
      endDate: moment('2017-01-02').add(30, 'minutes').toDate(),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00').toDate(),
      endDate: moment('2017-01-01 10:00:00').toDate(),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);
    const ilmSession = store.createRecord('ilmSession', { hours: 2.1 });
    subject.set('ilmSession', ilmSession);

    const total = await subject.getTotalSumDuration();
    assert.strictEqual(Number(total), 27.1);
  });

  test('getTotalSumDuration without ILM', async function (assert) {
    const store = this.owner.lookup('service:store');
    const subject = store.createRecord('session');

    const allDayOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01').toDate(),
      endDate: moment('2017-01-02').toDate(),
    });
    const halfAnHourOffering = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00').toDate(),
      endDate: moment('2017-01-01 10:00:00').toDate(),
    });
    subject.get('offerings').pushObjects([allDayOffering, halfAnHourOffering]);

    const total = await subject.getTotalSumDuration();
    assert.strictEqual(Number(total), 24.5);
  });

  test('getTotalSumDuration only ILM', async function (assert) {
    const store = this.owner.lookup('service:store');
    const subject = store.createRecord('session');

    const ilmSession = store.createRecord('ilmSession', { hours: 2 });
    subject.set('ilmSession', ilmSession);

    const total = await subject.getTotalSumDuration();
    assert.strictEqual(Number(total), 2.0);
  });

  test('getTotalSumDurationByInstructor', async function (assert) {
    const store = this.owner.lookup('service:store');
    const instructor1 = store.createRecord('user', { id: 1 });
    const instructor2 = store.createRecord('user', { id: 2 });
    const instructor3 = store.createRecord('user', { id: 3 });
    const instructorGroup1 = store.createRecord('instructorGroup', {
      users: [instructor1],
    });
    const ilmSession = store.createRecord('ilmSession', {
      hours: 1.5,
      instructorGroups: [instructorGroup1],
      instructors: [instructor2],
    });
    const offering1 = store.createRecord('offering', {
      startDate: moment('2017-01-01 00:00:00').toDate(),
      endDate: moment('2017-01-02 00:00:00').toDate(),
      instructorGroups: [instructorGroup1],
    });
    const offering2 = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00').toDate(),
      endDate: moment('2017-01-01 10:00:00').toDate(),
      instructors: [instructor1, instructor2],
    });
    const subject = store.createRecord('session', {
      ilmSession,
      offerings: [offering1, offering2],
    });
    let total = await subject.getTotalSumDurationByInstructor(instructor1);
    assert.strictEqual(total, 1560);
    total = await subject.getTotalSumDurationByInstructor(instructor2);
    assert.strictEqual(total, 120);
    total = await subject.getTotalSumDurationByInstructor(instructor3);
    assert.strictEqual(total, 0);
  });

  test('getTotalSumOfferingsDurationByInstructor', async function (assert) {
    const store = this.owner.lookup('service:store');
    const instructor1 = store.createRecord('user', { id: 1 });
    const instructor2 = store.createRecord('user', { id: 2 });
    const instructor3 = store.createRecord('user', { id: 3 });
    const instructorGroup1 = store.createRecord('instructorGroup', {
      users: [instructor1],
    });
    const offering1 = store.createRecord('offering', {
      startDate: moment('2017-01-01 00:00:00').toDate(),
      endDate: moment('2017-01-02 00:00:00').toDate(),
      instructorGroups: [instructorGroup1],
    });
    const offering2 = store.createRecord('offering', {
      startDate: moment('2017-01-01 09:30:00').toDate(),
      endDate: moment('2017-01-01 10:00:00').toDate(),
      instructors: [instructor1, instructor2],
    });
    const subject = store.createRecord('session', {
      offerings: [offering1, offering2],
    });
    let total = await subject.getTotalSumOfferingsDurationByInstructor(instructor1);
    assert.strictEqual(total, 1470);
    total = await subject.getTotalSumOfferingsDurationByInstructor(instructor2);
    assert.strictEqual(total, 30);
    total = await subject.getTotalSumOfferingsDurationByInstructor(instructor3);
    assert.strictEqual(total, 0);
  });

  test('getTotalSumIlmDurationByInstructor', async function (assert) {
    const store = this.owner.lookup('service:store');
    const instructor1 = store.createRecord('user', { id: 1 });
    const instructor2 = store.createRecord('user', { id: 2 });
    const instructor3 = store.createRecord('user', { id: 3 });
    const instructorGroup1 = store.createRecord('instructorGroup', {
      users: [instructor1],
    });
    const ilmSession = store.createRecord('ilmSession', {
      hours: 1.5,
      instructorGroups: [instructorGroup1],
      instructors: [instructor2],
    });
    const subject = store.createRecord('session', {
      ilmSession,
    });
    let total = await subject.getTotalSumIlmDurationByInstructor(instructor1);
    assert.strictEqual(total, 90);
    total = await subject.getTotalSumIlmDurationByInstructor(instructor2);
    assert.strictEqual(total, 90);
    total = await subject.getTotalSumIlmDurationByInstructor(instructor3);
    assert.strictEqual(total, 0);
  });
});
