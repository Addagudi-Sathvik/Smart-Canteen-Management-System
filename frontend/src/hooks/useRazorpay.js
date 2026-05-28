import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { paymentsAPI } from '../utils/api';

const useRazorpay = () => {
  const [processing, setProcessing] = useState(false);

  const recordPaymentFailed = useCallback(async (orderId) => {
    try {
      await paymentsAPI.failed(orderId);
    } catch {
      /* best-effort cleanup */
    }
  }, []);

  const initiatePayment = useCallback(
    async ({ orderId, userName, userEmail, userPhone, onSuccess, onFailure }) => {
      if (!window.Razorpay) {
        toast.error('Payment gateway failed to load. Please refresh the page.');
        onFailure?.();
        return;
      }

      setProcessing(true);
      try {
        const { data } = await paymentsAPI.createOrder(orderId);

        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'CanteenHub',
          description: 'Food Order Payment',
          order_id: data.razorpayOrderId,
          prefill: {
            name: userName,
            email: userEmail,
            contact: userPhone || '',
          },
          theme: { color: '#d97706' },
          handler: async (response) => {
            try {
              const verifyRes = await paymentsAPI.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              });
              toast.success('Payment successful!');
              setProcessing(false);
              onSuccess?.(verifyRes.data?.order);
            } catch {
              toast.error('Payment verification failed.');
              setProcessing(false);
              onFailure?.();
            }
          },
          modal: {
            ondismiss: async () => {
              toast.error('Payment cancelled.');
              await recordPaymentFailed(orderId);
              setProcessing(false);
              onFailure?.();
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async () => {
          await recordPaymentFailed(orderId);
          toast.error('Payment failed. Please try again.');
          setProcessing(false);
          onFailure?.();
        });

        rzp.open();
      } catch (error) {
        const message =
          error.response?.data?.message || 'Could not initiate payment.';
        toast.error(message);
        setProcessing(false);
        onFailure?.();
      }
    },
    [recordPaymentFailed]
  );

  return { initiatePayment, processing };
};

export default useRazorpay;
