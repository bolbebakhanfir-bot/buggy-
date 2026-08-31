import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Fetches the fleet's buggy IDs once, so data-entry forms across modules can
// offer a dropdown instead of free text (avoids typos like "b-1" vs "B-01").
export default function useBuggyIds() {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    api
      .get('/fleet')
      .then((rows) => setIds(rows.map((r) => r.buggy_id)))
      .catch(() => setIds([]));
  }, []);

  return ids;
}
