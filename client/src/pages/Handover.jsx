import CrudPage from '../components/CrudPage';
import useBuggyIds from '../hooks/useBuggyIds';

const MOVEMENT_OPTIONS = ['Check-Out', 'Check-In'];
const YES_NO = ['Yes', 'No'];

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'buggy_id', label: 'Buggy ID' },
  { key: 'movement_type', label: 'Movement' },
  { key: 'security_officer', label: 'Security Officer' },
  { key: 'handover_point', label: 'Handover Point' },
  { key: 'driver_taking', label: 'Driver Taking' },
  { key: 'driver_returning', label: 'Driver Returning' },
  { key: 'damage_noted', label: 'Damage?' },
];

export default function Handover() {
  const buggyIds = useBuggyIds();
  const fields = [
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'time', label: 'Time', type: 'time', required: true },
    { key: 'buggy_id', label: 'Buggy ID', type: buggyIds.length ? 'select' : 'text', options: buggyIds, required: true },
    { key: 'movement_type', label: 'Movement Type', type: 'select', options: MOVEMENT_OPTIONS, required: true },
    { key: 'security_officer', label: 'Security Officer', required: true },
    { key: 'handover_point', label: 'Handover / Return Point' },
    { key: 'other_location', label: 'Other Location (if not Hotel Basement Car Parking)' },
    { key: 'driver_taking', label: 'Driver Taking Buggy' },
    { key: 'driver_staff_id', label: 'Driver Staff ID' },
    { key: 'driver_returning', label: 'Driver Returning Buggy' },
    { key: 'battery_fuel_level', label: 'Battery / Fuel Level (%)' },
    { key: 'odometer_reading', label: 'Odometer / Hour-Meter Reading' },
    { key: 'damage_noted', label: 'Damage / Defect Noted?', type: 'select', options: YES_NO },
    { key: 'damage_description', label: 'Damage / Defect Description', type: 'textarea', wide: true },
    { key: 'damage_photo_link', label: 'Damage Photo Link' },
    { key: 'cleanliness_ok', label: 'Cleanliness OK?', type: 'select', options: YES_NO },
    { key: 'keys_accessories_complete', label: 'Keys & Accessories Complete?', type: 'select', options: YES_NO },
    { key: 'remarks', label: 'Additional Remarks', type: 'textarea', wide: true },
  ];

  return (
    <CrudPage
      title="Handover / Takeover Log"
      description="One row per buggy movement, logged at the Hotel Basement Car Parking."
      moduleName="handover"
      apiPath="/handover"
      columns={columns}
      fields={fields}
    />
  );
}
