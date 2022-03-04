import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';
import { restartableTask, timeout } from 'ember-concurrency';
import { use } from 'ember-could-get-used-to-this';
import AsyncProcess from 'ilios-common/classes/async-process';
import moment from 'moment';

const DEBOUNCE_DELAY = 250;
const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 25;

export default class DashboardMaterialsComponent extends Component {
  daysInAdvance = 60;
  @service store;
  @service fetch;
  @service iliosConfig;
  @tracked showAllMaterials = false;
  @service currentUser;
  @tracked materials = null;
  @tracked offset = DEFAULT_OFFSET;
  @tracked limit = DEFAULT_LIMIT;
  @use _course = new AsyncProcess(() => [this.loadCourse.bind(this), this.args.courseIdFilter]);

  async loadCourse(courseId) {
    let course = null;
    try {
      course = await this.store.findRecord('course', courseId);
    } catch (e) {
      // eat the exception
    }
    return course;
  }

  get course() {
    if (this._course) {
      return this._course;
    }
    return null;
  }

  @restartableTask
  *load() {
    const user = yield this.currentUser.getModel();
    let url = `${this.iliosConfig.apiNameSpace}/usermaterials/${user.id}`;
    if (!this.args.showAllMaterials) {
      const from = moment().hour(0).minute(0).unix();
      const to = moment().hour(23).minute(59).add(this.daysInAdvance, 'days').unix();
      url += `?before=${to}&after=${from}`;
    }
    const data = yield this.fetch.getJsonFromApiHost(url);
    this.materials = data.userMaterials;
  }

  get canApplyCourseFilter() {
    if (isPresent(this.args.courseIdFilter)) {
      return this.materialsFilteredByCourse.length;
    }
    return true;
  }

  get allMaterials() {
    if (!this.materials) {
      return [];
    }
    return this.materials;
  }

  get materialsFilteredByCourse() {
    if (isPresent(this.args.courseIdFilter)) {
      return this.allMaterials.filterBy('course', this.args.courseIdFilter);
    }
    return this.allMaterials;
  }

  get allFilteredMaterials() {
    let materials = this.materialsFilteredByCourse;

    if (isPresent(this.args.filter)) {
      materials = materials.filter(({ courseTitle, instructors, sessionTitle, title }) => {
        let searchString = `${title} ${courseTitle} ${sessionTitle} `;

        if (isPresent(instructors)) {
          searchString += instructors.join(' ');
        }

        return searchString.toLowerCase().includes(this.args.filter.toLowerCase());
      });
    }

    const sortedMaterials = materials.sortBy(this.sortInfo.column);
    if (this.sortInfo.descending) {
      return sortedMaterials.reverse();
    }
    return sortedMaterials;
  }

  get sortInfo() {
    const parts = this.args.sortBy.split(':');
    const column = parts[0];
    const descending = parts.length > 1 && parts[1] === 'desc';

    return { column, descending, sortBy: this.args.sortBy };
  }

  get filteredMaterials() {
    if (this.limit >= this.total) {
      return this.allFilteredMaterials;
    }
    return this.allFilteredMaterials.slice(this.offset, this.offset + this.limit);
  }

  get total() {
    return this.allFilteredMaterials.length;
  }

  get courses() {
    if (!this.materials) {
      return [];
    }
    return this.materials
      .map((material) => {
        return { id: material.course, title: material.courseTitle };
      })
      .uniqBy('id')
      .sortBy('title');
  }

  get sortedAscending() {
    return this.args.sortBy.search(/desc/) === -1;
  }

  @action
  sortString(a, b) {
    return a.localeCompare(b);
  }

  @action
  sortBy(what) {
    if (this.args.sortBy === what) {
      what += ':desc';
    }
    this.args.setSortBy(what);
  }

  @action
  setLimit(limit) {
    this.limit = limit;
  }

  @action
  setOffset(offset) {
    this.offset = offset;
  }

  @action
  changeCourseIdFilter(event) {
    this.offset = DEFAULT_OFFSET;
    this.args.setCourseIdFilter(event.target.value);
  }

  @restartableTask
  *setQuery(query) {
    yield timeout(DEBOUNCE_DELAY);
    this.offset = DEFAULT_OFFSET;
    this.args.setFilter(query);
  }
}
