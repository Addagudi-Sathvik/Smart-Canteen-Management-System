const Input = ({ icon: Icon, className = '', ...props }) => (
  <div className="relative">
    {Icon && (
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-espresso-400 pointer-events-none" />
    )}
    <input className={`input-field ${Icon ? 'pl-11' : ''} ${className}`} {...props} />
  </div>
);

export default Input;
