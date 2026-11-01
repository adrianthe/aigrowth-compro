import { useEffect, useRef } from 'react';

// Repeatable rows (benefits, modules, FAQ) with add, remove and reorder
export default function RowsEditor({ rows, onChange, fields, makeRow, addLabel, emptyText, numbered = false }) {
  const listRef = useRef(null);
  const focusNewRow = useRef(false);

  // Focus the first field of a freshly added row once it has rendered
  useEffect(() => {
    if (!focusNewRow.current) return;
    focusNewRow.current = false;
    const newRows = listRef.current?.querySelectorAll('.adm-row [data-first]');
    newRows?.[newRows.length - 1]?.focus();
  }, [rows.length]);

  const update = (index, field, value) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const move = (index, step) => {
    const target = index + step;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index) => onChange(rows.filter((_, i) => i !== index));

  const add = () => {
    focusNewRow.current = true;
    onChange([...rows, makeRow()]);
  };

  return (
    <div className="adm-rows" ref={listRef}>
      {rows.length === 0 && <p className="adm-rows-empty">{emptyText}</p>}
      {rows.map((row, index) => (
        <div className="adm-row" key={row.key}>
          <span className="adm-row-num">{numbered ? String(index + 1).padStart(2, '0') : '•'}</span>
          <div className="adm-row-fields">
            {fields.map((field, fieldIndex) => {
              const props = {
                className: 'adm-input',
                value: row[field.name],
                placeholder: field.placeholder,
                'aria-label': `${field.label} ${index + 1}`,
                onChange: (event) => update(index, field.name, event.target.value),
                ...(fieldIndex === 0 ? { 'data-first': true } : {}),
              };
              return field.multiline
                ? <textarea key={field.name} rows={2} {...props} />
                : <input key={field.name} type="text" {...props} />;
            })}
          </div>
          <div className="adm-row-tools">
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Naikkan" title="Naikkan">↑</button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === rows.length - 1} aria-label="Turunkan" title="Turunkan">↓</button>
            <button type="button" className="is-danger" onClick={() => remove(index)} aria-label="Hapus baris" title="Hapus">×</button>
          </div>
        </div>
      ))}
      <button type="button" className="adm-add-row" onClick={add}>+ {addLabel}</button>
    </div>
  );
}
