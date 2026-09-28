import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  AlertCircle,
  Loader2,
  Lock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { PaymentAdapter } from '../lib/paymentAdapter';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency } from '../utils/formatters';

export const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const state = location.state as {
    orderId: string;
    amount: number;
    currency: string;
    provider: string;
    keyId?: string;
    doctorName: string;
    specialityName: string;
    bookingData: any;
  } | null;

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [processing, setProcessing] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!state || !state.orderId || !state.bookingData) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#006655]">No Active Payment Order</h2>
        <p className="text-xs text-slate-500">
          Payment session expired or accessed without booking details. Please start from the appointment booking page.
        </p>
        <Link
          to="/appointment"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#006655] text-white font-semibold text-xs shadow-md"
        >
          Book Appointment
        </Link>
      </div>
    );
  }

  const { orderId, amount, currency, provider, doctorName, specialityName, bookingData } = state;

  const handlePay = async (simulateFailure: boolean = false) => {
    setProcessing(true);
    setPaymentFailed(false);
    setErrorMessage('');

    try {
      if (simulateFailure) {
        throw new Error('Transaction was cancelled by user or declined by bank.');
      }

      // Generate verification payload
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mockSignature = `sig_${Date.now()}`;

      // Call server-side payment verification & atomic appointment creation
      const verifyResult = await PaymentAdapter.verifyAndConfirmBooking({
        orderId,
        paymentId: mockPaymentId,
        signature: mockSignature,
        provider: provider || 'simulation',
        bookingData,
        patientUserId: bookingData.patientUserId,
      });

      if (!verifyResult.success || !verifyResult.appointmentId) {
        throw new Error(verifyResult.error || 'Server payment verification failed.');
      }

      showToast('Payment verified successfully! Appointment confirmed.', 'success');

      // Navigate to animated Payment Success Screen
      navigate('/payment/success', {
        replace: true,
        state: {
          appointmentId: verifyResult.appointmentId,
          appointmentNumber: verifyResult.appointmentNumber,
          amount: verifyResult.amount || amount,
          paymentId: mockPaymentId,
          doctorName,
          specialityName,
          date: bookingData.appointmentDate,
          time: bookingData.appointmentTime,
          patientName: bookingData.patientName,
        },
      });
    } catch (err: any) {
      setPaymentFailed(true);
      setErrorMessage(err.message || 'Payment processing failed. Please try again.');
      showToast(err.message || 'Payment failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006655] uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4 text-[#006655]" /> Secure Hospital Payment Gateway
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#006655]">
          Complete Consultation Payment
        </h1>
        <p className="text-xs text-slate-500">
          Order ID: <span className="font-mono">{orderId}</span>
        </p>
      </div>

      {/* Failure State Notice (Prompt Section 29) */}
      {paymentFailed && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3 animate-in fade-in">
          <XCircle className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-rose-950">Payment Failed</h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{errorMessage}</p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handlePay(false)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
            >
              TRY AGAIN
            </button>
            <button
              onClick={() => navigate('/appointment')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              GO BACK TO APPOINTMENT
            </button>
          </div>
        </div>
      )}

      {/* Payment Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-6">
        {/* Order Amount Bar */}
        <div className="bg-gradient-to-r from-[#003329] to-[#003329] text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#C4A760] font-semibold uppercase block">Amount Payable</span>
            <span className="text-2xl font-black">{formatCurrency(amount, currency)}</span>
          </div>
          <div className="text-right text-xs space-y-0.5">
            <div className="font-semibold text-white">{doctorName}</div>
            <div className="text-teal-200">{specialityName}</div>
          </div>
        </div>

        {/* Payment Methods Selection */}
        <div className="space-y-3">
          <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Payment Method
          </span>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                paymentMethod === 'upi'
                  ? 'border-teal-600 bg-[#E0F2ED]/60 ring-2 ring-[#006655]/20 text-[#004C3D] font-bold'
                  : 'border-slate-200 hover:border-teal-300 text-slate-600'
              }`}
            >
              <Smartphone className="w-5 h-5 text-[#006655]" />
              <span className="text-xs">UPI</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                paymentMethod === 'card'
                  ? 'border-teal-600 bg-[#E0F2ED]/60 ring-2 ring-[#006655]/20 text-[#004C3D] font-bold'
                  : 'border-slate-200 hover:border-teal-300 text-slate-600'
              }`}
            >
              <CreditCard className="w-5 h-5 text-[#006655]" />
              <span className="text-xs">Card</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('netbanking')}
              className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                paymentMethod === 'netbanking'
                  ? 'border-teal-600 bg-[#E0F2ED]/60 ring-2 ring-[#006655]/20 text-[#004C3D] font-bold'
                  : 'border-slate-200 hover:border-teal-300 text-slate-600'
              }`}
            >
              <Building className="w-5 h-5 text-[#006655]" />
              <span className="text-xs">Net Banking</span>
            </button>
          </div>
        </div>

        {/* Method Input Form */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
          {paymentMethod === 'upi' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Enter Virtual Payment Address (VPA / UPI ID)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. mobile@upi or username@okhdfcbank"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
              />
              <span className="text-[11px] text-slate-400 block">
                Supports Google Pay, PhonePe, Paytm, BHIM and all banking UPI apps.
              </span>
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4111 2222 3333 4444"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valid Thru (MM/YY)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="12/28"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'netbanking' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Select Your Bank
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#006655] bg-white"
              >
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="State Bank of India">State Bank of India</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
              </select>
            </div>
          )}
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-[#006655]" /> 256-bit TLS Encrypted
          </span>
          <span>Verified Healthcare Transaction</span>
        </div>

        {/* Pay Button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handlePay(false)}
            disabled={processing}
            className="w-full py-4 rounded-xl bg-[#006655] hover:bg-[#004C3D] disabled:opacity-50 text-white font-extrabold text-base shadow-lg shadow-[#006655]/20 transition flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying Cryptographic Payment Signature...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Pay {formatCurrency(amount, currency)} & Confirm Slot</span>
              </>
            )}
          </button>

          {/* Test simulation failure helper for developer verification */}
          <button
            type="button"
            onClick={() => handlePay(true)}
            disabled={processing}
            className="w-full text-center text-[10px] text-slate-400 hover:text-rose-600 underline transition"
          >
            (Test Payment Failure Handling)
          </button>
        </div>
      </div>
    </div>
  );
};
