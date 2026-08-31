import CrudPage from '../components/CrudPage';

const YES_NO = ['Yes', 'No'];
const CERT_STATUS = ['Certified', 'Expiring Soon', 'Expired', 'Not Certified'];

const columns = [
  { key: 'driver_name', label: 'Driver Name' },
  { key: 'staff_id', label: 'Staff ID' },
  { key: 'department', label: 'Department' },
  { key: 'license_expiry', label: 'License Expiry' },
  { key: 'certification_status', label: 'Certification Status' },
  { key: 'refresher_due', label: 'Refresher Due' },
];

const fields = [
  { key: 'driver_name', label: 'Driver Name', required: true },
  { key: 'staff_id', label: 'Staff ID' },
  { key: 'department', label: 'Department' },
  { key: 'property', label: 'Property' },
  { key: 'position_role', label: 'Position / Role' },
  { key: 'license_type', label: 'Driving License Type' },
  { key: 'license_number', label: 'License Number' },
  { key: 'license_expiry', label: 'License Expiry Date', type: 'date' },
  { key: 'induction_completed', label: 'Buggy Induction Completed?', type: 'select', options: YES_NO },
  { key: 'induction_date', label: 'Induction / Training Date', type: 'date' },
  { key: 'refresher_due', label: 'Refresher Training Due', type: 'date' },
  { key: 'certification_status', label: 'Certification Status', type: 'select', options: CERT_STATUS, required: true },
  { key: 'certified_by', label: 'Certified / Trained By' },
  { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
];

export default function Drivers() {
  return (
    <CrudPage
      title="Driver Certification & Training"
      description="Only drivers listed here as Certified may scan a QR code and collect a buggy."
      moduleName="drivers"
      apiPath="/drivers"
      columns={columns}
      fields={fields}
    />
  );
}
