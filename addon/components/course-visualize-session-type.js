import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';

export default class CourseVisualizeSessionTypeComponent extends Component {
  @service iliosConfig;
  @tracked academicYearCrossesCalendarYearBoundaries = false;
  @tracked title;

  load = restartableTask(this, async () => {
    this.academicYearCrossesCalendarYearBoundaries = await this.iliosConfig.itemFromConfig(
      'academicYearCrossesCalendarYearBoundaries'
    );
  });
}
