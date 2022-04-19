import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setupIntl } from 'ember-intl/test-support';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { DateTime } from 'luxon';
import { component } from 'ilios-common/page-objects/components/ilios-calendar-pre-work-events';
const today = DateTime.now();

module('Integration | Component | ilios-calendar-pre-work-events', function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks, 'en-us');

  hooks.beforeEach(function () {
    this.events = [
      {
        name: 'Learn to Learn',
        slug: 'abc',
        startDate: today.toISO(),
        location: 'Room 123',
        sessionTypeTitle: 'Lecture',
        courseExternalId: 'C1',
        sessionDescription:
          'Best <strong>Session</strong>For Sure' +
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
        isBlanked: false,
        isPublished: true,
        isScheduled: false,
        learningMaterials: [
          {
            title: 'Citation LM',
            type: 'citation',
            required: true,
            publicNotes: 'This is cool.',
            citation: 'citationtext',
          },
          {
            title: 'Link LM',
            type: 'link',
            required: false,
            link: 'http://myhost.com/url2',
          },
          {
            title: 'File LM',
            type: 'file',
            filename: 'This is a PDF',
            mimetype: 'application/pdf',
            required: true,
            absoluteFileUri: 'http://myhost.com/url1',
          },
        ],
        attireRequired: true,
        equipmentRequired: true,
        attendanceRequired: true,
        supplemental: true,
        postrequisiteName: 'reading to read',
        postrequisiteSlug: '123',
      },
    ];
  });

  test('it renders', async function (assert) {
    await render(hbs`<IliosCalendarPreWorkEvents @events={{this.events}}/>`);
    assert.strictEqual(component.title, 'Pre-work');
    assert.strictEqual(component.events.length, 1);
    assert.strictEqual(
      component.events[0].text,
      `Learn to Learn Due Before reading to read (${today.toFormat('D')})`
    );
  });
});
