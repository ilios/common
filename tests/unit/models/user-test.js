import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { waitForResource } from 'ilios-common';

module('Unit | Model | User', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    assert.ok(!!model);
  });

  test('full name', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    model.set('firstName', 'first');
    model.set('lastName', 'last');
    model.set('middleName', 'middle');
    assert.strictEqual(model.get('fullName'), 'first m. last');
  });

  test('full name no middle name', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    model.set('firstName', 'first');
    model.set('lastName', 'last');
    assert.strictEqual(model.get('fullName'), 'first last');
  });

  test('fullNameFromFirstMiddleLastName', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    model.set('firstName', 'first');
    model.set('lastName', 'last');
    model.set('middleName', 'middle');
    assert.strictEqual(model.get('fullNameFromFirstMiddleLastName'), 'first middle last');
  });

  test('fullNameFromFirstMiddleInitialLastName', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    model.set('firstName', 'first');
    model.set('lastName', 'last');
    model.set('middleName', 'middle');
    assert.strictEqual(model.get('fullNameFromFirstMiddleInitialLastName'), 'first m. last');
  });

  test('fullNameFromFirstLastName', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    model.set('firstName', 'first');
    model.set('lastName', 'last');
    model.set('middleName', 'middle');
    assert.strictEqual(model.get('fullNameFromFirstLastName'), 'first last');
  });

  test('does not have different display name', function (assert) {
    const fixtures = [
      {
        firstName: 'first',
        lastName: 'last',
        middleName: null,
        displayName: 'first last',
      },
      {
        firstName: '  first',
        lastName: ' last ',
        middleName: null,
        displayName: 'first last    ',
      },
      {
        firstName: 'First',
        lastName: 'LAST',
        middleName: null,
        displayName: 'FiRsT LasT',
      },
      {
        firstName: 'first',
        lastName: 'last',
        middleName: 'middle',
        displayName: 'first last',
      },
      {
        firstName: 'first',
        lastName: 'last',
        middleName: 'middle',
        displayName: 'first middle last',
      },
      {
        firstName: 'first',
        lastName: 'last',
        middleName: 'middle',
        displayName: 'first m. last',
      },
      {
        firstName: 'first',
        lastName: 'last',
        middleName: null,
        displayName: null,
      },
    ];
    assert.expect(fixtures.length);
    fixtures.forEach((fixture) => {
      const model = this.owner.lookup('service:store').createRecord('user');
      model.set('firstName', fixture.firstName);
      model.set('lastName', fixture.lastName);
      model.set('middleName', fixture.middleName);
      assert.notOk(model.get('hasDifferentDisplayName'));
    });
  });

  test('has different display name', function (assert) {
    const fixtures = [
      {
        firstName: 'first',
        lastName: 'last',
        middleName: null,
        displayName: 'clem chowder',
      },
      {
        firstName: 'first',
        lastName: 'last',
        middleName: 'n',
        displayName: 'first m. last',
      },
    ];
    assert.expect(fixtures.length);
    fixtures.forEach((fixture) => {
      const model = this.owner.lookup('service:store').createRecord('user');
      model.set('firstName', fixture.firstName);
      model.set('lastName', fixture.lastName);
      model.set('middleName', fixture.middleName);
      assert.notOk(model.get('hasDifferentDisplayName'));
    });
  });

  test('full name with displayName', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    model.set('displayName', 'something else');
    model.set('firstName', 'first');
    model.set('lastName', 'last');
    assert.strictEqual(model.get('fullName'), 'something else');
  });

  test('full name with empty displayName', function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    model.set('displayName', '');
    model.set('firstName', 'first');
    model.set('lastName', 'last');
    assert.strictEqual(model.get('fullName'), 'first last');
  });

  test('gets all directed courses', async function (assert) {
    assert.expect(3);
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const courses = [];
    courses.push(
      store.createRecord('course', {
        directors: [model],
        id: 1,
      }),
    );
    courses.push(
      store.createRecord('course', {
        directors: [model],
        id: 2,
      }),
    );
    const allRelatedCourses = await waitForResource(model, 'allRelatedCourses');
    assert.strictEqual(allRelatedCourses.length, courses.length);
    courses.forEach((course) => {
      assert.ok(allRelatedCourses.includes(course));
    });
  });

  test('gets all administered courses', async function (assert) {
    assert.expect(3);
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const courses = [];
    courses.push(
      store.createRecord('course', {
        administrators: [model],
        id: 1,
      }),
    );
    courses.push(
      store.createRecord('course', {
        administrators: [model],
        id: 2,
      }),
    );
    const allRelatedCourses = await waitForResource(model, 'allRelatedCourses');
    assert.strictEqual(allRelatedCourses.length, courses.length);
    courses.forEach((course) => {
      assert.ok(allRelatedCourses.includes(course));
    });
  });

  test('gets all learner group courses', async function (assert) {
    assert.expect(3);
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    const course1 = store.createRecord('course');
    const session1 = store.createRecord('session', {
      course: course1,
    });
    const offering1 = store.createRecord('offering', {
      session: session1,
    });
    const offering2 = store.createRecord('offering', {
      session: session1,
    });
    store.createRecord('learnerGroup', {
      offerings: [offering1, offering2],
      users: [model],
    });
    const course2 = store.createRecord('course');
    const session2 = store.createRecord('session', {
      course: course2,
    });
    const offering3 = store.createRecord('offering', {
      session: session2,
    });
    store.createRecord('learnerGroup', {
      offerings: [offering3],
      users: [model],
    });

    const courses = [course1, course2];
    const allRelatedCourses = await waitForResource(model, 'allRelatedCourses');
    assert.strictEqual(allRelatedCourses.length, courses.length);
    courses.forEach((course) => {
      assert.ok(allRelatedCourses.includes(course));
    });
  });

  test('gets all instructor group courses', async function (assert) {
    assert.expect(3);
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    const course1 = store.createRecord('course');
    const session1 = store.createRecord('session', {
      course: course1,
    });
    const offering1 = store.createRecord('offering', {
      session: session1,
    });
    const offering2 = store.createRecord('offering', {
      session: session1,
    });
    store.createRecord('instructorGroup', {
      offerings: [offering1, offering2],
      users: [model],
    });
    const course2 = store.createRecord('course');
    const session2 = store.createRecord('session', {
      course: course2,
    });
    const offering3 = store.createRecord('offering', {
      session: session2,
    });
    store.createRecord('instructorGroup', {
      offerings: [offering3],
      users: [model],
    });

    const courses = [course1, course2];
    const allRelatedCourses = await waitForResource(model, 'allRelatedCourses');
    assert.strictEqual(allRelatedCourses.length, courses.length);
    courses.forEach((course) => {
      assert.ok(allRelatedCourses.includes(course));
    });
  });

  test('gets all instructed offering courses', async function (assert) {
    assert.expect(3);
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    const course1 = store.createRecord('course');
    const session1 = store.createRecord('session', {
      course: course1,
    });
    store.createRecord('offering', {
      session: session1,
      instructors: [model],
    });
    store.createRecord('offering', {
      session: session1,
      instructors: [model],
    });
    const course2 = store.createRecord('course');
    const session2 = store.createRecord('session', {
      course: course2,
    });
    store.createRecord('offering', {
      session: session2,
      instructors: [model],
    });

    const courses = [course1, course2];
    const allRelatedCourses = await waitForResource(model, 'allRelatedCourses');
    assert.strictEqual(allRelatedCourses.length, courses.length);
    courses.forEach((course) => {
      assert.ok(allRelatedCourses.includes(course));
    });
  });

  test('gets all learner offering courses', async function (assert) {
    assert.expect(3);
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    const course1 = store.createRecord('course');
    const session1 = store.createRecord('session', {
      course: course1,
    });
    store.createRecord('offering', {
      session: session1,
      learners: [model],
    });
    store.createRecord('offering', {
      session: session1,
      learners: [model],
    });
    const course2 = store.createRecord('course');
    const session2 = store.createRecord('session', {
      course: course2,
    });
    store.createRecord('offering', {
      session: session2,
      learners: [model],
    });

    const courses = [course1, course2];
    const allRelatedCourses = await waitForResource(model, 'allRelatedCourses');
    assert.strictEqual(allRelatedCourses.length, courses.length);
    courses.forEach((course) => {
      assert.ok(allRelatedCourses.includes(course));
    });
  });

  test('gets all learner group ILMSession courses', async function (assert) {
    assert.expect(3);
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    const course1 = store.createRecord('course');
    const session1 = store.createRecord('session', {
      course: course1,
    });
    const session2 = store.createRecord('session', {
      course: course1,
    });
    const ilm1 = store.createRecord('ilmSession', {
      session: session1,
    });
    const ilm2 = store.createRecord('ilmSession', {
      session: session2,
    });
    store.createRecord('learnerGroup', {
      ilmSessions: [ilm1, ilm2],
      users: [model],
    });
    const course2 = store.createRecord('course');
    const session3 = store.createRecord('session', {
      course: course2,
    });
    const ilm3 = store.createRecord('ilmSession', {
      session: session3,
    });
    store.createRecord('learnerGroup', {
      ilmSessions: [ilm3],
      users: [model],
    });

    const courses = [course1, course2];
    const allRelatedCourses = await waitForResource(model, 'allRelatedCourses');
    assert.strictEqual(allRelatedCourses.length, courses.length);
    courses.forEach((course) => {
      assert.ok(allRelatedCourses.includes(course));
    });
  });

  test('gets all instructor group ILMSession courses', async function (assert) {
    assert.expect(3);
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    const course1 = store.createRecord('course');
    const session1 = store.createRecord('session', {
      course: course1,
    });
    const session2 = store.createRecord('session', {
      course: course1,
    });
    const ilm1 = store.createRecord('ilmSession', {
      id: 1,
      session: session1,
    });
    const ilm2 = store.createRecord('ilmSession', {
      id: 2,
      session: session2,
    });
    store.createRecord('instructorGroup', {
      ilmSessions: [ilm1, ilm2],
      users: [model],
    });
    const course2 = store.createRecord('course');
    const session3 = store.createRecord('session', {
      course: course2,
    });
    const ilm3 = store.createRecord('ilmSession', {
      id: 3,
      session: session3,
    });
    store.createRecord('instructorGroup', {
      ilmSessions: [ilm3],
      users: [model],
    });

    const courses = [course1, course2];
    const allRelatedCourses = await waitForResource(model, 'allRelatedCourses');
    assert.strictEqual(allRelatedCourses.length, courses.length);
    courses.forEach((course) => {
      assert.ok(allRelatedCourses.includes(course));
    });
  });

  test('gets all learner ilm courses', async function (assert) {
    assert.expect(3);
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const course1 = store.createRecord('course');
    const session1 = store.createRecord('session', {
      course: course1,
    });
    store.createRecord('ilmSession', {
      session: session1,
      learners: [model],
    });
    const course2 = store.createRecord('course');
    const session2 = store.createRecord('session', {
      course: course2,
    });
    store.createRecord('ilmSession', {
      session: session2,
      learners: [model],
    });

    const courses = [course1, course2];
    const allRelatedCourses = await waitForResource(model, 'allRelatedCourses');
    assert.strictEqual(allRelatedCourses.length, courses.length);
    courses.forEach((course) => {
      assert.ok(allRelatedCourses.includes(course));
    });
  });

  test('isStudent - no roles', async function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    const isStudent = await waitForResource(model, 'isStudent');
    assert.notOk(isStudent);
  });

  test('isStudent - roles, but no student role', async function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const notAStudentRole = store.createRecord('user-role', {
      title: 'East-German Pie Eating Champion of 1997',
    });
    const notAStudentRoleEither = store.createRecord('user-role', {
      title: 'Alien Overlord',
    });
    (await model.roles).push(notAStudentRole, notAStudentRoleEither);
    const isStudent = await waitForResource(model, 'isStudent');
    assert.notOk(isStudent);
  });

  test('isStudent - has student role', async function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const notAStudentRole = store.createRecord('user-role', {
      title: 'Non-student',
    });
    const studentRole = store.createRecord('user-role', { title: 'Student' });
    (await model.roles).push(notAStudentRole, studentRole);
    const isStudent = await waitForResource(model, 'isStudent');
    assert.ok(isStudent);
  });

  test('performsNonLearnerFunction - directedCourses', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('course', { directors: [model] });
    const performsNonLearnerFunction = await waitForResource(model, 'performsNonLearnerFunction');
    assert.ok(performsNonLearnerFunction);
  });

  test('performsNonLearnerFunction - administeredCourses', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('course', { administrators: [model] });
    const performsNonLearnerFunction = await waitForResource(model, 'performsNonLearnerFunction');
    assert.ok(performsNonLearnerFunction);
  });

  test('performsNonLearnerFunction - administeredSessions', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('session', { administrators: [model] });
    const performsNonLearnerFunction = await waitForResource(model, 'performsNonLearnerFunction');
    assert.ok(performsNonLearnerFunction);
  });

  test('performsNonLearnerFunction - instructedLearnerGroups', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('learner-group', { instructors: [model] });
    const performsNonLearnerFunction = await waitForResource(model, 'performsNonLearnerFunction');
    assert.ok(performsNonLearnerFunction);
  });

  test('performsNonLearnerFunction - instructorGroups', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('instructor-group', { users: [model] });
    const performsNonLearnerFunction = await waitForResource(model, 'performsNonLearnerFunction');
    assert.ok(performsNonLearnerFunction);
  });

  test('performsNonLearnerFunction - instructedOfferings', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('offering', { instructors: [model] });
    const performsNonLearnerFunction = await waitForResource(model, 'performsNonLearnerFunction');
    assert.ok(performsNonLearnerFunction);
  });

  test('performsNonLearnerFunction - instructedIlmSessions', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('ilmSession', { instructors: [model] });
    const performsNonLearnerFunction = await waitForResource(model, 'performsNonLearnerFunction');
    assert.ok(performsNonLearnerFunction);
  });

  test('performsNonLearnerFunction - directedPrograms', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('program', { directors: [model] });
    const performsNonLearnerFunction = await waitForResource(model, 'performsNonLearnerFunction');
    assert.ok(performsNonLearnerFunction);
  });

  test('performsNonLearnerFunction - programYears', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('program-year', { directors: [model] });
    const performsNonLearnerFunction = await waitForResource(model, 'performsNonLearnerFunction');
    assert.ok(performsNonLearnerFunction);
  });

  test('performsNonLearnerFunction - administeredCurriculumInventoryReports', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('curriculum-inventory-report', {
      administrators: [model],
    });
    const performsNonLearnerFunction = await waitForResource(model, 'performsNonLearnerFunction');
    assert.ok(performsNonLearnerFunction);
  });

  test('performsNonLearnerFunction - directedSchools', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('school', { directors: [model] });
    const performsNonLearnerFunction = await waitForResource(model, 'performsNonLearnerFunction');
    assert.ok(performsNonLearnerFunction);
  });

  test('performsNonLearnerFunction - administeredSchools', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('school', { administrators: [model] });
    const performsNonLearnerFunction = await waitForResource(model, 'performsNonLearnerFunction');
    assert.ok(performsNonLearnerFunction);
  });

  test('isLearner - cohorts', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('cohort', { users: [model] });
    const isLearner = await waitForResource(model, 'isLearner');
    assert.ok(isLearner);
  });

  test('isLearner - offerings', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('offering', { learners: [model] });
    const isLearner = await waitForResource(model, 'isLearner');
    assert.ok(isLearner);
  });

  test('isLearner - learnerIlmSessions', async function (assert) {
    const store = this.owner.lookup('service:store');
    const model = store.createRecord('user');
    store.createRecord('ilm-session', { learners: [model] });
    const isLearner = await waitForResource(model, 'isLearner');
    assert.ok(isLearner);
  });

  test('gets all instructor ilm courses', async function (assert) {
    assert.expect(3);
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const course1 = store.createRecord('course');
    const session1 = store.createRecord('session', {
      course: course1,
    });
    store.createRecord('ilmSession', {
      session: session1,
      instructors: [model],
    });
    const course2 = store.createRecord('course');
    const session2 = store.createRecord('session', {
      course: course2,
    });
    store.createRecord('ilmSession', {
      session: session2,
      instructors: [model],
    });

    const courses = [course1, course2];
    const allRelatedCourses = await waitForResource(model, 'allRelatedCourses');
    assert.strictEqual(allRelatedCourses.length, courses.length);
    courses.forEach((course) => {
      assert.ok(allRelatedCourses.includes(course));
    });
  });

  test('find lowest group at top of tree', async function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const learnerGroup = store.createRecord('learnerGroup', {
      id: 1,
      users: [model],
    });
    const learnerGroup2 = store.createRecord('learnerGroup', {
      id: 2,
      parent: learnerGroup,
    });
    const learnerGroup3 = store.createRecord('learnerGroup', {
      id: 3,
      parent: learnerGroup2,
    });
    const tree = [learnerGroup, learnerGroup2, learnerGroup3];
    (await model.learnerGroups).push(learnerGroup);

    const lowestGroup = await model.getLowestMemberGroupInALearnerGroupTree(tree);

    assert.ok(lowestGroup);
    assert.strictEqual(lowestGroup.get('id'), learnerGroup.get('id'));
  });

  test('find lowest group in middle of tree', async function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const learnerGroup = store.createRecord('learnerGroup', {
      id: 1,
      users: [model],
    });
    const learnerGroup2 = store.createRecord('learnerGroup', {
      id: 2,
      parent: learnerGroup,
      users: [model],
    });
    const learnerGroup3 = store.createRecord('learnerGroup', {
      id: 3,
      parent: learnerGroup2,
    });
    const tree = [learnerGroup, learnerGroup2, learnerGroup3];
    (await model.learnerGroups).push(learnerGroup, learnerGroup2);

    const lowestGroup = await model.getLowestMemberGroupInALearnerGroupTree(tree);

    assert.ok(lowestGroup);
    assert.strictEqual(lowestGroup.get('id'), learnerGroup2.get('id'));
  });

  test('find lowest group in bottom of tree', async function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const learnerGroup = store.createRecord('learnerGroup', {
      id: 1,
      users: [model],
    });
    const learnerGroup2 = store.createRecord('learnerGroup', {
      id: 2,
      parent: learnerGroup,
      users: [model],
    });
    const learnerGroup3 = store.createRecord('learnerGroup', {
      id: 3,
      parent: learnerGroup2,
      users: [model],
    });
    const tree = [learnerGroup, learnerGroup2, learnerGroup3];
    (await model.learnerGroups).push(learnerGroup, learnerGroup2, learnerGroup3);

    const lowestGroup = await model.getLowestMemberGroupInALearnerGroupTree(tree);

    assert.ok(lowestGroup);
    assert.strictEqual(lowestGroup.get('id'), learnerGroup3.get('id'));
  });

  test('return null when there is no group in the tree', async function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const learnerGroup = store.createRecord('learnerGroup');
    const learnerGroup2 = store.createRecord('learnerGroup', {
      id: 2,
      parent: learnerGroup,
    });
    const learnerGroup3 = store.createRecord('learnerGroup', {
      id: 3,
      parent: learnerGroup2,
    });
    const tree = [learnerGroup, learnerGroup2, learnerGroup3];

    const lowestGroup = await model.getLowestMemberGroupInALearnerGroupTree(tree);
    assert.strictEqual(lowestGroup, null);
  });

  test('gets secondary cohorts (all cohorts not the primary cohort)', async function (assert) {
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const primaryCohort = store.createRecord('cohort', {
      users: [model],
    });
    const secondaryCohort = store.createRecord('cohort', {
      users: [model],
    });
    const anotherCohort = store.createRecord('cohort', {
      users: [model],
    });
    model.set('primaryCohort', primaryCohort);
    (await model.cohorts).push(primaryCohort, secondaryCohort, anotherCohort);

    const cohorts = await waitForResource(model, 'secondaryCohorts');
    assert.strictEqual(cohorts.length, 2);
    assert.ok(cohorts.includes(secondaryCohort));
    assert.ok(cohorts.includes(anotherCohort));
    assert.notOk(cohorts.includes(primaryCohort));
  });

  test('allInstructedCourses gets ALL instructed courses', async function (assert) {
    assert.expect(5);
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const course1 = store.createRecord('course');
    const session1 = store.createRecord('session', { course: course1 });
    store.createRecord('offering', {
      session: session1,
      instructors: [model],
    });
    const course2 = store.createRecord('course');
    const session2 = store.createRecord('session', { course: course2 });
    const instructorGroup1 = store.createRecord('instructor-group', {
      users: [model],
    });
    store.createRecord('offering', {
      session: session2,
      instructorGroups: [instructorGroup1],
    });

    const course3 = store.createRecord('course');
    const session3 = store.createRecord('session', { course: course3 });
    store.createRecord('ilmSession', {
      session: session3,
      instructors: [model],
    });

    const instructorGroup2 = store.createRecord('instructor-group', {
      users: [model],
    });
    const course4 = store.createRecord('course');
    const session4 = store.createRecord('session', { course: course4 });
    store.createRecord('ilmSession', {
      session: session4,
      instructorGroups: [instructorGroup2],
    });

    const course = [course1, course2, course3, course4];
    const allInstructedCourses = await waitForResource(model, 'allInstructedCourses');
    assert.strictEqual(allInstructedCourses.length, course.length);
    course.forEach((session) => {
      assert.ok(allInstructedCourses.includes(session));
    });
  });

  test('allInstructedSessions gets ALL instructed sessions', async function (assert) {
    assert.expect(6);
    const model = this.owner.lookup('service:store').createRecord('user');
    const store = this.owner.lookup('service:store');
    const session1 = store.createRecord('session');
    store.createRecord('offering', {
      session: session1,
      instructors: [model],
    });
    const session2 = store.createRecord('session');
    const instructorGroup1 = store.createRecord('instructor-group', {
      users: [model],
    });
    store.createRecord('offering', {
      session: session2,
      instructorGroups: [instructorGroup1],
    });

    const session3 = store.createRecord('session');
    store.createRecord('ilmSession', {
      session: session3,
      instructors: [model],
    });

    const instructorGroup2 = store.createRecord('instructor-group', {
      users: [model],
    });
    const session4 = store.createRecord('session');
    store.createRecord('ilmSession', {
      session: session4,
      instructorGroups: [instructorGroup2],
    });

    const session5 = store.createRecord('session');
    const learnerGroup1 = store.createRecord('learner-group', {
      instructors: [model],
    });
    store.createRecord('offering', {
      session: session5,
      learnerGroups: [learnerGroup1],
    });

    const sessions = [session1, session2, session3, session4, session5];
    const allInstructedSessions = await waitForResource(model, 'allInstructedSessions');
    assert.strictEqual(allInstructedSessions.length, sessions.length);
    sessions.forEach((session) => {
      assert.ok(allInstructedSessions.includes(session));
    });
  });
});
