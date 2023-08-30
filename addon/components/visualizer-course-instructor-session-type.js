import Component from '@glimmer/component';
import { filter, map } from 'rsvp';
import { isEmpty } from '@ember/utils';
import { htmlSafe } from '@ember/template';
import { restartableTask, timeout } from 'ember-concurrency';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { use } from 'ember-could-get-used-to-this';
import { TrackedAsyncData } from 'ember-async-data';
import { cached } from '@glimmer/tracking';
import AsyncProcess from 'ilios-common/classes/async-process';
import { findBy, mapBy, uniqueValues } from 'ilios-common/utils/array-helpers';

export default class VisualizerCourseInstructorSessionType extends Component {
  @service router;
  @service intl;
  @tracked tooltipContent = null;
  @tracked tooltipTitle = null;

  @cached
  get sessionsData() {
    return new TrackedAsyncData(this.args.course.sessions);
  }

  get sessions() {
    return this.sessionsData.isResolved ? this.sessionsData.value : null;
  }

  @use loadedData = new AsyncProcess(() => [this.getData.bind(this), this.sessions]);

  get data() {
    if (!this.loadedData) {
      return [];
    }
    return this.loadedData;
  }

  async getData(sessions) {
    if (!sessions) {
      return [];
    }

    const sessionsWithUser = await filter(sessions.slice(), async (session) => {
      const allInstructors = await session.getAllOfferingInstructors();
      return mapBy(allInstructors, 'id').includes(this.args.user.id);
    });

    const sessionsWithSessionType = await map(sessionsWithUser.slice(), async (session) => {
      const sessionType = await session.sessionType;
      return {
        session,
        sessionType,
      };
    });

    const dataMap = await map(sessionsWithSessionType, async ({ session, sessionType }) => {
      const minutes = await session.getTotalSumDurationByInstructor(this.args.user);
      return {
        sessionTitle: session.title,
        sessionTypeTitle: sessionType.title,
        minutes,
      };
    });

    const sessionTypeData = dataMap.reduce((set, obj) => {
      const name = obj.sessionTypeTitle;
      let existing = findBy(set, 'label', name);
      if (!existing) {
        existing = {
          data: 0,
          label: name,
          meta: {
            sessions: [],
          },
        };
        set.push(existing);
      }
      existing.data += obj.minutes;
      existing.meta.sessions.push(obj.sessionTitle);

      return set;
    }, []);

    const totalMinutes = mapBy(sessionTypeData, 'data').reduce(
      (total, minutes) => total + minutes,
      0,
    );

    return sessionTypeData.map((obj) => {
      const percent = ((obj.data / totalMinutes) * 100).toFixed(1);
      obj.label = `${obj.label} ${percent}%`;
      obj.meta.totalMinutes = totalMinutes;
      obj.meta.percent = percent;
      return obj;
    });
  }

  donutHover = restartableTask(async (obj) => {
    await timeout(100);
    if (this.args.isIcon || isEmpty(obj) || obj.empty) {
      this.tooltipTitle = null;
      this.tooltipContent = null;
      return;
    }
    const { label, data, meta } = obj;

    this.tooltipTitle = htmlSafe(`${label} ${data} ${this.intl.t('general.minutes')}`);
    this.tooltipContent = uniqueValues(meta.sessions).sort().join(', ');
  });
}
