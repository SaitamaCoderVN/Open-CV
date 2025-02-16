type SpacerProps = {
  className?: string; // Accept className for Tailwind CSS
};

const Spacer: React.FC<SpacerProps> = ({ className }) => (
  <div className={`${className}`} />
);

export default Spacer;