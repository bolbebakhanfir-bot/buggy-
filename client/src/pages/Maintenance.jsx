import CrudPage from '../components/CrudPage';
import useBuggyIds from '../hooks/useBuggyIds';

const STATUS_OPTIONS = ['OK', 'Due Soon', 'Overdue', 'Not Scheduled'];

const columns = [
  { key: 'buggy_id', label: 'Buggy ID' },
  { key: 'vehicle_type', label: 'Vehicle Type' },
  { key: 'service_interval', label: 'Service Interval' },
  { key: 'last_service_date', label: 'Last Service' },
  { key: 'next_service_due_date', label: 'Next Service Due' },
  { key: 'maintenance_status', label: 'Status' },
  { key: 'assigned_technician', label: 'Technician / Workshop' },
];

export default function Maintenance() {
  const buggyIds = useBuggyIds();
  const fields = [
    { key: 'buggy_id', label: 'Buggy ID', type: buggyIds.length ? 'select' : 'text', options: buggyIds, required: true },
    { key: 'serial_number', label: 'Serial Number (Chassis / VIN)' },
    { key: 'vehicle_type', label: 'Vehicle Type' },
    { key: 'property_zone', label: 'Property / Zone' },
    { key: 'service_interval', label: 'Service Interval' },
    { key: 'last_service_date', label: 'Last Service Date', type: 'date' },
    { key: 'last_service_odometer', label: 'Last Service Odometer / Hours' },
    { key: 'next_service_due_date', label: 'Next Service Due Date', type: 'date', required: true },
    { key: 'next_service_due_odometer', label: 'Next Service Due Odometer / Hours' },
    { key: 'maintenance_status', label: 'Maintenance Status', type: 'select', options: STATUS_OPTIONS, required: true },
    { key: 'assigned_technician', label: 'Assigned Technician / Workshop' },
    { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
  ];

  return (
    <CrudPage
      title="Preventive Maintenance Schedule"
      description="Routine scheduled servicing — separate from the reactive Defects & Maintenance log."
      moduleName="maintenance"
      apiPath="/maintenance"
      columns={columns}
      fields={fields}
    />
  );
}
