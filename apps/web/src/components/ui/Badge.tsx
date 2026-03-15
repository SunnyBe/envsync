type Variant = 'blue' | 'yellow' | 'green' | 'gray';

interface Props {
  children: string;
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  blue: 'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  green: 'bg-green-100 text-green-800',
  gray: 'bg-gray-100 text-gray-700',
};

export function Badge({ children, variant = 'gray' }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
