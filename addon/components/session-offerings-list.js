import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import OfferingDateBlock from 'ilios-common/utils/offering-date-block';
import { tracked } from '@glimmer/tracking';
import { restartableTask } from 'ember-concurrency';

export default class SessionOfferingsListComponent extends Component {
  @service store;
  @tracked offeringsRelationship;

  load = restartableTask(async () => {
    this.offeringsRelationship = await this.args.session.offerings;
  });

  get offerings() {
    return this.offeringsRelationship ? this.offeringsRelationship.toArray() : [];
  }

  get offeringBlocks() {
    const dateBlocks = {};
    this.offerings.forEach((offering) => {
      const key = offering.get('dateKey');
      if (!(key in dateBlocks)) {
        dateBlocks[key] = OfferingDateBlock.create({
          dateKey: key,
        });
      }
      dateBlocks[key].addOffering(offering);
    });
    //convert indexed object to array
    const dateBlockArray = [];
    let key;
    for (key in dateBlocks) {
      dateBlockArray.pushObject(dateBlocks[key]);
    }
    return dateBlockArray.sortBy('dateStamp');
  }

  @action
  removeOffering(offering) {
    offering.deleteRecord();
    offering.save();
  }
}
