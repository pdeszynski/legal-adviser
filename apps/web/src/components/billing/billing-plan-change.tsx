import { useState } from 'react';
import { useTranslate } from '@refinedev/core';
import { useSubscriptionPlansQuery, useChangeSubscriptionPlanMutation } from '@/generated/graphql';
import type { SubscriptionPlansQuery } from '@/generated/graphql';
import { BillingPlanChangeSkeleton } from '@/components/skeleton/BillingSkeleton';

interface BillingPlanChangeProps {
  currentPlan: string;
  currentPlanName: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function BillingPlanChange({
  currentPlan,
  currentPlanName,
  onSuccess,
  onError,
}: BillingPlanChangeProps) {
  const translate = useTranslate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  // Fetch available plans using generated hook
  const { data: plansData, isLoading } = useSubscriptionPlansQuery(
    {},
    {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  );

  const { mutate: changePlan } = useChangeSubscriptionPlanMutation();

  // Type assertion needed because generated GraphQL type doesn't match actual data shape
  const plans = (plansData?.subscriptionPlans as any) ?? [];

  const handleChangePlan = async () => {
    if (!selectedPlan) {
      onError(translate('billing.planChange.selectPlan'));
      return;
    }

    setIsChanging(true);
    try {
      await changePlan({
        newPlanId: selectedPlan,
      });
      onSuccess(translate('billing.planChange.success'));
      setSelectedPlan(null);
    } catch {
      onError(translate('billing.planChange.error'));
    } finally {
      setIsChanging(false);
    }
  };

  const getPlanPrice = (plan: { price: number }) => {
    return `$${plan.price}/mo`;
  };

  const getFeatures = (featuresJson: string) => {
    try {
      const features = JSON.parse(featuresJson);
      return Object.entries(features)
        .filter(([, value]) => value === true || (typeof value === 'number' && value > 0))
        .map(([key]) => key);
    } catch {
      return [];
    }
  };

  const getPlanOrder = (tier: string) => {
    const order = ['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'];
    return order.indexOf(tier);
  };

  const sortedPlans = Array.isArray(plans)
    ? [...plans].sort((a, b) => getPlanOrder(a.tier) - getPlanOrder(b.tier))
    : [];

  if (isLoading) {
    return <BillingPlanChangeSkeleton />;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-2">{translate('billing.planChange.title')}</h2>
      <p className="text-gray-600 mb-6">
        {translate('billing.planChange.currentPlan', { plan: currentPlanName })}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {sortedPlans.map((plan: any) => {
          const isSelected = selectedPlan === plan.id;
          const isCurrent = plan.tier === currentPlan;

          return (
            <div
              key={plan.id}
              className={`border rounded-lg p-6 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : isCurrent
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => !isCurrent && setSelectedPlan(plan.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {isCurrent && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                    {translate('billing.planChange.current')}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold mb-4">{getPlanPrice(plan)}</p>
              {plan.description && <p className="text-sm text-gray-600 mb-4">{plan.description}</p>}
              <ul className="space-y-2">
                {getFeatures(plan.features).map((feature) => (
                  <li key={feature} className="flex items-center text-sm">
                    <svg
                      className="w-4 h-4 mr-2 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {selectedPlan && (
        <div className="flex items-center space-x-4">
          <button
            onClick={handleChangePlan}
            disabled={isChanging}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChanging
              ? translate('billing.planChange.changing')
              : translate('billing.planChange.changePlan')}
          </button>
          <button
            onClick={() => setSelectedPlan(null)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {translate('billing.planChange.cancel')}
          </button>
        </div>
      )}
    </div>
  );
}
