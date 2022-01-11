import { currentRouteName } from '@ember/test-helpers';
import { DateTime } from 'luxon';
import { module, test } from 'qunit';
import { setupAuthentication } from 'ilios-common';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import page from 'ilios-common/page-objects/sessions';
import sessionPage from 'ilios-common/page-objects/session';

const today = DateTime.local().set({ hours: 8 });
module('Acceptance | Course - Session List', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  hooks.beforeEach(async function () {
    this.school = this.server.create('school');
    this.user = await setupAuthentication({ school: this.school });
    this.sessionType = this.server.create('sessionType', {
      school: this.school,
    });

    const learner1 = this.server.create('user');
    const learner2 = this.server.create('user');
    const instructor1 = this.server.create('user');
    const instructor2 = this.server.create('user');
    const instructor3 = this.server.create('user');
    const learnerGroup1 = this.server.create('learnerGroup', {
      users: [learner1, learner2],
    });
    const learnerGroup2 = this.server.create('learnerGroup');
    const instructorGroup = this.server.create('instructorGroup', {
      users: [instructor1, instructor2, instructor3],
    });
    this.course = this.server.create('course', {
      school: this.school,
      directorIds: [this.user.id],
    });
    this.session1 = this.server.create('session', {
      course: this.course,
      sessionType: this.sessionType,
      updatedAt: DateTime.fromISO('2019-07-09T17:00:00').toJSDate(),
    });
    this.session2 = this.server.create('session', {
      course: this.course,
      sessionType: this.sessionType,
    });
    this.session3 = this.server.create('session', {
      course: this.course,
      sessionType: this.sessionType,
      instructionalNotes: "They're good dogs Brent",
    });
    this.session4 = this.server.create('session', {
      course: this.course,
      sessionType: this.sessionType,
      prerequisites: [this.session2],
      title: 'session3\\',
    });
    this.server.create('offering', {
      session: this.session1,
      startDate: today.toJSDate(),
      endDate: today.plus({ hours: 1 }).toJSDate(),
      learners: [learner1],
      learnerGroups: [learnerGroup1, learnerGroup2],
      instructors: [instructor1],
      instructorGroups: [instructorGroup],
    });
    this.server.create('offering', {
      session: this.session1,
      startDate: today.plus({ days: 1, hours: 1 }).toJSDate(),
      endDate: today.plus({ days: 1, hours: 4 }).toJSDate(),
    });
    this.server.create('offering', {
      session: this.session1,
      startDate: today.plus({ days: 2 }).toJSDate(),
      endDate: today.plus({ days: 2, hours: 1 }).toJSDate(),
    });
  });

  test('session list', async function (assert) {
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions } = page.courseSessions.sessionsGrid;

    assert.strictEqual(sessions.length, 4);
    assert.strictEqual(sessions[0].title, 'session 0');
    assert.strictEqual(sessions[0].type, 'session type 0');
    assert.strictEqual(sessions[0].groupCount, '2');
    assert.strictEqual(sessions[0].objectiveCount, '0');
    assert.strictEqual(sessions[0].termCount, '0');
    assert.strictEqual(
      sessions[0].firstOffering,
      today.toJSDate().toLocaleString('en', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    );
    assert.strictEqual(sessions[0].offeringCount, '3');
    assert.notOk(sessions[0].hasInstructionalNotes);
    assert.notOk(sessions[0].hasPrerequisites);

    assert.strictEqual(sessions[1].title, 'session 1');
    assert.strictEqual(sessions[1].type, 'session type 0');
    assert.strictEqual(sessions[1].groupCount, '0');
    assert.strictEqual(sessions[1].objectiveCount, '0');
    assert.strictEqual(sessions[1].termCount, '0');
    assert.strictEqual(sessions[1].firstOffering, '');
    assert.strictEqual(sessions[1].offeringCount, '0');
    assert.notOk(sessions[1].hasInstructionalNotes);
    assert.notOk(sessions[1].hasPrerequisites);

    assert.strictEqual(sessions[2].title, 'session 2');
    assert.strictEqual(sessions[2].type, 'session type 0');
    assert.strictEqual(sessions[2].groupCount, '0');
    assert.strictEqual(sessions[2].objectiveCount, '0');
    assert.strictEqual(sessions[2].termCount, '0');
    assert.strictEqual(sessions[2].firstOffering, '');
    assert.strictEqual(sessions[2].offeringCount, '0');
    assert.ok(sessions[2].hasInstructionalNotes);
    assert.notOk(sessions[2].hasPrerequisites);

    assert.strictEqual(sessions[3].title, 'session3\\');
    assert.strictEqual(sessions[3].type, 'session type 0');
    assert.strictEqual(sessions[3].groupCount, '0');
    assert.strictEqual(sessions[3].objectiveCount, '0');
    assert.strictEqual(sessions[3].termCount, '0');
    assert.strictEqual(sessions[3].firstOffering, '');
    assert.strictEqual(sessions[3].offeringCount, '0');
    assert.notOk(sessions[3].hasInstructionalNotes);
    assert.ok(sessions[3].hasPrerequisites);
  });

  test('expanded offering', async function (assert) {
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions } = page.courseSessions.sessionsGrid;

    assert.strictEqual(sessions.length, 4);
    await sessions[0].expand();
    const { offerings } = sessions[0];

    const offering1StartDate = DateTime.fromJSDate(this.server.db.offerings[0].startDate);
    const offering2StartDate = DateTime.fromJSDate(this.server.db.offerings[1].startDate);
    const offering3StartDate = DateTime.fromJSDate(this.server.db.offerings[2].startDate);

    assert.strictEqual(offerings.dates.length, 3);

    assert.strictEqual(offerings.dates[0].dayOfWeek, offering1StartDate.toFormat('cccc'));
    assert.strictEqual(offerings.dates[0].dayOfMonth, offering1StartDate.toFormat('MMMM d'));
    assert.strictEqual(offerings.dates[1].dayOfWeek, offering2StartDate.toFormat('cccc'));
    assert.strictEqual(offerings.dates[1].dayOfMonth, offering2StartDate.toFormat('MMMM d'));
    assert.strictEqual(offerings.dates[2].dayOfWeek, offering3StartDate.toFormat('cccc'));
    assert.strictEqual(offerings.dates[2].dayOfMonth, offering3StartDate.toFormat('MMMM d'));

    assert.strictEqual(offerings.offerings.length, 3);
    assert.strictEqual(offerings.offerings[0].startTime, offering1StartDate.toFormat('t'));
    assert.strictEqual(offerings.offerings[0].location, 'room 0');
    assert.strictEqual(offerings.offerings[0].learners, '(2) 1 guy M. Mc1son, 2 guy...');
    assert.strictEqual(offerings.offerings[0].learnerGroups, '(2) learner group 0, learn...');
    assert.strictEqual(offerings.offerings[0].instructors, '(3) 3 guy M. Mc3son, 4 guy...');

    assert.strictEqual(offerings.offerings[1].startTime, offering2StartDate.toFormat('t'));
    assert.strictEqual(offerings.offerings[1].location, 'room 1');
    assert.strictEqual(offerings.offerings[1].learners, '');
    assert.strictEqual(offerings.offerings[1].learnerGroups, '');
    assert.strictEqual(offerings.offerings[1].instructors, '');

    assert.strictEqual(offerings.offerings[2].startTime, offering3StartDate.toFormat('t'));
    assert.strictEqual(offerings.offerings[2].location, 'room 2');
    assert.strictEqual(offerings.offerings[2].learners, '');
    assert.strictEqual(offerings.offerings[2].learnerGroups, '');
    assert.strictEqual(offerings.offerings[2].instructors, '');
  });

  test('no offerings', async function (assert) {
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions } = page.courseSessions.sessionsGrid;

    assert.strictEqual(sessions.length, 4);
    assert.ok(sessions[0].canExpand);
    assert.strictEqual(sessions[1].expandTitle, 'This session has no offerings');
    assert.notOk(sessions[1].canExpand);
    assert.strictEqual(sessions[2].expandTitle, 'This session has no offerings');
    assert.notOk(sessions[2].canExpand);
    assert.strictEqual(sessions[3].expandTitle, 'This session has no offerings');
    assert.notOk(sessions[3].canExpand);
  });

  test('close offering details', async function (assert) {
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions, expandedSessions } = page.courseSessions.sessionsGrid;
    assert.strictEqual(sessions.length, 4);
    assert.strictEqual(expandedSessions.length, 0);
    await sessions[0].expand();
    assert.strictEqual(expandedSessions.length, 1);
    await sessions[0].collapse();
    assert.strictEqual(expandedSessions.length, 0);
  });

  test('session last update timestamp visible in expanded mode', async function (assert) {
    assert.expect(1);
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions, expandedSessions } = page.courseSessions.sessionsGrid;
    await sessions[0].expand();
    assert.strictEqual(
      expandedSessions[0].lastUpdated,
      'Last Update Last Update: 07/09/2019 5:00 PM'
    );
  });

  test('expand all sessions', async function (assert) {
    this.server.create('offering', { session: this.session2 });
    this.server.create('offering', { session: this.session3 });
    this.server.create('offering', { session: this.session4 });
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions, expandedSessions } = page.courseSessions.sessionsGrid;
    assert.strictEqual(sessions.length, 4);
    assert.strictEqual(expandedSessions.length, 0);
    assert.notOk(page.courseSessions.sessionsGridHeader.expandCollapse.allAreExpanded);
    await page.courseSessions.sessionsGridHeader.expandCollapse.toggle.click();
    assert.strictEqual(expandedSessions.length, 4);
    assert.ok(page.courseSessions.sessionsGridHeader.expandCollapse.allAreExpanded);
    await page.courseSessions.sessionsGridHeader.expandCollapse.toggle.click();
    assert.strictEqual(expandedSessions.length, 0);
    assert.notOk(page.courseSessions.sessionsGridHeader.expandCollapse.allAreExpanded);
  });

  test('expand all sessions does not expand sessions with no offerings', async function (assert) {
    this.server.create('offering', { session: this.session2 });
    this.server.create('offering', { session: this.session4 });
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions, expandedSessions } = page.courseSessions.sessionsGrid;
    assert.strictEqual(sessions.length, 4);
    assert.strictEqual(expandedSessions.length, 0);
    assert.notOk(page.courseSessions.sessionsGridHeader.expandCollapse.allAreExpanded);
    await page.courseSessions.sessionsGridHeader.expandCollapse.toggle.click();
    assert.strictEqual(expandedSessions.length, 3);
    assert.ok(page.courseSessions.sessionsGridHeader.expandCollapse.allAreExpanded);
  });

  test('expand all sessions with one session expanded already', async function (assert) {
    this.server.create('offering', { session: this.session2 });
    this.server.create('offering', { session: this.session3 });
    this.server.create('offering', { session: this.session4 });
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions, expandedSessions } = page.courseSessions.sessionsGrid;
    assert.strictEqual(sessions.length, 4);
    assert.strictEqual(expandedSessions.length, 0);
    await sessions[0].expand();
    assert.strictEqual(expandedSessions.length, 1);
    await page.courseSessions.sessionsGridHeader.expandCollapse.toggle.click();
    assert.strictEqual(expandedSessions.length, 4);
    await page.courseSessions.sessionsGridHeader.expandCollapse.toggle.click();
    assert.strictEqual(expandedSessions.length, 0);
  });

  test('expand sessions one at a time and collapse all', async function (assert) {
    this.server.create('offering', { session: this.session2 });
    this.server.create('offering', { session: this.session3 });
    this.server.create('offering', { session: this.session4 });
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions, expandedSessions } = page.courseSessions.sessionsGrid;
    assert.strictEqual(sessions.length, 4);
    assert.strictEqual(expandedSessions.length, 0);
    await sessions[0].expand();
    await sessions[1].expand();
    await sessions[2].expand();
    await sessions[3].expand();
    assert.strictEqual(expandedSessions.length, 4);
    assert.ok(page.courseSessions.sessionsGridHeader.expandCollapse.allAreExpanded);
    await page.courseSessions.sessionsGridHeader.expandCollapse.toggle.click();
    assert.strictEqual(expandedSessions.length, 0);
  });

  test('new session', async function (assert) {
    this.server.create('sessionType', { school: this.school });
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions } = page.courseSessions.sessionsGrid;
    assert.strictEqual(sessions.length, 4);
    await page.courseSessions.header.expandNewSessionForm();
    await page.courseSessions.newSession.title.set('xx new session');
    await page.courseSessions.newSession.selectSessionType('2');
    await page.courseSessions.newSession.save();

    assert.strictEqual(sessions.length, 5);
    assert.strictEqual(sessions[4].title, 'xx new session');
    assert.strictEqual(sessions[4].type, 'session type 1');
    assert.strictEqual(sessions[4].groupCount, '0');
    assert.strictEqual(sessions[4].objectiveCount, '0');
    assert.strictEqual(sessions[4].termCount, '0');
    assert.strictEqual(sessions[4].firstOffering, '');
    assert.strictEqual(sessions[4].offeringCount, '0');
  });

  test('cancel session', async function (assert) {
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions } = page.courseSessions.sessionsGrid;
    assert.strictEqual(sessions.length, 4);
    await page.courseSessions.header.expandNewSessionForm();
    assert.ok(page.courseSessions.newSession.isVisible);
    await page.courseSessions.newSession.title.set('new');
    await page.courseSessions.newSession.cancel();
    assert.strictEqual(sessions.length, 4);
    assert.notOk(page.courseSessions.newSession.isVisible);
  });

  test('new session goes away when we navigate #643', async function (assert) {
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions } = page.courseSessions.sessionsGrid;
    await page.courseSessions.header.expandNewSessionForm();
    assert.ok(page.courseSessions.newSession.isVisible);
    const newTitle = 'new session';
    await page.courseSessions.newSession.title.set(newTitle);
    await page.courseSessions.newSession.save();
    assert.strictEqual(sessions.length, 5);

    assert.ok(page.courseSessions.newSavedSession.isPresent);
    assert.strictEqual(page.courseSessions.newSavedSession.text, newTitle);
    await page.courseSessions.newSavedSession.click();
    assert.strictEqual(currentRouteName(), 'session.index');
    await sessionPage.backToSessions.click();
    assert.strictEqual(currentRouteName(), 'course.index');
    assert.notOk(page.courseSessions.newSavedSession.isPresent);
  });

  test('first offering is updated when offering is updated #1276', async function (assert) {
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions } = page.courseSessions.sessionsGrid;
    const { offerings } = sessions[0].offerings;

    assert.strictEqual(sessions.length, 4);
    assert.strictEqual(
      sessions[0].firstOffering,
      today.toJSDate().toLocaleString('en', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    );
    await sessions[0].expand();
    await offerings[0].edit();
    const { offeringForm: form } = offerings[0];
    const newDate = DateTime.fromJSDate(new Date(2011, 8, 11)).set({ hours: 2, minutes: 15 });
    await form.startDate.datePicker.set(newDate.toJSDate());
    await form.startTime.timePicker.hour.select(newDate.toFormat('h'));
    await form.startTime.timePicker.minute.select(newDate.toFormat('m'));
    await form.startTime.timePicker.ampm.select(newDate.toFormat('a').toLowerCase());
    await form.save();

    assert.strictEqual(
      sessions[0].firstOffering,
      newDate.toJSDate().toLocaleString('en', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    );
  });

  test('title filter escapes regex', async function (assert) {
    assert.expect(4);
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions } = page.courseSessions.sessionsGrid;
    assert.strictEqual(sessions.length, 4);
    assert.strictEqual(sessions[0].title, 'session 0');
    await page.courseSessions.filter('\\');
    assert.strictEqual(sessions.length, 1);
    assert.strictEqual(sessions[0].title, 'session3\\');
  });

  test('delete session', async function (assert) {
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions } = page.courseSessions.sessionsGrid;
    assert.strictEqual(sessions.length, 4);
    assert.strictEqual(sessions[0].title, 'session 0');
    assert.strictEqual(sessions[1].title, 'session 1');
    await sessions[0].trash();
    await sessions[0].confirm();
    assert.strictEqual(sessions.length, 3);
    assert.strictEqual(sessions[0].title, 'session 1');
  });

  test('back and forth #3771', async function (assert) {
    assert.expect(28);
    const sessionCount = 50;
    this.server.createList('session', sessionCount, {
      course: this.course,
      sessionType: this.sessionType,
    });
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions } = page.courseSessions.sessionsGrid;
    assert.strictEqual(sessions.length, sessionCount + 4);

    for (let i = 1; i < 10; i++) {
      await sessions[i].visit();
      assert.strictEqual(currentRouteName(), 'session.index');
      //await pauseTest();
      await sessionPage.backToSessions.click();
      assert.strictEqual(currentRouteName(), 'course.index');
      assert.strictEqual(sessions.length, sessionCount + 4);
    }
  });

  test('edit offering URL', async function (assert) {
    await page.visit({ courseId: this.course.id, details: true });
    const { sessions } = page.courseSessions.sessionsGrid;
    const { offerings } = sessions[0].offerings;

    assert.strictEqual(sessions.length, 4);
    assert.strictEqual(
      sessions[0].firstOffering,
      today.toJSDate().toLocaleString('en', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    );
    await sessions[0].expand();
    await offerings[0].edit();
    const { offeringForm: form } = offerings[0];
    await form.url.set('https://zoom.example.edu');
    await form.save();
    assert.strictEqual(this.server.schema.offerings.find(1).url, 'https://zoom.example.edu');
  });
});
