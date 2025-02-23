export default function Button({ children, variant = "default", ...props }) {
  const baseStyle = "px-4 py-2 rounded-md transition";
  const styles = {
    default: "bg-blue-500 text-white hover:bg-blue-600",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-100"
  };

  return (
    <button className={`${baseStyle} ${styles[variant]}`} {...props}>
      {children}
    </button>
  );
}
