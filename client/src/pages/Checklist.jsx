import CrudPage from '../components/CrudPage';
import useBuggyIds from '../hooks/useBuggyIds';

const RESULT_OPTIONS = ['Fit for Use', 'Not Fit for Use'];
const SHIFT_OPTIONS = ['AM', 'PM', 'Night'];

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'buggy_id', label: 'Buggy ID' },
  { key: 'shift', label: 'Shift' },
  { key: 'inspected_by', label: 'Inspected By' },
  { key: 'overall_result', label: 'Overall Result' },
  { key: 'defects_remarks', label: 'Defects / Remarks' },
];

export default function Checklist() {
  const buggyIds = useBuggyIds();
  const fields = [
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'buggy_id', label: 'Buggy ID', type: buggyIds.length ? 'select' : 'text', options: buggyIds, required: true },
    { key: 'shift', label: 'Shift', type: 'select', options: SHIFT_OPTIONS },
    { key: 'inspected_by', label: 'Inspected By (Driver/Attendant)', required: true },
    { key: 'overall_result', label: 'Overall Result', type: 'select', options: RESULT_OPTIONS, required: true },
    { key: 'defects_remarks', label: 'Defects / Remarks', type: 'textarea', wide: true },
  ];

  return (
    <CrudPage
      title="Daily Pre-Use Checklist"
      description="Confirm the buggy is fit before it leaves base."
      moduleName="checklist"
      apiPath="/checklist"
      columns={columns}
      fields={fields}
    />
  );
}
