import {
  click,
  findAll,
  find,
  currentURL,
  currentRouteName,
  visit,
  triggerEvent,
} from '@ember/test-helpers';
import { isEmpty } from '@ember/utils';
import { DateTime } from 'luxon';
import { module, test } from 'qunit';
import { setupAuthentication } from 'ilios-common';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { map } from 'rsvp';
import page from 'ilios-common/page-objects/dashboard';

module('Acceptance | Dashboard Calendar', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  hooks.beforeEach(async function () {
    this.school = this.server.create('school');
    this.user = await setupAuthentication({ school: this.school });
    const program = this.server.create('program', {
      school: this.school,
    });
    const programYear1 = this.server.create('programYear', {
      program,
      startYear: 2015,
    });
    const programYear2 = this.server.create('programYear', {
      program,
      startYear: 2016,
    });
    const cohort1 = this.server.create('cohort', {
      programYear: programYear1,
    });
    const cohort2 = this.server.create('cohort', {
      programYear: programYear2,
    });
    const sessionType1 = this.server.create('session-type', {
      school: this.school,
    });
    const sessionType2 = this.server.create('session-type', {
      school: this.school,
    });
    this.server.create('session-type', {
      school: this.school,
    });
    const course1 = this.server.create('course', {
      school: this.school,
      year: 2015,
      level: 1,
      cohorts: [cohort1],
    });
    const course2 = this.server.create('course', {
      year: 2015,
      school: this.school,
      level: 2,
      cohorts: [cohort2],
    });
    const session1 = this.server.create('session', {
      course: course1,
      sessionType: sessionType1,
    });
    const session2 = this.server.create('session', {
      course: course1,
      sessionType: sessionType2,
    });
    const session3 = this.server.create('session', {
      course: course2,
      sessionType: sessionType2,
    });
    this.server.create('academicYear', {
      id: 2015,
    });
    this.server.create('offering', {
      session: session1,
    });
    this.server.create('offering', {
      session: session2,
    });
    this.server.create('offering', {
      session: session3,
    });
  });

  test('load month calendar', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    const startOfMonth = today.startOf('month');
    const endOfMonth = today.endOf('month').set({ hours: 22, minutes: 59 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'start of month',
      startDate: startOfMonth.toISO(),
      endDate: startOfMonth.plus({ hours: 1 }).toISO(),
      lastModified: today.minus({ years: 1 }).toISO(),
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'end of month',
      startDate: endOfMonth.toISO(),
      endDate: endOfMonth.plus({ hours: 1 }).toISO(),
      lastModified: today.minus({ years: 1 }).toISO(),
    });
    await visit('/dashboard?show=calendar&view=month');
    assert.strictEqual(currentRouteName(), 'dashboard');
    const events = findAll('[data-test-ilios-calendar-event]');
    assert.strictEqual(events.length, 2);
    const startOfMonthStartFormat = startOfMonth
      .toJSDate()
      .toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
    const startOfMonthEndFormat = startOfMonth
      .plus({ hours: 1 })
      .toJSDate()
      .toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
    assert
      .dom(events[0])
      .hasText(`${startOfMonthStartFormat} - ${startOfMonthEndFormat} : start of month`);
    const endOfMonthStartFormat = endOfMonth
      .toJSDate()
      .toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
    const endOfMonthEndFormat = endOfMonth
      .plus({ hours: 1 })
      .toJSDate()
      .toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
    assert
      .dom(events[1])
      .hasText(`${endOfMonthStartFormat} - ${endOfMonthEndFormat} : end of month`);
  });

  test('load week calendar', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    const startOfWeek = today.startOf('week');
    const endOfWeek = today.endOf('week').set({ hours: 13, minutes: 59 });
    const longDayHeading = startOfWeek.toJSDate().toLocaleString([], {
      month: 'short',
      day: 'numeric',
    });
    const shortDayHeading = startOfWeek.toJSDate().toLocaleString([], {
      day: 'numeric',
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'start of week',
      startDate: startOfWeek.toISO(),
      endDate: startOfWeek.plus({ hours: 1 }).toISO(),
      lastModified: today.minus({ years: 1 }).toISO(),
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'end of week',
      startDate: endOfWeek.toISO(),
      endDate: endOfWeek.plus({ hours: 1 }).toISO(),
      lastModified: today.minus({ years: 1 }).toISO(),
    });
    await page.visit({ show: 'calendar' });
    assert.strictEqual(currentRouteName(), 'dashboard');
    assert.strictEqual(page.weeklyCalendar.dayHeadings.length, 7);
    assert.ok(page.weeklyCalendar.dayHeadings[0].isFirstDayOfWeek);
    assert.strictEqual(
      page.weeklyCalendar.dayHeadings[0].text,
      `Monday Mon ${longDayHeading} ${shortDayHeading}`
    );
    assert.strictEqual(page.weeklyCalendar.events.length, 2);
    assert.ok(page.weeklyCalendar.events[0].isFirstDayOfWeek);
    assert.strictEqual(page.weeklyCalendar.events[0].name, 'start of week');
    assert.ok(page.weeklyCalendar.events[1].isSeventhDayOfWeek);
    assert.strictEqual(page.weeklyCalendar.events[1].name, 'end of week');
  });

  test('load day calendar', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    const tomorrow = today.plus({ days: 1 });
    const yesterday = today.minus({ days: 1 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'today',
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      lastModified: today.minus({ years: 1 }).toISO(),
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'tomorow',
      startDate: tomorrow.toISO(),
      endDate: tomorrow.plus({ hours: 1 }).toISO(),
      lastModified: today.minus({ years: 1 }).toISO(),
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'yesterday',
      startDate: yesterday.toISO(),
      endDate: yesterday.plus({ hours: 1 }).toISO(),
      lastModified: today.minus({ years: 1 }).toISO(),
    });
    await visit('/dashboard?show=calendar&view=day');
    assert.strictEqual(currentRouteName(), 'dashboard');

    assert.strictEqual(page.dailyCalendar.events.length, 1);
    assert.strictEqual(page.dailyCalendar.events[0].name, 'today');
  });

  test('click month day number and go to day', async function (assert) {
    const aDayInTheMonth = DateTime.local().startOf('month').plus({ days: 12 }).set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'start of month',
      startDate: aDayInTheMonth.toISO(),
      endDate: aDayInTheMonth.plus({ hours: 1 }).toISO(),
    });
    await visit('/dashboard?show=calendar&view=month');
    const dayOfMonth = aDayInTheMonth.day;
    await click(`[data-test-day-button="${dayOfMonth}"]`);
    assert.strictEqual(
      currentURL(),
      '/dashboard?date=' + aDayInTheMonth.toFormat('yyyy-MM-dd') + '&show=calendar&view=day'
    );
  });

  test('click week day title and go to day', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'today',
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
    });
    await page.visit({ show: 'calendar', view: 'week' });
    const dayOfWeek = today.weekday - 1;
    assert.strictEqual(page.weeklyCalendar.dayHeadings.length, 7);
    await page.weeklyCalendar.dayHeadings[dayOfWeek].selectDay();
    assert.strictEqual(
      currentURL(),
      '/dashboard?date=' + today.toFormat('yyyy-MM-dd') + '&show=calendar&view=day'
    );
  });

  test('click forward on a day goes to next day', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'today',
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
    });
    await visit('/dashboard?show=calendar&view=day');
    await click('.calendar-time-picker li:nth-of-type(3) a');
    assert.strictEqual(
      currentURL(),
      '/dashboard?date=' +
        today.plus({ days: 1 }).toFormat('yyyy-MM-dd') +
        '&show=calendar&view=day'
    );
  });

  test('click forward on a week goes to next week', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'today',
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
    });
    await visit('/dashboard?show=calendar&view=week');
    await click('.calendar-time-picker li:nth-of-type(3) a');
    assert.strictEqual(
      currentURL(),
      '/dashboard?date=' + today.plus({ weeks: 1 }).toFormat('yyyy-MM-dd') + '&show=calendar'
    );
  });

  test('click forward on a month goes to next month', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'today',
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
    });
    await visit('/dashboard?show=calendar&view=month');
    await click('.calendar-time-picker li:nth-of-type(3) a');
    await click(findAll('.calendar-time-picker li')[2]);
    assert.strictEqual(
      currentURL(),
      '/dashboard?date=' +
        today.plus({ months: 1 }).toFormat('yyyy-MM-dd') +
        '&show=calendar&view=month'
    );
  });

  test('click back on a day goes to previous day', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'today',
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
    });
    await visit('/dashboard?show=calendar&view=day');
    await click('.calendar-time-picker li:nth-of-type(1) a');
    assert.strictEqual(
      currentURL(),
      '/dashboard?date=' +
        today.minus({ days: 1 }).toFormat('yyyy-MM-dd') +
        '&show=calendar&view=day'
    );
  });

  test('click back on a week goes to previous week', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'today',
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
    });
    await visit('/dashboard?show=calendar&view=week');
    await click('.calendar-time-picker li:nth-of-type(1) a');
    assert.strictEqual(
      currentURL(),
      '/dashboard?date=' + today.minus({ weeks: 1 }).toFormat('yyyy-MM-dd') + '&show=calendar'
    );
  });

  test('click back on a month goes to previous month', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      name: 'today',
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
    });
    await visit('/dashboard?show=calendar&view=month');
    await click('.calendar-time-picker li:nth-of-type(1) a');
    assert.strictEqual(
      currentURL(),
      '/dashboard?date=' +
        today.minus({ months: 1 }).toFormat('yyyy-MM-dd') +
        '&show=calendar&view=month'
    );
  });

  test('show user events', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      offering: 1,
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      offering: 2,
    });
    await page.visit({ show: 'calendar' });
    assert.strictEqual(page.weeklyCalendar.events.length, 2);
  });

  const chooseSchoolEvents = async function () {
    return await click(find(findAll('.togglemyschedule label')[1]));
  };
  test('show school events', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('schoolevent', {
      school: 1,
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      offering: 1,
    });
    this.server.create('schoolevent', {
      school: 1,
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      offering: 2,
    });
    await page.visit({ show: 'calendar' });
    await chooseSchoolEvents();
    assert.strictEqual(page.weeklyCalendar.events.length, 2);
  });

  const showFilters = async function () {
    return await click('.showfilters label:nth-of-type(2)');
  };

  const pickSessionType = async function (i) {
    return await click(find(`.sessiontypefilter li:nth-of-type(${i}) [data-test-target]`));
  };

  test('test session type filter', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      sessionTypeId: 1,
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      sessionTypeId: 2,
    });
    await page.visit({ show: 'calendar', view: 'week' });
    await showFilters();
    assert.strictEqual(page.weeklyCalendar.events.length, 2);
    await pickSessionType(1);
    assert.strictEqual(page.weeklyCalendar.events.length, 1);
    await pickSessionType(2);
    assert.strictEqual(page.weeklyCalendar.events.length, 2);

    await pickSessionType(1);
    await pickSessionType(2);
    await pickSessionType(3);
    assert.strictEqual(page.weeklyCalendar.events.length, 0);
  });

  const pickCourseLevel = async function (i) {
    return await click(find(`.courselevelfilter li:nth-of-type(${i}) [data-test-target]`));
  };
  const clearCourseLevels = async function () {
    const selected = findAll('.courselevelfilter [data-test-checked]');
    await map(selected, (e) => click(e));
  };

  test('test course level filter', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      courseLevel: 1,
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      courseLevel: 1,
    });
    await page.visit({ show: 'calendar', view: 'week' });
    await showFilters();
    await chooseDetailFilter();
    assert.strictEqual(page.weeklyCalendar.events.length, 2);
    await pickCourseLevel(1);
    assert.strictEqual(page.weeklyCalendar.events.length, 2);
    await clearCourseLevels();
    await pickCourseLevel(3);
    assert.strictEqual(page.weeklyCalendar.events.length, 0);
  });

  const pickCohort = async function (i) {
    return await click(
      find(`[data-test-cohort-calendar-filter] li:nth-of-type(${i}) [data-test-target]`)
    );
  };

  test('test cohort filter', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      cohorts: [{ id: 1 }],
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      cohorts: [{ id: 1 }],
    });
    await page.visit({ show: 'calendar', view: 'week' });
    await showFilters();
    await chooseDetailFilter();
    assert.strictEqual(page.weeklyCalendar.events.length, 2);
    await pickCohort(2);
    assert.strictEqual(page.weeklyCalendar.events.length, 2);

    await pickCohort(1);
    await pickCohort(2);
    assert.strictEqual(page.weeklyCalendar.events.length, 0);
  });

  const chooseDetailFilter = async function () {
    return await click(find(findAll('.togglecoursefilters label')[1]));
  };

  const pickCourse = async function (i) {
    return await click(
      find(`[data-test-courses-calendar-filter] li:nth-of-type(${i}) [data-test-target]`)
    );
  };
  const clearCourses = async function () {
    const selected = findAll('[data-test-courses-calendar-filter] [data-test-checked]');
    await map(selected, (e) => click(e));
  };

  test('test course filter', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      course: 1,
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      course: 2,
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      course: 1,
    });
    await page.visit({ show: 'calendar', view: 'week' });
    await showFilters();
    assert.strictEqual(page.weeklyCalendar.events.length, 3);
    await pickCourse(1);
    assert.strictEqual(page.weeklyCalendar.events.length, 2);
    await clearCourses();
    await pickCourse(2);
    assert.strictEqual(page.weeklyCalendar.events.length, 1);
  });

  test('test course and session type filter together', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      course: 1,
      sessionTypeId: 1,
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      course: 2,
      sessionTypeId: 2,
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      course: 1,
      sessionTypeId: 2,
    });
    await page.visit({ show: 'calendar', view: 'week' });
    await showFilters();

    assert.strictEqual(page.weeklyCalendar.events.length, 3);
    await pickCourse(1);
    assert.strictEqual(page.weeklyCalendar.events.length, 2);
    await clearCourses();
    await pickCourse(1);
    await pickSessionType(1);
    assert.strictEqual(page.weeklyCalendar.events.length, 1);
  });

  test('agenda show next seven days of events', async function (assert) {
    const today = DateTime.local().set({ hours: 0, minutes: 2 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      offering: 1,
      lastModified: today.minus({ years: 1 }).toISO(),
    });
    const endOfTheWeek = DateTime.local().plus({ days: 6 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: endOfTheWeek.toISO(),
      endDate: endOfTheWeek.plus({ hours: 1 }).toISO(),
      offering: 2,
      lastModified: today.minus({ years: 1 }).toISO(),
    });
    const yesterday = DateTime.local().minus({ hours: 25 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: yesterday.toISO(),
      endDate: yesterday.plus({ hours: 1 }).toISO(),
      offering: 3,
      lastModified: today.minus({ years: 1 }).toISO(),
    });
    await visit('/dashboard?show=agenda');
    const events = findAll('tr');
    assert.strictEqual(events.length, 2);
    const options = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };
    assert.dom(events[0]).hasText(today.toJSDate().toLocaleString([], options) + ' event 0');
    assert.dom(events[1]).hasText(endOfTheWeek.toJSDate().toLocaleString([], options) + ' event 1');
  });

  test('clear all filters', async function (assert) {
    const vocabulary = this.server.create('vocabulary', {
      school: this.school,
    });
    this.server.createList('term', 2, {
      vocabulary,
    });

    const clearFilter = '.filters-clear-filters';
    const sessiontype = '.sessiontypefilter li:nth-of-type(1) input';
    const course = '[data-test-courses-calendar-filter] li:nth-of-type(1) input';
    const term = '.vocabularyfilter li:nth-of-type(1) input';

    await page.visit({ show: 'calendar', view: 'week' });
    await showFilters();
    assert.ok(isEmpty(find(clearFilter)), 'clear filter button is inactive');

    await click(sessiontype);
    await click(course);
    await click(term);

    assert.dom(clearFilter).hasText('Clear Filters', 'clear filter button is active');
    assert.dom(sessiontype).isChecked('filter is checked');
    assert.dom(course).isChecked('filter is checked');
    assert.dom(term).isChecked('filter is checked');

    await click(clearFilter);
    assert.ok(isEmpty(find(clearFilter)), 'clear filter button is inactive');
    assert.notOk(find(sessiontype).checked, 'filter is unchecked');
    assert.notOk(find(course).checked, 'filter is unchecked');
    assert.notOk(find(term).checked, 'filter is unchecked');
  });

  test('clear all detail filters', async function (assert) {
    const clearFilter = '.filters-clear-filters';
    const sessiontype = '.sessiontypefilter li:nth-of-type(1) input';
    const courselevel = '.courselevelfilter li:nth-of-type(1) input';
    const cohort = '[data-test-cohort-calendar-filter] li:nth-of-type(1) input';

    await page.visit({ show: 'calendar', view: 'week' });
    await showFilters();
    await chooseDetailFilter();
    assert.ok(isEmpty(find(clearFilter)), 'clear filter button is inactive');

    await click(sessiontype);
    await click(courselevel);
    await click(cohort);

    assert.dom(clearFilter).hasText('Clear Filters', 'clear filter button is active');
    assert.dom(sessiontype).isChecked('filter is checked');
    assert.dom(courselevel).isChecked('filter is checked');
    assert.dom(cohort).isChecked('filter is checked');

    await click(clearFilter);
    assert.ok(isEmpty(find(clearFilter)), 'clear filter button is inactive');
    assert.notOk(find(sessiontype).checked, 'filter is unchecked');
    assert.notOk(find(courselevel).checked, 'filter is unchecked');
    assert.notOk(find(cohort).checked, 'filter is unchecked');
  });

  test('filter tags work properly', async function (assert) {
    const sessiontype = '.sessiontypefilter li:nth-of-type(1) [data-test-target]';
    const courselevel = '.courselevelfilter li:nth-of-type(1) [data-test-target]';
    const cohort = '[data-test-cohort-calendar-filter] li:nth-of-type(2) [data-test-target]';

    const filtersList = '.filters-list';
    const clearFilter = '.filters-clear-filters';

    function getTagText(n) {
      return find(`.filter-tag:nth-of-type(${n + 1})`).textContent.trim();
    }

    async function clickTag(n) {
      return await click(`.filter-tag:nth-of-type(${n + 1})`);
    }

    await page.visit({ show: 'calendar', view: 'week' });
    await showFilters();
    await chooseDetailFilter();
    assert.ok(isEmpty(find(filtersList)), 'filter tags list is inactive');

    await click(sessiontype);
    await click(courselevel);
    await click(cohort);
    assert.strictEqual(getTagText(0), 'cohort 0 program 0', 'filter tag is active');
    assert.strictEqual(getTagText(1), 'Course Level 1', 'filter tag is active');
    assert.strictEqual(getTagText(2), 'session type 0', 'filter tag is active');

    await clickTag(1);
    assert.notOk(find(courselevel).checked, 'filter is unchecked');
    assert.strictEqual(getTagText(0), 'cohort 0 program 0', 'filter tag is active');
    assert.strictEqual(getTagText(1), 'session type 0', 'filter tag is active');

    await clickTag(0);
    assert.strictEqual(getTagText(0), 'session type 0', 'filter tag is active');

    await click(clearFilter);
    assert.ok(isEmpty(find(filtersList)), 'filter tags list is inactive');
    assert.notOk(find(sessiontype).checked, 'filter is unchecked');
    assert.notOk(find(cohort).checked, 'filter is unchecked');
  });

  test('query params work', async function (assert) {
    const calendarPicker = '.dashboard-view-picker li:nth-of-type(4) button';
    const schoolEvents = '.togglemyschedule label:nth-of-type(2)';
    const showFiltersButton = '.showfilters label:nth-of-type(2)';
    const hideFiltersButton = '.showfilters label:nth-of-type(1)';

    await visit('/dashboard');
    await click(calendarPicker);
    assert.strictEqual(currentURL(), '/dashboard?show=calendar');

    await click(schoolEvents);
    assert.strictEqual(currentURL(), '/dashboard?mySchedule=false&show=calendar');

    await click(showFiltersButton);
    assert.strictEqual(currentURL(), '/dashboard?mySchedule=false&show=calendar&showFilters=true');

    await chooseDetailFilter();
    assert.strictEqual(
      currentURL(),
      '/dashboard?courseFilters=false&mySchedule=false&show=calendar&showFilters=true'
    );

    await click(hideFiltersButton);
    assert.strictEqual(currentURL(), '/dashboard?mySchedule=false&show=calendar');

    await click(showFiltersButton);
    await click('[data-test-courses-calendar-filter] ul li:nth-child(1) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?courses=1&mySchedule=false&show=calendar&showFilters=true'
    );

    await click('[data-test-courses-calendar-filter] ul li:nth-child(2) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?courses=1-2&mySchedule=false&show=calendar&showFilters=true'
    );

    await click('[data-test-courses-calendar-filter] ul li:nth-child(2) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?courses=1&mySchedule=false&show=calendar&showFilters=true'
    );

    await click('[data-test-courses-calendar-filter] ul li:nth-child(1) input');
    assert.strictEqual(currentURL(), '/dashboard?mySchedule=false&show=calendar&showFilters=true');

    await click('.sessiontypefilter ul li:nth-child(1) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?mySchedule=false&sessionTypes=1&show=calendar&showFilters=true'
    );

    await click('.sessiontypefilter ul li:nth-child(2) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?mySchedule=false&sessionTypes=1-2&show=calendar&showFilters=true'
    );

    await click('.sessiontypefilter ul li:nth-child(2) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?mySchedule=false&sessionTypes=1&show=calendar&showFilters=true'
    );

    await click('.sessiontypefilter ul li:nth-child(1) input');
    assert.strictEqual(currentURL(), '/dashboard?mySchedule=false&show=calendar&showFilters=true');

    await click('.togglecoursefilters label:nth-of-type(2)');
    await click('.courselevelfilter ul li:nth-child(1) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?courseFilters=false&courseLevels=1&mySchedule=false&show=calendar&showFilters=true'
    );

    await click('.courselevelfilter ul li:nth-child(2) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?courseFilters=false&courseLevels=1-2&mySchedule=false&show=calendar&showFilters=true'
    );

    await click('.courselevelfilter ul li:nth-child(2) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?courseFilters=false&courseLevels=1&mySchedule=false&show=calendar&showFilters=true'
    );

    await click('.courselevelfilter ul li:nth-child(1) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?courseFilters=false&mySchedule=false&show=calendar&showFilters=true'
    );

    await click('[data-test-cohort-calendar-filter] ul li:nth-child(2) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?cohorts=1&courseFilters=false&mySchedule=false&show=calendar&showFilters=true'
    );

    await click('[data-test-cohort-calendar-filter] ul li:nth-child(1) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?cohorts=1-2&courseFilters=false&mySchedule=false&show=calendar&showFilters=true'
    );

    await click('[data-test-cohort-calendar-filter] ul li:nth-child(1) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?cohorts=1&courseFilters=false&mySchedule=false&show=calendar&showFilters=true'
    );

    await click('[data-test-cohort-calendar-filter] ul li:nth-child(2) input');
    assert.strictEqual(
      currentURL(),
      '/dashboard?courseFilters=false&mySchedule=false&show=calendar&showFilters=true'
    );
  });

  test('week summary displays the whole week', async function (assert) {
    const startOfTheWeek = DateTime.local().startOf('week').set({ hours: 0, minutes: 2 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: startOfTheWeek.toISO(),
      endDate: startOfTheWeek.plus({ hours: 1 }).toISO(),
      offering: 1,
      isPublished: true,
    });
    const endOfTheWeek = DateTime.local().endOf('week').set({ hours: 22, minutes: 5 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: endOfTheWeek.toISO(),
      endDate: endOfTheWeek.plus({ hours: 1 }).toISO(),
      offering: 2,
      isPublished: true,
    });
    const dashboard = '.dashboard-week';
    const events = `${dashboard} .event`;

    await visit('/dashboard?show=week');
    const eventBLocks = findAll(events);
    assert.strictEqual(eventBLocks.length, 2);
    const options = {
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
    };
    assert
      .dom(eventBLocks[0])
      .hasText('event 0 ' + startOfTheWeek.toJSDate().toLocaleString([], options));
    assert
      .dom(eventBLocks[1])
      .hasText('event 1 ' + endOfTheWeek.toJSDate().toLocaleString([], options));
  });

  const pickTerm = async function (i) {
    return await click(find(`.vocabularyfilter li:nth-of-type(${i}) [data-test-target]`));
  };

  test('test term filter', async function (assert) {
    const vocabulary = this.server.create('vocabulary', {
      school: this.school,
    });
    this.server.create('term', {
      vocabulary,
      sessionIds: [1, 2],
    });
    this.server.create('term', {
      vocabulary,
    });
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      sessionTerms: [{ id: 1 }],
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      sessionTerms: [{ id: 1 }],
    });
    await page.visit({ show: 'calendar', view: 'week' });
    await showFilters();
    assert.strictEqual(page.weeklyCalendar.events.length, 2);
    await pickTerm(1);
    assert.strictEqual(page.weeklyCalendar.events.length, 2);

    await pickTerm(1);
    await pickTerm(2);
    assert.strictEqual(page.weeklyCalendar.events.length, 0);
  });

  test('clear vocab filter #3450', async function (assert) {
    const vocabulary = this.server.create('vocabulary', {
      school: this.school,
    });
    this.server.create('term', {
      vocabulary,
      sessionIds: [1],
    });
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      sessionTerms: [{ id: 1 }],
    });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      sessionTerms: [],
    });
    const filters = '.filter-tags .filter-tag';
    const filter = `${filters}:nth-of-type(1)`;

    await page.visit({ show: 'calendar', view: 'week' });
    await showFilters();
    assert.strictEqual(page.weeklyCalendar.events.length, 2);
    await pickTerm(1);
    assert.strictEqual(page.weeklyCalendar.events.length, 1);

    assert.dom(filters).exists({ count: 1 });
    await click(filter);
    assert.dom(filters).doesNotExist();
    assert.strictEqual(page.weeklyCalendar.events.length, 2);
  });

  test('test tooltip', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      offering: 1,
    });
    await page.visit({ show: 'calendar', view: 'week' });
    await triggerEvent('[data-test-weekly-calendar-event]', 'mouseover');
    assert.dom('[data-test-ilios-calendar-event-tooltip]').exists();
  });

  test('visit with course filters open #5098', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      cohorts: [{ id: 1 }],
    });
    await page.visit({
      show: 'calendar',
      view: 'week',
      showFilters: 'true',
      courseFilters: 'true',
    });
    assert.strictEqual(page.weeklyCalendar.events.length, 1);
  });

  test('visit with detail filters open #5098', async function (assert) {
    const today = DateTime.local().set({ hours: 8 });
    this.server.create('userevent', {
      user: parseInt(this.user.id, 10),
      startDate: today.toISO(),
      endDate: today.plus({ hours: 1 }).toISO(),
      cohorts: [{ id: 1 }],
    });
    await page.visit({
      show: 'calendar',
      view: 'week',
      showFilters: 'true',
      courseFilters: 'false',
    });
    assert.strictEqual(page.weeklyCalendar.events.length, 1);
  });
});
