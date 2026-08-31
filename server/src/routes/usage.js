const { createCrudRouter } = require('./crudFactory');

module.exports = createCrudRouter({
  table: 'usage_logs',
  moduleName: 'usage',
  labelField: 'buggy_id',
  orderBy: 'date DESC, id DESC',
  hasCreatedBy: true,
  fields: ['date', 'buggy_id', 'driver_name', 'time_out', 'time_in', 'total_time_hrs', 'notes'],
});
