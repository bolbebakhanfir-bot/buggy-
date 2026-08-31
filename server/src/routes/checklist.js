const { createCrudRouter } = require('./crudFactory');

module.exports = createCrudRouter({
  table: 'checklists',
  moduleName: 'checklist',
  labelField: 'buggy_id',
  orderBy: 'date DESC, id DESC',
  hasCreatedBy: true,
  fields: ['date', 'buggy_id', 'shift', 'inspected_by', 'overall_result', 'defects_remarks'],
});
