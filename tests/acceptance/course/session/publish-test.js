import { currentRouteName } from '@ember/test-helpers';
import { DateTime } from 'luxon';
import { module, test } from 'qunit';
import { setupAuthentication } from 'ilios-common';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import page from 'ilios-common/page-objects/session';

module('Acceptance | Session - Publish', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    const school = this.server.create('school');
    await setupAuthentication({ school, administeredSchools: [school] });
    this.course = this.server.create('course', { school });
    this.server.create('sessionType');
    this.publishedSession = this.server.create('session', {
      published: true,
      course: this.course,
    });
    this.scheduledSession = this.server.create('session', {
      course: this.course,
      published: true,
      publishedAsTbd: true,
    });
    this.draftSession = this.server.create('session', {
      course: this.course,
    });
    this.ilmSession = this.server.create('session', {
      course: this.course,
    });
    this.server.create('ilmSession', {
      session: this.ilmSession,
      dueDate: DateTime.local().toJSDate(),
    });
    this.server.create('offering', {
      session: this.publishedSession,
      startDate: DateTime.local().toJSDate(),
      endDate: DateTime.local().plus({ hours: 6 }).toJSDate(),
    });
    this.server.create('offering', {
      session: this.scheduledSession,
      startDate: DateTime.local().toJSDate(),
      endDate: DateTime.local().plus({ hours: 6 }).toJSDate(),
    });
    this.server.create('offering', {
      session: this.draftSession,
      startDate: DateTime.local().toJSDate(),
      endDate: DateTime.local().plus({ hours: 6 }).toJSDate(),
    });
  });

  test('check published session', async function (assert) {
    await page.visit({ courseId: this.course.id, sessionId: this.publishedSession.id });
    assert.strictEqual(currentRouteName(), 'session.index');
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Published');
    await page.details.overview.publicationMenu.toggle.click();
    assert.strictEqual(page.details.overview.publicationMenu.buttons.length, 3);
    assert.strictEqual(
      page.details.overview.publicationMenu.buttons[0].text,
      'Review 3 Missing Items'
    );
    assert.strictEqual(page.details.overview.publicationMenu.buttons[1].text, 'Mark as Scheduled');
    assert.strictEqual(page.details.overview.publicationMenu.buttons[2].text, 'UnPublish Session');
  });

  test('check scheduled session', async function (assert) {
    await page.visit({ courseId: this.course.id, sessionId: this.scheduledSession.id });
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Scheduled');
    await page.details.overview.publicationMenu.toggle.click();
    assert.strictEqual(page.details.overview.publicationMenu.buttons.length, 3);
    assert.strictEqual(page.details.overview.publicationMenu.buttons[0].text, 'Publish As-is');
    assert.strictEqual(
      page.details.overview.publicationMenu.buttons[1].text,
      'Review 3 Missing Items'
    );
    assert.strictEqual(page.details.overview.publicationMenu.buttons[2].text, 'UnPublish Session');
  });

  test('check draft session', async function (assert) {
    await page.visit({ courseId: this.course.id, sessionId: this.draftSession.id });
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Not Published');
    await page.details.overview.publicationMenu.toggle.click();
    assert.strictEqual(page.details.overview.publicationMenu.buttons.length, 3);
    assert.strictEqual(page.details.overview.publicationMenu.buttons[0].text, 'Publish As-is');
    assert.strictEqual(
      page.details.overview.publicationMenu.buttons[1].text,
      'Review 3 Missing Items'
    );
    assert.strictEqual(page.details.overview.publicationMenu.buttons[2].text, 'Mark as Scheduled');
  });

  test('check publish draft session', async function (assert) {
    await page.visit({ courseId: this.course.id, sessionId: this.draftSession.id });
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Not Published');
    await page.details.overview.publicationMenu.toggle.click();
    await page.details.overview.publicationMenu.publishAsIs();
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Published');
  });

  test('check schedule draft session', async function (assert) {
    await page.visit({ courseId: this.course.id, sessionId: this.draftSession.id });
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Not Published');
    await page.details.overview.publicationMenu.toggle.click();
    await page.details.overview.publicationMenu.markAsScheduled();
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Scheduled');
  });

  test('check publish scheduled session', async function (assert) {
    await page.visit({ courseId: this.course.id, sessionId: this.scheduledSession.id });
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Scheduled');
    await page.details.overview.publicationMenu.toggle.click();
    await page.details.overview.publicationMenu.publishAsIs();
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Published');
  });

  test('check unpublish scheduled session', async function (assert) {
    await page.visit({ courseId: this.course.id, sessionId: this.scheduledSession.id });
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Scheduled');
    await page.details.overview.publicationMenu.toggle.click();
    await page.details.overview.publicationMenu.unpublishSession();
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Not Published');
  });

  test('check schedule published session', async function (assert) {
    await page.visit({ courseId: this.course.id, sessionId: this.publishedSession.id });
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Published');
    await page.details.overview.publicationMenu.toggle.click();
    await page.details.overview.publicationMenu.markAsScheduled();
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Scheduled');
  });

  test('check unpublish published session', async function (assert) {
    await page.visit({ courseId: this.course.id, sessionId: this.publishedSession.id });
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Published');
    await page.details.overview.publicationMenu.toggle.click();
    await page.details.overview.publicationMenu.unpublishSession();
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Not Published');
  });

  test('check publish requirements for ilm session', async function (assert) {
    await page.visit({ courseId: this.course.id, sessionId: this.ilmSession.id });
    assert.strictEqual(page.details.overview.publicationMenu.toggle.text, 'Not Published');
    await page.details.overview.publicationMenu.toggle.click();
    assert.strictEqual(page.details.overview.publicationMenu.buttons.length, 3);
    assert.strictEqual(page.details.overview.publicationMenu.buttons[0].text, 'Publish As-is');
    assert.strictEqual(
      page.details.overview.publicationMenu.buttons[1].text,
      'Review 3 Missing Items'
    );
    assert.strictEqual(page.details.overview.publicationMenu.buttons[2].text, 'Mark as Scheduled');
  });
});
