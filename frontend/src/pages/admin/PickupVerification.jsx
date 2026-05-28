import PageHeader from '../../components/ui/PageHeader';
import PickupVerificationPanel from '../../components/pickup/PickupVerificationPanel';

const PickupVerification = () => (
  <div className="space-y-6">
    <PageHeader
      title="Pickup verification"
      subtitle="Scan or lookup student QR codes to mark orders as collected"
    />
    <PickupVerificationPanel />
  </div>
);

export default PickupVerification;
