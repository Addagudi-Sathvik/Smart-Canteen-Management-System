import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const useRazorpay = () => {
  const [processing, setProcessing] = useState(false);

  const initiatePayment = async ({ orderId, amount, userName, userEmail, userPhone, onSuccess, onFailure }) => {
    setProcessing(true);
    try {
      // Step 1 — Create Razorpay order from backend
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        '/api/payments/create-order',
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 2 — Open Razorpay popup
      const options = {
        key:       data.keyId,
        amount:    data.amount,
        currency:  data.currency,
        name:      'Smart Canteen',
        description: 'Food Order Payment',
        order_id:  data.razorpayOrderId,
        prefill: {
          name:  userName,
          email: userEmail,
          contact: userPhone || '',
        },
        theme: { color: '#d97706' }, // your brand amber color
        handler: async (response) => {
          // Step 3 — Verify payment on backend
          try {
            await axios.post(
              '/api/payments/verify',
              {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                orderId,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Payment successful!');
            onSuccess?.();
          } catch {
            toast.error('Payment verification failed.');
            onFailure?.();
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled.');
            setProcessing(false);
            onFailure?.();
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async () => {
        await axios.post(
          '/api/payments/failed',
          { orderId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.error('Payment failed. Please try again.');
        onFailure?.();
      });

      rzp.open();
    } catch (error) {
      toast.error('Could not initiate payment.');
    } finally {
      setProcessing(false);
    }
  };

  return { initiatePayment, processing };
};

export default useRazorpay;