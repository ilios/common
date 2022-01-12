import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setupIntl } from 'ember-intl/test-support';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { DateTime } from 'luxon';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Integration | Component | offering-calendar', function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks, 'en-us');
  setupMirage(hooks);

  test('shows events', async function (assert) {
    assert.expect(1);
    const today = DateTime.local().set({ hour: 8 });
    const tomorrow = today.plus({ day: 1 }).set({ hour: 8 });
    const course = this.server.create('course');
    const sessionType = this.server.create('session-type');
    const session = this.server.create('session', {
      course,
      sessionType,
    });

    const offering1 = this.server.create('offering', {
      startDate: today.toISO(),
      endDate: today.plus({ hour: 1 }).toISO(),
      location: 123,
      session,
    });
    const offering2 = this.server.create('offering', {
      startDate: today.toISO(),
      endDate: today.plus({ hour: 1 }).toISO(),
      location: 123,
      session,
    });
    const learnerGroup = this.server.create('learner-group', {
      offerings: [offering1, offering2],
    });
    const sessionModel = await this.owner.lookup('service:store').find('session', session.id);
    const learnerGroupModel = await this.owner
      .lookup('service:store')
      .find('learner-group', learnerGroup.id);
    this.set('startDate', today.toISO());
    this.set('endDate', tomorrow.toISO());
    this.set('session', sessionModel);
    this.set('learnerGroups', [learnerGroupModel]);
    await render(hbs`<OfferingCalendar
      @learnerGroups={{this.learnerGroups}}
      @session={{this.session}}
      @startDate={{this.startDate}}
      @endDate={{this.endDate}}
    />`);
    const events = '[data-test-calendar-event]';
    assert.dom(events).exists({ count: 4 });
  });
});
