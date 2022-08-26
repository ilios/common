import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';
import { restartableTask, timeout } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { use } from 'ember-could-get-used-to-this';
import ResolveAsyncValue from 'ilios-common/classes/resolve-async-value';
import ResolveFlatMapBy from 'ilios-common/classes/resolve-flat-map-by';

export default class VisualizerCourseTerm extends Component {
  @service router;
  @service intl;
  @tracked tooltipContent = null;
  @tracked tooltipTitle = null;

  @use sessions = new ResolveAsyncValue(() => [this.args.course.sessions]);
  @use sessionTypes = new ResolveFlatMapBy(() => [this.sessions, 'sessionType']);

  get isLoaded() {
    return !!this.sessionTypes;
  }

  get termSessionIds() {
    return this.args.term.hasMany('sessions').ids();
  }

  get termSessionsInCourse() {
    return this.sessions.filter((session) => this.termSessionIds.includes(session.id));
  }

  get data() {
    const sessionTypeData = this.termSessionsInCourse.map((session) => {
      const minutes = Math.round(session.totalSumDuration * 60);
      const sessionType = this.sessionTypes.findBy('id', session.belongsTo('sessionType').id());
      return {
        sessionTitle: session.title,
        sessionTypeTitle: sessionType.title,
        minutes,
      };
    });

    const data = sessionTypeData.reduce((set, obj) => {
      let existing = set.findBy('label', obj.sessionTypeTitle);
      if (!existing) {
        existing = {
          data: 0,
          label: obj.sessionTypeTitle,
          meta: {
            sessionTypeTitle: obj.sessionTypeTitle,
            sessions: [],
          },
        };
        set.pushObject(existing);
      }
      existing.data += obj.minutes;
      existing.meta.sessions.pushObject(obj.sessionTitle);

      return set;
    }, []);

    const totalMinutes = data.mapBy('data').reduce((total, minutes) => total + minutes, 0);

    return data.map((obj) => {
      const percent = ((obj.data / totalMinutes) * 100).toFixed(1);
      obj.label = `${obj.meta.sessionTypeTitle} ${percent}%`;
      obj.meta.totalMinutes = totalMinutes;
      obj.meta.percent = percent;
      return obj;
    });
  }

  barHover = restartableTask(this, async (obj) => {
    await timeout(100);
    if (this.args.isIcon || !obj || obj.empty) {
      this.tooltipTitle = null;
      this.tooltipContent = null;
      return;
    }
    const { label, data, meta } = obj;

    this.tooltipTitle = htmlSafe(`${label} ${data} ${this.intl.t('general.minutes')}`);
    this.tooltipContent = meta.sessions.uniq().sort().join(', ');
  });
}
