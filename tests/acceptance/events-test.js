import { module, test } from 'qunit';
import { setupApplicationTest } from 'dummy/tests/helpers';
import page from 'ilios-common/page-objects/events';
import { setupAuthentication } from 'ilios-common';
import Service from '@ember/service';
import { DateTime } from 'luxon';

module('Acceptance | single event', function (hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(async function () {
    this.school = this.server.create('school');
    this.user = await setupAuthentication({ school: this.school });
  });

  test('user event', async function (assert) {
    this.server.create('userevent', {
      courseTitle: 'Lorem',
      name: 'Ipsum',
      lastModified: DateTime.now().minus({ days: 21 }).toJSDate(),
    });
    const events = this.server.db.userevents;
    class UserEventsServiceMock extends Service {
      async getEventForSlug() {
        return events.slice()[0];
      }
    }
    this.owner.register('service:user-events', UserEventsServiceMock);
    await page.visit({ slug: 'Uwhatever' });
    assert.notOk(page.backLink.isVisible);
    // @todo implement this further [ST 2023/07/24]
    assert.strictEqual(page.event.summary.title.text, 'Lorem - Ipsum');
  });
});
