import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pageTransition } from './motion';

const PageTransition = ({ children }) => {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
