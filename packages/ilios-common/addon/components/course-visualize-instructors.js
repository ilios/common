import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';

export default class CourseVisualizeInstructorsComponent extends Component {
  @service iliosConfig;
  @tracked academicYearCrossesCalendarYearBoundaries = false;
  @tracked name;

  load = restartableTask(async () => {
    this.academicYearCrossesCalendarYearBoundaries = await this.iliosConfig.itemFromConfig(
      'academicYearCrossesCalendarYearBoundaries',
    );
  });
}
