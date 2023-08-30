import Component from '@glimmer/component';
import { map } from 'rsvp';
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

export default class VisualizerCourseSessionType extends Component {
  @service router;
  @service intl;
  @tracked tooltipContent = null;
  @tracked tooltipTitle = null;

  @cached
  get sessionsData() {
    return new TrackedAsyncData(this.args.course.sessions);
  }

  @cached
  get sessionTypeSessionsData() {
    return new TrackedAsyncData(this.args.sessionType.sessions);
  }

  get sessions() {
    return this.sessionsData.isResolved ? this.sessionsData.value : [];
  }

  get sessionTypeSessions() {
    return this.sessionTypeSessionsData.isResolved ? this.sessionTypeSessionsData.value : [];
  }

  @use dataObjects = new AsyncProcess(() => [
    this.getDataObjects.bind(this),
    this.sessionsAndSessionTypeSessions,
  ]);

  get sessionsAndSessionTypeSessions() {
    const rhett = {
      sessions: [],
      sessionTypeSessions: [],
    };
    if (this.sessions && this.sessionTypeSessions) {
      rhett.sessions = this.sessions.slice();
      rhett.sessionTypeSessions = this.sessionTypeSessions.slice();
    }
    return rhett;
  }

  async getDataObjects(sessionsAndSessionTypeSessions) {
    const sessions = sessionsAndSessionTypeSessions.sessions;
    const sessionTypeSessions = sessionsAndSessionTypeSessions.sessionTypeSessions;
    const courseSessionsWithSessionType = sessions.filter((session) =>
      sessionTypeSessions.includes(session),
    );

    const sessionsWithMinutes = map(courseSessionsWithSessionType, async (session) => {
      const hours = await session.getTotalSumDuration();
      return {
        session,
        minutes: Math.round(hours * 60),
      };
    });

    const termData = await map(sessionsWithMinutes, async ({ session, minutes }) => {
      const terms = (await session.terms).slice();
      return map(terms, async (term) => {
        const vocabulary = await term.vocabulary;
        return {
          sessionTitle: session.title,
          termTitle: term.title,
          vocabularyTitle: vocabulary.title,
          minutes,
        };
      });
    });

    return termData.reduce((flattened, arr) => {
      return [...flattened, ...arr];
    }, []);
  }

  get data() {
    const data = this.dataObjects.reduce((set, obj) => {
      const label = obj.vocabularyTitle + ' - ' + obj.termTitle;
      let existing = findBy(set, 'label', label);
      if (!existing) {
        existing = {
          data: 0,
          label,
          meta: {
            vocabularyTitle: obj.vocabularyTitle,
            sessions: [],
          },
        };
        set.push(existing);
      }
      existing.data += obj.minutes;
      existing.meta.sessions.push(obj.sessionTitle);

      return set;
    }, []);

    const totalMinutes = mapBy(data, 'data').reduce((total, minutes) => total + minutes, 0);
    return data
      .map((obj) => {
        const percent = ((obj.data / totalMinutes) * 100).toFixed(1);
        obj.label = `${obj.label}: ${obj.data} ${this.intl.t('general.minutes')}`;
        obj.meta.totalMinutes = totalMinutes;
        obj.meta.percent = percent;
        return obj;
      })
      .sort((first, second) => {
        return (
          first.meta.vocabularyTitle.localeCompare(second.meta.vocabularyTitle) ||
          first.data - second.data
        );
      });
  }

  get isLoaded() {
    return !!this.dataObjects;
  }

  barHover = restartableTask(async (obj) => {
    await timeout(100);
    if (this.args.isIcon || isEmpty(obj) || obj.empty) {
      this.tooltipTitle = null;
      this.tooltipContent = null;
      return;
    }
    const { label, meta } = obj;

    this.tooltipTitle = htmlSafe(label);
    this.tooltipContent = uniqueValues(meta.sessions).sort().join(', ');
  });
}
