import {
  attribute,
  clickable,
  create,
  collection,
  hasClass,
  isPresent,
  text,
} from 'ember-cli-page-object';
import objectiveList from './single-event-objective-list';

const definition = {
  scope: '[data-test-single-event]',
  summary: {
    scope: '[data-test-summary]',
    title: text('[data-test-title]'),
    offeredAt: text('[data-test-offered-at]'),
    offeredAtLink: attribute('href', '[data-test-offered-at] a'),
    preWork: collection('[data-test-pre-work] li', {
      title: text(),
      hasLink: isPresent('a'),
    }),
  },
  sessionObjectives: {
    scope: '[data-test-session-objectives]',
    objectiveList,
  },
  sessionLearningMaterials: {
    scope: '[data-test-session-materials]',
    expandCollapseSwitcher: {
      scope: '[data-test-expand-collapse]',
      isExpanded: hasClass('expanded'),
      toggle: clickable(),
    },
    linksToAllMaterials: isPresent('[data-test-link-to-all-materials]'),
  },
  courseObjectives: {
    scope: '[data-test-course-objectives]',
    objectiveList,
  },
  courseLearningMaterials: {
    scope: '[data-test-course-materials]',
    expandCollapseSwitcher: {
      scope: '[data-test-expand-collapse]',
      isExpanded: hasClass('expanded'),
      toggle: clickable(),
    },
    linksToAllMaterials: isPresent('[data-test-link-to-all-materials]'),
  },
};

export default definition;
export const component = create(definition);
