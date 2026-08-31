const { createCrudRouter } = require('./crudFactory');

module.exports = createCrudRouter({
  table: 'drivers',
  moduleName: 'drivers',
  labelField: 'driver_name',
  orderBy: 'driver_name ASC',
  fields: [
    'driver_name', 'staff_id', 'department', 'property', 'position_role', 'license_type',
    'license_number', 'license_expiry', 'induction_completed', 'induction_date',
    'refresher_due', 'certification_status', 'certified_by', 'notes',
  ],
});
