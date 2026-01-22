import { useState } from "react";
import { useTranslate } from "@refinedev/core";

interface PaymentMethodInfo {
  id: string;
  brand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

interface BillingPaymentMethodsProps {
  paymentMethods: PaymentMethodInfo[] | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function BillingPaymentMethods({
  paymentMethods,
  onSuccess,
  onError,
}: BillingPaymentMethodsProps) {
  const translate = useTranslate();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPaymentMethod = async () => {
    // TODO: Implement Stripe payment method addition
    // This would typically open a Stripe modal or redirect to Stripe
    onError(translate("billing.paymentMethods.notImplemented"));
  };

  const getBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes("visa")) return "💳 Visa";
    if (brandLower.includes("master")) return "💳 Mastercard";
    if (brandLower.includes("amex")) return "💳 Amex";
    return "💳 Card";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {translate("billing.paymentMethods.title")}
        </h2>
        <button
          onClick={handleAddPaymentMethod}
          disabled={isAdding}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isAdding
            ? translate("billing.paymentMethods.adding")
            : translate("billing.paymentMethods.add")}
        </button>
      </div>

      {!paymentMethods || paymentMethods.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <p className="text-lg font-medium mb-2">
            {translate("billing.paymentMethods.noMethods")}
          </p>
          <p className="text-sm">
            {translate("billing.paymentMethods.addMethodPrompt")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="border border-gray-200 rounded-lg p-4 relative"
            >
              {method.isDefault && (
                <span className="absolute top-2 right-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {translate("billing.paymentMethods.default")}
                </span>
              )}
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">{getBrandIcon(method.brand)}</span>
                <div>
                  <p className="font-medium capitalize">{method.brand}</p>
                  <p className="text-sm text-gray-600">•••• {method.last4}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {translate("billing.paymentMethods.expires")} {method.expiryMonth}/{method.expiryYear}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>{translate("billing.paymentMethods.note")}:</strong>{" "}
          {translate("billing.paymentMethods.secureNote")}
        </p>
      </div>
    </div>
  );
}
