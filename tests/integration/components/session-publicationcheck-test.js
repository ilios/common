import { module, test } from 'qunit';
import { setupRenderingTest } from 'dummy/tests/helpers';
import { setupIntl } from 'ember-intl/test-support';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { setupAuthentication } from 'ilios-common';
import { component } from 'ilios-common/page-objects/components/session-publicationcheck';

module('Integration | Component | session-publicationcheck', function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks, 'en-us');
  setupMirage(hooks);

  test('it shows unlink icon', async function (assert) {
    const courseObjective = this.server.create('courseObjective');
    const school = this.server.create('school');
    const course = this.server.create('course', { school });
    const session = this.server.create('session', { course });
    this.server.create('session-objective', {
      session,
      courseObjectives: [courseObjective],
    });
    this.server.create('session-objective', { session });

    await setupAuthentication({ school, administeredSchools: [school] });
    const sessionModel = await this.owner.lookup('service:store').findRecord('session', session.id);
    this.set('model', sessionModel);
    await render(hbs`<SessionPublicationcheck @session={{this.model}} />`);
    assert.ok(component.unlink.isPresent);
  });

  test('it does not shows unlink icon', async function (assert) {
    const courseObjective = this.server.create('courseObjective');
    const school = this.server.create('school');
    const course = this.server.create('course', { school });
    const session = this.server.create('session', { course });
    this.server.create('session-objective', {
      session,
      courseObjectives: [courseObjective],
    });
    this.server.create('session-objective', {
      session,
      courseObjectives: [courseObjective],
    });
    await setupAuthentication({ school, administeredSchools: [school] });
    const sessionModel = await this.owner.lookup('service:store').findRecord('session', session.id);
    this.set('model', sessionModel);
    await render(hbs`<SessionPublicationcheck @session={{this.model}} />`);
    assert.notOk(component.unlink.isPresent);
  });

  test('ilm without learner groups', async function (assert) {
    const school = this.server.create('school');
    const course = this.server.create('course', { school });
    const session = this.server.create('session', { course });
    this.server.create('ilmSession', { session });
    await setupAuthentication({ school, administeredSchools: [school] });
    const sessionModel = await this.owner.lookup('service:store').findRecord('session', session.id);
    this.set('model', sessionModel);
    await render(hbs`<SessionPublicationcheck @session={{this.model}} />`);
    assert.strictEqual(component.learnerGroups, 'No');
  });

  test('ilm with learner groups', async function (assert) {
    const school = this.server.create('school');
    const course = this.server.create('course', { school });
    const session = this.server.create('session', { course });
    const learnerGroups = this.server.createList('learnerGroup', 2);
    this.server.create('ilmSession', { session, learnerGroups });
    await setupAuthentication({ school, administeredSchools: [school] });
    const sessionModel = await this.owner.lookup('service:store').findRecord('session', session.id);
    this.set('model', sessionModel);
    await render(hbs`<SessionPublicationcheck @session={{this.model}} />`);
    assert.strictEqual(component.learnerGroups, 'Yes (2)');
  });

  test('offerings without learner groups', async function (assert) {
    const school = this.server.create('school');
    const course = this.server.create('course', { school });
    const session = this.server.create('session', { course });
    this.server.createList('offering', 3, { session });
    await setupAuthentication({ school, administeredSchools: [school] });
    const sessionModel = await this.owner.lookup('service:store').findRecord('session', session.id);
    this.set('model', sessionModel);
    await render(hbs`<SessionPublicationcheck @session={{this.model}} />`);
    assert.strictEqual(component.learnerGroups, 'No');
  });

  test('offerings with learner groups', async function (assert) {
    const school = this.server.create('school');
    const course = this.server.create('course', { school });
    const session = this.server.create('session', { course });
    const learnerGroups = this.server.createList('learnerGroup', 3);
    this.server.create('offering', { session, learnerGroups: [learnerGroups[0]] });
    this.server.create('offering', {
      session,
      learnerGroups: [learnerGroups[1], learnerGroups[2]],
    });
    await setupAuthentication({ school, administeredSchools: [school] });
    const sessionModel = await this.owner.lookup('service:store').findRecord('session', session.id);
    this.set('model', sessionModel);
    await render(hbs`<SessionPublicationcheck @session={{this.model}} />`);
    assert.strictEqual(component.learnerGroups, 'Yes (3)');
  });
});
