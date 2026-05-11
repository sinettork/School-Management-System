export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (!data || data.length === 0) return;

  const getHeaders = () => {
    if (columns) {
      return columns.map((col) => col.label).join(',');
    }
    return Object.keys(data[0]).join(',');
  };

  const getRows = () => {
    return data.map((row) => {
      if (columns) {
        return columns
          .map((col) => {
            const val = row[col.key];
            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
          })
          .join(',');
      }
      return Object.values(row)
        .map((val) => {
          return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
        })
        .join(',');
    });
  };

  const csvContent = [getHeaders(), ...getRows()].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
