const { createCrudRouter } = require('./crudFactory');

module.exports = createCrudRouter({
  table: 'buggies',
  moduleName: 'fleet',
  labelField: 'buggy_id',
  orderBy: 'buggy_id ASC',
  fields: [
    'buggy_id', 'vehicle_type', 'make_model', 'property_zone', 'assigned_area',
    'registration_no', 'serial_number', 'year_in_service', 'status',
    'last_service_date', 'next_service_due', 'notes',
  ],
});
