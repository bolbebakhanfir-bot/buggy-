import CrudPage from '../components/CrudPage';
import useBuggyIds from '../hooks/useBuggyIds';

const columns = [
  { key: 'date', label: 'Date' },
  { key: 'buggy_id', label: 'Buggy ID' },
  { key: 'driver_name', label: 'Driver Name' },
  { key: 'time_out', label: 'Time Out' },
  { key: 'time_in', label: 'Time In' },
  { key: 'total_time_hrs', label: 'Total Time (Hrs)' },
  { key: 'notes', label: 'Notes' },
];

export default function Usage() {
  const buggyIds = useBuggyIds();
  const fields = [
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'buggy_id', label: 'Buggy ID', type: buggyIds.length ? 'select' : 'text', options: buggyIds, required: true },
    { key: 'driver_name', label: 'Driver Name', required: true },
    { key: 'time_out', label: 'Time Out', type: 'time' },
    { key: 'time_in', label: 'Time In', type: 'time' },
    { key: 'total_time_hrs', label: 'Total Time (Hrs)', type: 'number' },
    { key: 'notes', label: 'Notes', type: 'textarea', wide: true },
  ];

  return (
    <CrudPage
      title="Driver Usage Log"
      description="Driver, time out and time in for every buggy collection."
      moduleName="usage"
      apiPath="/usage"
      columns={columns}
      fields={fields}
    />
  );
}
