export default function Input({ label, ...props }) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">{label}</label>
        <input className="border rounded-md p-2" {...props} />
      </div>
    );
  }
  