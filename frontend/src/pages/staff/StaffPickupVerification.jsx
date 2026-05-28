import PageHeader from '../../components/ui/PageHeader';
import PickupVerificationPanel from '../../components/pickup/PickupVerificationPanel';

const StaffPickupVerification = () => (
  <div className="space-y-6">
    <PageHeader
      title="Pickup verification"
      subtitle="Scan student QR at the counter"
    />
    <PickupVerificationPanel />
  </div>
);

export default StaffPickupVerification;
