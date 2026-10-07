"use client";

import { Trash2 } from "lucide-react";

export default function DeleteButton({
  action, id, message = "Delete this item? This cannot be undone.",
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
  message?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn btn-ghost btn-danger" title="Delete" aria-label="Delete">
        <Trash2 size={15} />
      </button>
    </form>
  );
}
