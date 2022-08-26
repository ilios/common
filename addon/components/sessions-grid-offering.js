import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { restartableTask, dropTask, timeout } from 'ember-concurrency';
import { validatable, Length, NotBlank } from 'ilios-common/decorators/validation';
import scrollIntoView from 'scroll-into-view';

@validatable
export default class SessionsGridOffering extends Component {
  @Length(1, 255) @NotBlank() @tracked room;
  @tracked isEditing = false;
  @tracked wasUpdated = false;

  @action
  revertRoomChanges() {
    this.room = this.args.offering.room;
  }

  @action
  close() {
    this.isEditing = false;
    scrollIntoView(this.row);
  }

  changeRoom = dropTask(this, async () => {
    await timeout(10);
    this.addErrorDisplayFor('room');
    const isValid = await this.isValid('room');
    if (!isValid) {
      return false;
    }
    this.removeErrorDisplayFor('room');
    this.args.offering.set('room', this.room);
    await this.args.offering.save();
  });

  save = dropTask(
    this,
    async (
      startDate,
      endDate,
      room,
      url,
      learnerGroups,
      learners,
      instructorGroups,
      instructors
    ) => {
      this.args.offering.setProperties({
        startDate,
        endDate,
        room,
        url,
        learnerGroups,
        learners,
        instructorGroups,
        instructors,
      });
      await this.args.offering.save();
      this.updateUi.perform();
    }
  );

  updateUi = restartableTask(this, async () => {
    await timeout(10);
    this.wasUpdated = true;
    scrollIntoView(this.element);
    await timeout(4000);
    this.wasUpdated = false;
  });
}
