const CATEGORY_DEFINITIONS = {
  student: {
    label: 'Student',
    subCategories: { student: 'Student / Intern' },
    fields: {},
  },
  construction: {
    label: 'Construction',
    subCategories: {
      labour: 'Labour (Unskilled/Helper)',
      mason: 'Mason (Rajmistri)',
      crane_operator: 'Crane / JCB / Heavy Machinery Operator',
      site_supervisor: 'Site Supervisor',
    },
    fields: {
      labour: [
        { key: 'workType', label: 'Type of work', type: 'text', required: true },
        { key: 'workersRequired', label: 'Number of workers required', type: 'number', required: true, min: 1 },
        { key: 'workLocation', label: 'Work location', type: 'text', required: true },
        { key: 'accommodationAvailable', label: 'Accommodation available?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'foodAvailable', label: 'Food available?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'transportAvailable', label: 'Transport available?', type: 'select', required: true, options: ['Yes', 'No'] },
      ],
      mason: [
        { key: 'workType', label: 'Type of work', type: 'text', required: true },
        { key: 'workersRequired', label: 'Number of workers required', type: 'number', required: true, min: 1 },
        { key: 'toolsProvided', label: 'Tools provided or not', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'workLocation', label: 'Work location', type: 'text', required: true },
        { key: 'accommodationAvailable', label: 'Accommodation available?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'foodAvailable', label: 'Food available?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'transportAvailable', label: 'Transport available?', type: 'select', required: true, options: ['Yes', 'No'] },
      ],
      crane_operator: [
        { key: 'machineryType', label: 'Machinery type', type: 'text', required: true },
        { key: 'licenseCategory', label: 'License category', type: 'text', required: true },
        { key: 'requiredExperience', label: 'Required experience', type: 'text', required: true },
        { key: 'operatorsRequired', label: 'Number of operators', type: 'number', required: true, min: 1 },
        { key: 'projectType', label: 'Project type', type: 'text', required: true },
        { key: 'shiftTiming', label: 'Shift timing', type: 'text', required: true },
        { key: 'accommodationAvailable', label: 'Accommodation available?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'foodAvailable', label: 'Food available?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'transportAvailable', label: 'Transport available?', type: 'select', required: true, options: ['Yes', 'No'] },
      ],
      site_supervisor: [
        { key: 'projectType', label: 'Project type', type: 'text', required: true },
        { key: 'qualification', label: 'Qualification', type: 'text', required: true },
        { key: 'supervisoryExperience', label: 'Supervisory experience', type: 'text', required: true },
        { key: 'workersToManage', label: 'Number of workers to manage', type: 'number', required: true, min: 1 },
        { key: 'projectDuration', label: 'Project duration', type: 'text', required: true },
        { key: 'accommodationAvailable', label: 'Accommodation available?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'foodAvailable', label: 'Food available?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'transportAvailable', label: 'Transport available?', type: 'select', required: true, options: ['Yes', 'No'] },
      ],
    },
  },
  security: {
    label: 'Security',
    subCategories: {
      retired_army: 'Retired Army',
      retired_police: 'Retired Police',
      ex_navy_air_force: 'Ex-Navy / Air Force',
    },
    fields: {
      retired_army: [
        { key: 'securityAssignment', label: 'Security assignment', type: 'text', required: true },
        { key: 'workersRequired', label: 'Number of workers required', type: 'number', required: true, min: 1 },
        { key: 'shiftTiming', label: 'Shift timing', type: 'text', required: true },
        { key: 'weaponRequirement', label: 'Weapon requirement, if applicable', type: 'text' },
        { key: 'accommodationAvailable', label: 'Accommodation', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'foodAvailable', label: 'Food', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'transportAvailable', label: 'Transport', type: 'select', required: true, options: ['Yes', 'No'] },
      ],
      retired_police: [
        { key: 'assignmentType', label: 'Assignment type', type: 'text', required: true },
        { key: 'workersRequired', label: 'Number of workers required', type: 'number', required: true, min: 1 },
        { key: 'shiftTiming', label: 'Shift timing', type: 'text', required: true },
        { key: 'accommodationAvailable', label: 'Accommodation', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'foodAvailable', label: 'Food', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'transportAvailable', label: 'Transport', type: 'select', required: true, options: ['Yes', 'No'] },
      ],
      ex_navy_air_force: [
        { key: 'serviceExpertise', label: 'Required service expertise', type: 'text', required: true },
        { key: 'assignmentType', label: 'Assignment type', type: 'text', required: true },
        { key: 'shiftTiming', label: 'Shift timing', type: 'text', required: true },
        { key: 'accommodationAvailable', label: 'Accommodation', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'foodAvailable', label: 'Food', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'transportAvailable', label: 'Transport', type: 'select', required: true, options: ['Yes', 'No'] },
      ],
    },
  },
  technical: {
    label: 'Professional / Technical',
    subCategories: { sme: 'Subject Matter Expert' },
    fields: {
      sme: [
        { key: 'expertiseArea', label: 'Expertise area', type: 'text', required: true },
        { key: 'projectType', label: 'Project type', type: 'text', required: true },
        { key: 'requiredQualification', label: 'Required qualification', type: 'text', required: true },
        { key: 'requiredExperience', label: 'Required experience', type: 'text', required: true },
        { key: 'engagementType', label: 'Engagement type', type: 'text', required: true },
        { key: 'projectDuration', label: 'Project duration', type: 'text', required: true },
        { key: 'expertsRequired', label: 'Number of experts', type: 'number', required: true, min: 1 },
        { key: 'workModePreference', label: 'Remote or on-site', type: 'text', required: true },
      ],
    },
  },
};

function getCategoryDefinition(category) {
  return CATEGORY_DEFINITIONS[category];
}

function getCategoryFields(category, subCategory) {
  return CATEGORY_DEFINITIONS[category]?.fields?.[subCategory] || [];
}

module.exports = { CATEGORY_DEFINITIONS, getCategoryDefinition, getCategoryFields };
