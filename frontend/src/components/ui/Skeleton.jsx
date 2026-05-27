import { motion } from 'framer-motion';

const Skeleton = ({ className = '', variant = 'text' }) => {
  const variants = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-48 w-full rounded-2xl',
    button: 'h-11 w-24 rounded-xl',
    badge: 'h-6 w-16 rounded-full',
    image: 'h-36 w-full rounded-xl',
  };

  return (
    <div className={`skeleton ${variants[variant] || variants.text} ${className}`} />
  );
};

export const CardSkeleton = () => (
  <div className="glass rounded-2xl overflow-hidden">
    <Skeleton variant="image" className="rounded-none h-36" />
    <div className="p-4 space-y-3">
      <Skeleton variant="title" />
      <Skeleton variant="text" />
      <Skeleton variant="text" className="w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton variant="badge" />
        <Skeleton variant="button" />
      </div>
    </div>
  </div>
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass rounded-2xl p-4 flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="title" />
          <Skeleton variant="text" className="w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="glass rounded-2xl p-5 space-y-3">
        <Skeleton variant="text" className="w-1/2" />
        <Skeleton variant="title" className="w-3/4 h-8" />
      </div>
    ))}
  </div>
);

export default Skeleton;
