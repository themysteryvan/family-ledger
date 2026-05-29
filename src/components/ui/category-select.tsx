"use client";

import { useState } from "react";

const SENTINEL = "__custom__";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  // Pass inline styles so both the form modal and the import table row can style it
  selectStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

function isKnown(value: string, options: Option[]) {
  return options.some((o) => o.value === value);
}

export function CategorySelect({ value, options, onChange, selectStyle, inputStyle }: Props) {
  const [customText, setCustomText] = useState(() =>
    isKnown(value, options) ? "" : value
  );
  const showCustom = !isKnown(value, options) || value === SENTINEL;

  function onSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === SENTINEL) {
      // Switch to custom — keep existing custom text if any
      onChange(customText || "");
    } else {
      setCustomText("");
      onChange(val);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    setCustomText(text);
    onChange(text);
  }

  const selectValue = showCustom ? SENTINEL : value;

  const baseSelectStyle: React.CSSProperties = {
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    padding: "0.375rem 0.5rem",
    fontSize: "0.75rem",
    outline: "none",
    width: "100%",
    ...selectStyle,
  };

  const baseInputStyle: React.CSSProperties = {
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    border: "1px solid var(--accent-blue)",
    borderRadius: "0.5rem",
    padding: "0.375rem 0.5rem",
    fontSize: "0.75rem",
    outline: "none",
    width: "100%",
    marginTop: "0.375rem",
    ...inputStyle,
  };

  return (
    <div>
      <select value={selectValue} onChange={onSelectChange} style={baseSelectStyle}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
        <option value={SENTINEL}>Other / Custom…</option>
      </select>

      {showCustom && (
        <input
          type="text"
          value={customText}
          onChange={onInputChange}
          placeholder="Type a category name…"
          autoFocus
          style={baseInputStyle}
        />
      )}
    </div>
  );
}
