import CrudPage from '../components/CrudPage';

const STATUS_OPTIONS = ['Active', 'In Maintenance', 'Out of Service', 'Retired'];

const columns = [
  { key: 'buggy_id', label: 'Buggy ID' },
  { key: 'vehicle_type', label: 'Vehicle Type' },
  { key: 'make_model', label: 'Make / Model' },
  { key: 'property_zone', label: 'Property / Zone' },
  { key: 'assigned_area', label: 'Assigned Area' },
  { key: 'status', label: 'Status' },
  { key: 'last_service_date', label: 'Last Service' },
  { key: 'next_service_due', label: 'Next Service Due' },
];

const fields = [
  { key: 'buggy_id', label: 'Buggy ID', required: true },
  { key: 'vehicle_type', label: 'Vehicle Type' },
  { key: 'make_model', label: 'Make / Model' },
  { key: 'property_zone', label: 'Property / Zone' },
  { key: 'assigned_area', label: 'Assigned Area' },
  { key: 'registration_no', label: 'Registration / Asset No.' },
  { key: 'serial_number', label: 'Serial Number (Chassis / VIN)' },
  { key: 'year_in_service', label: 'Year in Service' },
  { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS, required: true },
  { key: 'last_service_date', label: 'Last Service Date', type: 'date' },
  { key: 'next_service_due', label: 'Next Service Due', type: 'date' },
  { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
];

export default function Fleet() {
  return (
    <CrudPage
      title="Fleet Register"
      description="Master list of every buggy / golf cart across the property."
      moduleName="fleet"
      apiPath="/fleet"
      columns={columns}
      fields={fields}
    />
  );
}
