import { useState } from 'react';
import { useTranslate, useCustomMutation } from '@refinedev/core';

interface BillingSubscriptionProps {
  billingInfo: {
    subscriptionId: string;
    planTier: string;
    planName: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    daysRemaining: number;
    cancelAtPeriodEnd: boolean;
    usage: string;
    nextBillingAmount: string | null;
  };
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function BillingSubscription({ billingInfo, onSuccess, onError }: BillingSubscriptionProps) {
  const translate = useTranslate();
  const [isCancelling, setIsCancelling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  const { mutate: cancelSubscription } = useCustomMutation();

  const { mutate: resumeSubscription } = useCustomMutation();

  const handleCancel = async () => {
    if (!confirm(translate('billing.cancelConfirmation'))) {
      return;
    }

    setIsCancelling(true);
    try {
      await cancelSubscription({
        url: '',
        method: 'post',
        values: {
          immediately: false,
        },
      });
      onSuccess(translate('billing.cancelSuccess'));
    } catch (error) {
      onError(translate('billing.cancelError'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleResume = async () => {
    setIsResuming(true);
    try {
      await resumeSubscription({
        url: '',
        method: 'post',
        values: {},
      });
      onSuccess(translate('billing.resumeSuccess'));
    } catch (error) {
      onError(translate('billing.resumeError'));
    } finally {
      setIsResuming(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100';
      case 'TRIALING':
        return 'text-blue-600 bg-blue-100';
      case 'PAST_DUE':
        return 'text-yellow-600 bg-yellow-100';
      case 'CANCELED':
      case 'EXPIRED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const parseUsage = () => {
    try {
      return JSON.parse(billingInfo.usage);
    } catch {
      return {};
    }
  };

  const usage = parseUsage();

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">{translate('billing.subscription.title')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Plan Info */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {translate('billing.subscription.currentPlan')}
          </h3>
          <p className="text-2xl font-bold">{billingInfo.planName}</p>
          <div
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(billingInfo.status)}`}
          >
            {translate(`billing.status.${billingInfo.status.toLowerCase()}`)}
          </div>
          {billingInfo.cancelAtPeriodEnd && (
            <p className="text-sm text-red-600 mt-2">
              {translate('billing.subscription.willCancel')}
            </p>
          )}
        </div>

        {/* Billing Period */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            {translate('billing.subscription.billingPeriod')}
          </h3>
          <p className="text-lg font-semibold">
            {new Date(billingInfo.currentPeriodStart).toLocaleDateString()} -{' '}
            {new Date(billingInfo.currentPeriodEnd).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {translate('billing.subscription.daysRemaining', { days: billingInfo.daysRemaining })}
          </p>
          {billingInfo.nextBillingAmount && !billingInfo.cancelAtPeriodEnd && (
            <p className="text-sm font-medium mt-2">
              {translate('billing.subscription.nextBilling', {
                amount: billingInfo.nextBillingAmount,
              })}
            </p>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      {Object.keys(usage).length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">{translate('billing.subscription.usage')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(usage).map(([key, value]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 capitalize">{key}</p>
                <p className="text-2xl font-bold">{value as number}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4">
        {!billingInfo.cancelAtPeriodEnd ? (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling
              ? translate('billing.subscription.cancelling')
              : translate('billing.subscription.cancelPlan')}
          </button>
        ) : (
          <button
            onClick={handleResume}
            disabled={isResuming}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResuming
              ? translate('billing.subscription.resuming')
              : translate('billing.subscription.resumePlan')}
          </button>
        )}
      </div>
    </div>
  );
}
