import Service from '@ember/service';
import { inject as service } from '@ember/service';
import { deprecate } from '@ember/debug';

export default class DataLoaderService extends Service {
  @service store;

  #calendarSchools = {};
  #learnerGroupSchools = null;
  #learnerGroupCohorts = {};
  #courses = {};
  async loadSchool(id) {
    if (!(id in this.#calendarSchools)) {
      const relationships = [
        'programs.programYears.cohort',
        'sessionTypes',
        'vocabularies.terms.children.children.children',
        'courses',
        'configurations',
        'competencies',
      ];
      this.#calendarSchools[id] = this.store.findRecord('school', id, {
        include: relationships.join(','),
        reload: true,
      });
    }

    return this.#calendarSchools[id];
  }
  async loadSchoolForCalendar(id) {
    deprecate('loadSchoolForCalendar called use loadSchool instead', false, {
      id: 'common.data-loader.loadSchoolForCalendar',
      for: 'ilios-common',
      until: '68',
      since: '67.1.0',
    });
    return this.loadSchool(id);
  }
  async loadSchoolForCourses(id) {
    deprecate('loadSchoolForCourses called use loadSchool instead', false, {
      id: 'common.data-loader.loadSchoolForCalendar',
      for: 'ilios-common',
      until: '68',
      since: '67.1.0',
    });
    return this.loadSchool(id);
  }
  async loadSchoolsForLearnerGroups() {
    if (!this.#learnerGroupSchools) {
      this.#learnerGroupSchools = this.store.findAll('school', {
        include: 'programs.programYears.cohort',
        reload: true,
      });
    }
    return this.#learnerGroupSchools;
  }
  async loadCohortForLearnerGroups(id) {
    if (!(id in this.#learnerGroupCohorts)) {
      this.#learnerGroupCohorts[id] = this.store.findRecord('cohort', id, {
        include: 'learnerGroups,users',
        reload: true,
      });
    }

    return this.#learnerGroupCohorts[id];
  }
  async loadCourse(id) {
    if (!(id in this.#courses)) {
      const relationships = [
        'clerkshipType',
        'courseObjectives.programYearObjectives',
        'courseObjectives.meshDescriptors',
        'courseObjectives.terms.vocabulary',
        'learningMaterials.learningMaterial.owningUser',
        'directors',
        'administrators',
        'studentAdvisors',
        'meshDescriptors.trees',
        'cohorts.programYear.program',
        'cohorts.programYear.programYearObjectives',
        'cohorts.learnerGroups',
        'ancestor',
        'descendants',
        'terms.vocabulary',
        'terms.parent.parent.parent',
      ];
      const courseInclude = relationships.join(',');
      const sessionRelationships = [
        'learningMaterials.learningMaterial.owningUser',
        'sessionObjectives.courseObjectives',
        'sessionObjectives.meshDescriptors',
        'sessionObjectives.terms.vocabulary',
        'offerings.learners',
        'offerings.instructors',
        'offerings.instructorGroups.users',
        'offerings.learnerGroups.users',
        'ilmSession.learners',
        'ilmSession.instructors',
        'ilmSession.instructorGroups.users',
        'ilmSession.learnerGroups.users',
        'meshDescriptors.trees',
        'administrators',
        'studentAdvisors',
      ];
      const sessionInclude = sessionRelationships.reduce((includes, item) => {
        return `${includes}sessions.${item},`;
      }, '');

      this.#courses[id] = this.store.findRecord('course', id, {
        include: `${courseInclude},${sessionInclude}`,
        reload: true,
      });
    }
    return this.#courses[id];
  }
  async loadCourseSessions(id) {
    deprecate('loadCourseSessions called use loadCourse instead', false, {
      id: 'common.data-loader.loadCourseSessions',
      for: 'ilios-common',
      until: '68',
      since: '67.1.0',
    });
    return this.loadCourse(id);
  }
}
