export default function Select({ label, children, ...props }) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">{label}</label>
        <select className="border rounded-md p-2" {...props}>
          {children}
        </select>
      </div>
    );
  }
  