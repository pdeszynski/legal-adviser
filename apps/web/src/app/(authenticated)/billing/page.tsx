'use client';

import { useState } from 'react';
import { useTranslate, useNotification } from '@refinedev/core';
import { useMyBillingInfoQuery } from '@/generated/graphql';
import { BillingSubscription } from '@/components/billing/billing-subscription';
import { BillingPaymentHistory } from '@/components/billing/billing-payment-history';
import { BillingPlanChange } from '@/components/billing/billing-plan-change';
import { BillingPaymentMethods } from '@/components/billing/billing-payment-methods';
import { BillingSkeleton } from '@/components/skeleton/BillingSkeleton';

type BillingTab = 'subscription' | 'paymentHistory' | 'planChange' | 'paymentMethods';

export default function BillingPage() {
  const translate = useTranslate();
  const { open } = useNotification();
  const [activeTab, setActiveTab] = useState<BillingTab>('subscription');

  // Fetch billing info using generated hook
  const {
    data: billingData,
    isLoading,
    refetch,
  } = useMyBillingInfoQuery(
    {},
    {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  );

  const billingInfo = billingData?.myBillingInfo;

  const handleSuccess = (message: string) => {
    open?.({
      type: 'success',
      message,
    });
    refetch();
  };

  const handleError = (message: string) => {
    open?.({
      type: 'error',
      message,
    });
  };

  const tabs = [
    { id: 'subscription' as const, label: translate('billing.tabs.subscription') },
    { id: 'paymentHistory' as const, label: translate('billing.tabs.paymentHistory') },
    { id: 'planChange' as const, label: translate('billing.tabs.planChange') },
    { id: 'paymentMethods' as const, label: translate('billing.tabs.paymentMethods') },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{translate('billing.title')}</h1>
        <p className="text-gray-600">{translate('billing.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <BillingSkeleton activeTab={activeTab} />
        ) : billingInfo ? (
          <>
            {activeTab === 'subscription' && (
              <BillingSubscription
                billingInfo={billingInfo}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}
            {activeTab === 'paymentHistory' && (
              <BillingPaymentHistory payments={billingInfo.paymentHistory} />
            )}
            {activeTab === 'planChange' && (
              <BillingPlanChange
                currentPlan={billingInfo.planTier}
                currentPlanName={billingInfo.planName}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            )}
            {activeTab === 'paymentMethods' && (
              <BillingPaymentMethods
                paymentMethods={billingInfo.paymentMethods}
                onError={handleError}
              />
            )}
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">{translate('billing.noSubscription')}</div>
        )}
      </div>
    </div>
  );
}
