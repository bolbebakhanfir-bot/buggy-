const { createCrudRouter } = require('./crudFactory');

module.exports = createCrudRouter({
  table: 'maintenance_schedule',
  moduleName: 'maintenance',
  labelField: 'buggy_id',
  orderBy: 'buggy_id ASC',
  fields: [
    'buggy_id', 'serial_number', 'vehicle_type', 'property_zone', 'service_interval',
    'last_service_date', 'last_service_odometer', 'next_service_due_date',
    'next_service_due_odometer', 'maintenance_status', 'assigned_technician', 'notes',
  ],
});
