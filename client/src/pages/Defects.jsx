import CrudPage from '../components/CrudPage';
import useBuggyIds from '../hooks/useBuggyIds';

const SEVERITY_OPTIONS = ['Minor', 'Moderate', 'Major', 'Critical'];
const STATUS_OPTIONS = ['Open', 'In Progress', 'Closed'];

const columns = [
  { key: 'defect_code', label: 'Defect ID' },
  { key: 'date_reported', label: 'Date Reported' },
  { key: 'buggy_id', label: 'Buggy ID' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'description', label: 'Description' },
  { key: 'assigned_to', label: 'Assigned To' },
];

export default function Defects() {
  const buggyIds = useBuggyIds();
  const fields = [
    { key: 'date_reported', label: 'Date Reported', type: 'date', required: true },
    { key: 'buggy_id', label: 'Buggy ID', type: buggyIds.length ? 'select' : 'text', options: buggyIds, required: true },
    { key: 'source', label: 'Source' },
    { key: 'description', label: 'Defect Description', type: 'textarea', wide: true, required: true },
    { key: 'severity', label: 'Severity', type: 'select', options: SEVERITY_OPTIONS, required: true },
    { key: 'reported_by', label: 'Reported By' },
    { key: 'action_taken', label: 'Action Taken', type: 'textarea', wide: true },
    { key: 'assigned_to', label: 'Assigned To' },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS, required: true },
    { key: 'actual_close_date', label: 'Actual Close Date', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
  ];

  return (
    <CrudPage
      title="Defects & Maintenance Tracker"
      description="Severity scale matches the HSE Incident Report taxonomy."
      moduleName="defects"
      apiPath="/defects"
      columns={columns}
      fields={fields}
    />
  );
}
