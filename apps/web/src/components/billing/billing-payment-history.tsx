import { useTranslate } from '@refinedev/core';
import type { PaymentHistoryItemFragmentFragment, PaymentStatus } from '@/generated/graphql';

interface BillingPaymentHistoryProps {
  payments: PaymentHistoryItemFragmentFragment[];
}

export function BillingPaymentHistory({ payments }: BillingPaymentHistoryProps) {
  const translate = useTranslate();

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      case 'REFUNDED':
        return 'text-gray-600 bg-gray-100';
      case 'PARTIALLY_REFUNDED':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getMethodLabel = (method: string) => {
    return translate(`billing.paymentMethod.${method.toLowerCase()}`);
  };

  if (payments.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        {translate('billing.paymentHistory.noPayments')}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">{translate('billing.paymentHistory.title')}</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translate('billing.paymentHistory.date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translate('billing.paymentHistory.description')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translate('billing.paymentHistory.amount')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translate('billing.paymentHistory.method')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translate('billing.paymentHistory.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translate('billing.paymentHistory.invoice')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {payment.description || translate('billing.paymentHistory.subscriptionPayment')}
                  {payment.refundedAt && (
                    <span className="block text-xs text-gray-500">
                      {translate('billing.paymentHistory.refundedOn', {
                        date: new Date(payment.refundedAt).toLocaleDateString(),
                      })}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {payment.currency} ${payment.amount}
                  {payment.refundAmount && (
                    <span className="block text-xs text-red-600">
                      {translate('billing.paymentHistory.refundAmount', {
                        amount: payment.refundAmount,
                      })}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getMethodLabel(payment.method)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}
                  >
                    {translate(`billing.paymentStatus.${payment.status.toLowerCase()}`)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payment.invoiceId ? (
                    <a
                      href={`/invoices/${payment.invoiceId}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {translate('billing.paymentHistory.viewInvoice')}
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
