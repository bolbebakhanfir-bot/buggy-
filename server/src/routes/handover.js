const { createCrudRouter } = require('./crudFactory');

module.exports = createCrudRouter({
  table: 'handovers',
  moduleName: 'handover',
  labelField: 'buggy_id',
  orderBy: 'date DESC, id DESC',
  hasCreatedBy: true,
  fields: [
    'date', 'time', 'buggy_id', 'movement_type', 'security_officer', 'handover_point',
    'other_location', 'driver_taking', 'driver_staff_id', 'driver_returning',
    'battery_fuel_level', 'odometer_reading', 'damage_noted', 'damage_description',
    'damage_photo_link', 'cleanliness_ok', 'keys_accessories_complete', 'remarks',
  ],
});
