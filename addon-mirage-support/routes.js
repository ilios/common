import { getAll, filterResults } from './get-all';
import { postAll } from './post-all';
import parseJsonData from './parse-json-data';
import { DateTime } from 'luxon';

export default function (server) {
  const models = [
    { route: 'aamcmethods', name: 'aamcMethod' },
    { route: 'aamcmethods/', name: 'aamcMethod' },
    { route: 'aamcpcrses/', name: 'aamcPcrs' },
    { route: 'academicyears/', name: 'academicYear' },
    { route: 'assessmentoptions/', name: 'assessmentOption' },
    { route: 'authentications/', name: 'authentication' },
    { route: 'cohorts/', name: 'cohort' },
    { route: 'competencies/', name: 'competency' },
    { route: 'courseclerkshiptypes/', name: 'courseClerkshipType' },
    { route: 'courselearningmaterials/', name: 'courseLearningMaterial' },
    { route: 'courseobjectives/', name: 'courseObjective' },
    { route: 'courses/', name: 'course' },
    {
      route: 'curriculuminventoryacademiclevels/',
      name: 'curriculumInventoryAcademicLevel',
    },
    { route: 'curriculuminventoryexports/', name: 'curriculumInventoryExport' },
    {
      route: 'curriculuminventoryinstitutions/',
      name: 'curriculumInventoryInstitution',
    },
    { route: 'curriculuminventoryreports/', name: 'curriculumInventoryReport' },
    {
      route: 'curriculuminventorysequenceblocks/',
      name: 'curriculumInventorySequenceBlock',
    },
    {
      route: 'curriculuminventorysequences/',
      name: 'curriculumInventorySequence',
    },
    { route: 'vocabularies/', name: 'vocabulary' },
    { route: 'terms/', name: 'term' },
    { route: 'ilmsessions/', name: 'ilmSession' },
    { route: 'instructorgroups/', name: 'instructorGroup' },
    { route: 'learnergroups/', name: 'learnerGroup' },
    { route: 'learningmaterialstatuses/', name: 'learningMaterialStatus' },
    { route: 'learningmaterialuserroles/', name: 'learningMaterialUserRole' },
    { route: 'learningmaterials/', name: 'learningMaterial' },
    { route: 'meshconcepts/', name: 'meshConcept' },
    { route: 'meshdescriptors/', name: 'meshDescriptor' },
    { route: 'meshqualifiers/', name: 'meshQualifier' },
    { route: 'meshtrees/', name: 'meshTree' },
    { route: 'meshpreviousindexings/', name: 'meshPreviousIndexing' },
    { route: 'objectives/', name: 'objective' },
    { route: 'offerings/', name: 'offering' },
    { route: 'programyearobjectives/', name: 'programYearObjective' },
    { route: 'programs/', name: 'program' },
    { route: 'reports/', name: 'report' },
    { route: 'schools/', name: 'school' },
    { route: 'schoolconfigs/', name: 'schoolConfig' },
    { route: 'sessiondescriptions/', name: 'sessionDescription' },
    { route: 'sessionlearningmaterials/', name: 'sessionLearningMaterial' },
    { route: 'sessionobjectives/', name: 'sessionObjective' },
    { route: 'sessiontypes/', name: 'sessionType' },
    { route: 'sessions/', name: 'session' },
    { route: 'userroles/', name: 'userRole' },
    { route: 'pendinguserupdates/', name: 'pendingUserUpdate' },
    { route: 'programyears/', name: 'programYear' },
    { route: 'users/', name: 'user' },
    { route: 'usersessionmaterialstatuses/', name: 'userSessionMaterialStatus' },
  ];

  models.forEach((obj) => {
    server.get(`api/${obj.route}`, getAll);
    server.get(`api/${obj.route}/:id`, obj.name);
    server.patch(`api/${obj.route}/:id`, obj.name);
    server.del(`api/${obj.route}/:id`, obj.name);
    server.post(`api/${obj.route}`, postAll);
  });

  server.get('api/cohorts', (schema, request) => {
    const params = request.queryParams;
    const keys = Object.keys(params);
    const schoolKey = 'filters[schools]';
    if (keys.includes(schoolKey)) {
      const schoolsFilter = params[schoolKey];
      const cohorts = schema.cohorts.all().filter((cohort) => {
        const school = cohort.programYear.program.school;

        return schoolsFilter.includes(school.id);
      });

      return cohorts;
    } else {
      return getAll(schema, request);
    }
  });

  server.get('api/courses', (schema, request) => {
    const params = request.queryParams;
    const keys = Object.keys(params);
    const schoolKey = 'filters[school]';
    if (keys.includes(schoolKey)) {
      const schoolsFilter = params[schoolKey];
      const courses = schema.courses.all().filter((course) => {
        const school = course.school;

        return schoolsFilter.includes(school.id);
      });

      return filterResults(courses, 'courses', request);
    } else {
      return getAll(schema, request);
    }
  });

  server.get('api/pendinguserupdates', (schema, request) => {
    const params = request.queryParams;
    const keys = Object.keys(params);
    const schoolKey = 'filters[schools]';
    if (keys.includes(schoolKey)) {
      const schoolsFilter = params[schoolKey];
      const updates = schema.pendingUserUpdates.all().filter((update) => {
        const school = update.user.school;

        return schoolsFilter.includes(school.id);
      });

      return updates;
    } else {
      return getAll(schema, request);
    }
  });
  server.post('api/programyears', function (schema, request) {
    const jsonData = this.serializerOrRegistry.normalize(
      JSON.parse(request.requestBody),
      'program-year',
    );
    const attrs = parseJsonData(jsonData);
    const programYear = schema.programYears.create(attrs);
    const cohortAttr = {
      programYearId: programYear.id,
      title:
        'Class of ' +
        (parseInt(programYear.program.duration, 10) + parseInt(programYear.startYear, 10)),
    };
    const cohort = schema.cohorts.create(cohortAttr);
    programYear.cohort = cohort;
    return programYear;
  });

  server.get('api/sessions', (schema, request) => {
    const params = request.queryParams;
    const keys = Object.keys(params);
    const schoolKey = 'filters[schools]';
    if (keys.includes(schoolKey)) {
      const schoolsFilter = params[schoolKey];
      const sessions = schema.sessions.all().filter((session) => {
        const school = session.course.school;

        return schoolsFilter.includes(school.id);
      });

      return sessions;
    } else {
      return getAll(schema, request);
    }
  });

  server.get('api/userevents/:userid', function ({ db }, request) {
    const from = Number(request.queryParams.from);
    const to = Number(request.queryParams.to);
    const userid = Number(request.params.userid);
    const userEvents = db.userevents.filter((event) => {
      const st = DateTime.fromJSDate(event.startDate).toUnixInteger();
      const et = DateTime.fromJSDate(event.endDate).toUnixInteger();
      return Number(event.user) === userid && from <= st && to >= et;
    });
    return {
      userEvents: userEvents,
    };
  });

  server.get('api/schoolevents/:schoolid', function ({ db }, request) {
    const from = Number(request.queryParams.from);
    const to = Number(request.queryParams.to);
    const schoolId = Number(request.params.schoolid);
    const schoolEvents = db.schoolevents.filter((event) => {
      const st = DateTime.fromJSDate(event.startDate).toUnixInteger();
      const et = DateTime.fromJSDate(event.endDate).toUnixInteger();
      return Number(event.school) === schoolId && from <= st && to >= et;
    });
    return {
      events: schoolEvents,
    };
  });

  server.post('upload', function () {
    let hash = '';
    const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < 32; i++) {
      hash += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
    }

    return {
      filename: 'bogus.txt',
      fileHash: hash,
    };
  });
}
