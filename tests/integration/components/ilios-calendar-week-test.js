import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { setupIntl } from 'ember-intl/test-support';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { component as weeklyCalendarComponent } from 'ilios-common/page-objects/components/weekly-calendar';
import { DateTime } from 'luxon';

module('Integration | Component | ilios calendar week', function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks, 'en-us');

  test('it renders', async function (assert) {
    assert.expect(2);
    const date = new Date('2015-09-30T12:00:00');
    this.set('date', date);

    await render(hbs`<IliosCalendarWeek @date={{this.date}} @calendarEvents={{(array)}} />`);
    assert.dom().containsText('Week of September 27, 2015');
    assert.strictEqual(weeklyCalendarComponent.events.length, 0);
  });

  test('clicking on a day header fires the correct events', async function (assert) {
    assert.expect(3);
    const date = new Date('2015-09-30T12:00:00');
    this.set('date', date);
    this.set('changeDate', (newDate) => {
      assert.ok(newDate instanceof Date);
      assert.strictEqual(newDate.toString().search(/Sun Sep 27/), 0);
    });
    this.set('changeView', (newView) => {
      assert.strictEqual(newView, 'day');
    });

    await render(hbs`<IliosCalendarWeek
      @date={{this.date}}
      @calendarEvents={{(array)}}
      @areDaysSelectable={{true}}
      @changeDate={{this.changeDate}}
      @changeView={{this.changeView}}
    />`);
    weeklyCalendarComponent.dayHeadings[0].selectDay();
  });

  test('clicking on a day header does nothing when areDaysSelectable is false', async function (assert) {
    assert.expect(0);
    const date = new Date('2015-09-30T12:00:00');
    this.set('date', date);

    await render(hbs`<IliosCalendarWeek
      @date={{this.date}}
      @calendarEvents={{(array)}}
      @areDaysSelectable={{false}}
      @changeDate={{(noop)}}
      @changeView={{(noop)}}
    />`);
    await weeklyCalendarComponent.dayHeadings[0].selectDay();
  });

  test('prework', async function (assert) {
    assert.expect(3);

    const date = DateTime.fromISO('2015-09-30T12:00:00');

    const event = createUserEventObject();
    event.startDate = date.toISO();
    event.endDate = date.plus({ hours: 1 }).toISO();
    event.prerequisites = [
      {
        name: 'prework 1',
        startDate: DateTime.local().toISO(),
        endDate: DateTime.local().toISO(),
        ilmSession: true,
        slug: 'whatever',
        postrequisiteSlug: 'something',
        postrequisiteName: 'third',
        isPublished: true,
        isScheduled: false,
        isBlanked: false,
      },
      {
        name: 'prework 2',
        startDate: DateTime.local().toISO(),
        endDate: DateTime.local().toISO(),
        location: 'room 111',
        ilmSession: true,
        slug: 'whatever',
        postrequisiteSlug: 'something',
        postrequisiteName: 'first',
        isPublished: true,
        isScheduled: false,
        isBlanked: false,
      },
      {
        name: 'blanked prework',
        startDate: DateTime.local().toISO(),
        endDate: DateTime.local().toISO(),
        location: 'room 111',
        ilmSession: true,
        slug: 'whatever',
        postrequisiteSlug: 'something',
        postrequisiteName: 'first',
        isPublished: true,
        isScheduled: false,
        isBlanked: true,
      },
      {
        name: 'scheduled prework',
        startDate: DateTime.local().toISO(),
        endDate: DateTime.local().toISO(),
        location: 'room 111',
        ilmSession: true,
        slug: 'whatever',
        postrequisiteSlug: 'something',
        postrequisiteName: 'first',
        isPublished: true,
        isScheduled: true,
        isBlanked: false,
      },
      {
        name: 'unpublished prework',
        startDate: DateTime.local().toISO(),
        endDate: DateTime.local().toISO(),
        location: 'room 111',
        ilmSession: true,
        slug: 'whatever',
        postrequisiteSlug: 'something',
        postrequisiteName: 'first',
        isPublished: true,
        isScheduled: true,
        isBlanked: false,
      },
    ];
    this.set('date', date.toJSDate());
    this.set('events', [event]);
    await render(hbs`<IliosCalendarWeek
      @date={{this.date}}
      @calendarEvents={{this.events}}
      @areDaysSelectable={{false}}
      @changeDate={{(noop)}}
      @changeView={{(noop)}}
    />`);
    const preworkSelector = '[data-test-ilios-calendar-pre-work-event]';
    const preworkElements = this.element.querySelectorAll(preworkSelector);
    assert.strictEqual(preworkElements.length, 2);
    assert.ok(preworkElements[0].textContent.includes('prework 1'));
    assert.ok(preworkElements[1].textContent.includes('prework 2'));
  });

  test('prework to unpublished/scheduled/blanked events is not visible', async function (assert) {
    assert.expect(1);

    const date = DateTime.fromISO('2015-09-30T12:00:00');
    const publishedPrework = {
      name: 'published prework',
      startDate: DateTime.local().toISO(),
      endDate: DateTime.local().toISO(),
      ilmSession: true,
      slug: 'whatever',
      postrequisiteSlug: 'something',
      postrequisiteName: 'third',
      isPublished: true,
      isScheduled: false,
      isBlanked: false,
    };
    const unpublishedEvent = createUserEventObject();
    unpublishedEvent.isPublished = false;
    unpublishedEvent.isScheduled = false;
    unpublishedEvent.isBlanked = false;

    const scheduledEvent = createUserEventObject();
    scheduledEvent.isPublished = true;
    scheduledEvent.isScheduled = true;
    scheduledEvent.isBlanked = false;

    const blankedEvent = createUserEventObject();
    blankedEvent.isPublished = true;
    blankedEvent.isScheduled = false;
    blankedEvent.isBlanked = true;

    const events = [unpublishedEvent, scheduledEvent, blankedEvent];

    events.forEach((event) => {
      event.startDate = date.toISO();
      event.endDate = date.plus({ hours: 1 }).toISO();
      event.prerequisites = [publishedPrework];
    });

    this.set('date', date.toJSDate());
    this.set('events', events);
    await render(hbs`<IliosCalendarWeek
      @date={{this.date}}
      @calendarEvents={{this.events}}
      @areDaysSelectable={{false}}
      @changeDate={{(noop)}}
      @changeView={{(noop)}}
    />`);
    const preworkSelector = '[data-test-ilios-calendar-pre-work-event]';
    const preworkElements = this.element.querySelectorAll(preworkSelector);
    assert.strictEqual(preworkElements.length, 0);
  });

  const createUserEventObject = function () {
    return {
      user: 1,
      name: '',
      offering: 1,
      startDate: null,
      endDate: null,
      calendarColor: '#32edfc',
      location: 'Rm. 160',
      lastModified: new Date(),
      isPublished: true,
      isScheduled: false,
      isBlanked: false,
      prerequisites: [],
      postrequisites: [],
    };
  };
});
