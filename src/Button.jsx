import React from "react";

export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
