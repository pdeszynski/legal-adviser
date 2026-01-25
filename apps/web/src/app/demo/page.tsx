'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PublicLayout } from '@components/layout/public-layout';
import { Button } from '@legal/ui';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  Users,
  Clock,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
  Mail,
  Building,
  Briefcase,
  MessageSquare,
} from 'lucide-react';

interface WaitlistFormData {
  name: string;
  email: string;
  company: string;
  role: string;
  useCase: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

const DemoPage = () => {
  const t = useTranslations('demo');
  const [formData, setFormData] = useState<WaitlistFormData>({
    name: '',
    email: '',
    company: '',
    role: '',
    useCase: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof WaitlistFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WaitlistFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('form.errors.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('form.errors.emailRequired');
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = t('form.errors.emailInvalid');
    }

    if (!formData.role.trim()) {
      newErrors.role = t('form.errors.roleRequired');
    }

    if (!formData.useCase.trim()) {
      newErrors.useCase = t('form.errors.useCaseRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call - replace with actual mutation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSuccess(true);

    // Reset form after successful submission
    setTimeout(() => {
      setFormData({ name: '', email: '', company: '', role: '', useCase: '' });
      setIsSuccess(false);
    }, 5000);
  };

  const handleInputChange = (field: keyof WaitlistFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqs: FAQItem[] = [
    { question: t('faq.item1.question'), answer: t('faq.item1.answer') },
    { question: t('faq.item2.question'), answer: t('faq.item2.answer') },
    { question: t('faq.item3.question'), answer: t('faq.item3.answer') },
    { question: t('faq.item4.question'), answer: t('faq.item4.answer') },
    { question: t('faq.item5.question'), answer: t('faq.item5.answer') },
  ];

  const benefits = [
    {
      icon: Zap,
      title: t('benefits.earlyAccess.title'),
      description: t('benefits.earlyAccess.description'),
    },
    {
      icon: Users,
      title: t('benefits.priority.title'),
      description: t('benefits.priority.description'),
    },
    {
      icon: Shield,
      title: t('benefits.freeTrial.title'),
      description: t('benefits.freeTrial.description'),
    },
  ];

  return (
    <PublicLayout>
      <div className="flex flex-col bg-background text-foreground">
        {/* Hero Section */}
        <section className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-background to-background" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors border-blue-200 bg-blue-50 text-blue-700">
                <Clock className="mr-2 h-4 w-4" />
                {t('hero.badge')}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl leading-tight">
                {t('hero.title')}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  {t('hero.highlight')}
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                {t('hero.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="w-full py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-xl mx-auto">
              <div className="rounded-3xl border border-border bg-card p-8 md:p-10 shadow-xl">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">{t('form.title')}</h2>
                  <p className="text-muted-foreground">{t('form.subtitle')}</p>
                </div>

                {isSuccess ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold">{t('form.success.title')}</h3>
                    <p className="text-muted-foreground">{t('form.success.message')}</p>
                    <Link href="/">
                      <Button variant="outline" className="mt-4">
                        {t('form.success.backButton')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-medium">
                        {t('form.fields.name')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder={t('form.placeholders.name')}
                        className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                      {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium">
                        {t('form.fields.email')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder={t('form.placeholders.email')}
                          className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                      {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                    </div>

                    {/* Company (Optional) */}
                    <div className="space-y-2">
                      <label htmlFor="company" className="block text-sm font-medium">
                        {t('form.fields.company')}
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          id="company"
                          type="text"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          placeholder={t('form.placeholders.company')}
                          className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                      <label htmlFor="role" className="block text-sm font-medium">
                        {t('form.fields.role')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <select
                          id="role"
                          value={formData.role}
                          onChange={(e) => handleInputChange('role', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">{t('form.placeholders.role')}</option>
                          <option value="lawyer">{t('form.roles.lawyer')}</option>
                          <option value="paralegal">{t('form.roles.paralegal')}</option>
                          <option value="in_house_counsel">{t('form.roles.inHouseCounsel')}</option>
                          <option value="legal_student">{t('form.roles.legalStudent')}</option>
                          <option value="business_owner">{t('form.roles.businessOwner')}</option>
                          <option value="other">{t('form.roles.other')}</option>
                        </select>
                      </div>
                      {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                    </div>

                    {/* Use Case */}
                    <div className="space-y-2">
                      <label htmlFor="useCase" className="block text-sm font-medium">
                        {t('form.fields.useCase')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <textarea
                          id="useCase"
                          value={formData.useCase}
                          onChange={(e) => handleInputChange('useCase', e.target.value)}
                          placeholder={t('form.placeholders.useCase')}
                          rows={3}
                          className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                        />
                      </div>
                      {errors.useCase && <p className="text-sm text-red-500">{errors.useCase}</p>}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] rounded-full text-base font-medium mt-6"
                    >
                      {isSubmitting ? t('form.submitting') : t('form.submit')}
                      {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground mt-4">
                      {t('form.privacyNotice')}
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('socialProof.title')}</h2>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Users className="h-5 w-5" />
                  <span className="text-lg">{t('socialProof.waitlistCount')}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-background border">
                  <p className="text-muted-foreground mb-4">
                    &ldquo;{t('socialProof.testimonial1.quote')}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-700 text-sm">
                      {t('socialProof.testimonial1.author').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {t('socialProof.testimonial1.author')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('socialProof.testimonial1.role')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-background border">
                  <p className="text-muted-foreground mb-4">
                    &ldquo;{t('socialProof.testimonial2.quote')}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center font-bold text-purple-700 text-sm">
                      {t('socialProof.testimonial2.author').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {t('socialProof.testimonial2.author')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('socialProof.testimonial2.role')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-background border">
                  <p className="text-muted-foreground mb-4">
                    &ldquo;{t('socialProof.testimonial3.quote')}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-emerald-700 text-sm">
                      {t('socialProof.testimonial3.author').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {t('socialProof.testimonial3.author')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('socialProof.testimonial3.role')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t('faq.title')}</h2>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium pr-4">{faq.question}</span>
                      {expandedFaq === index ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === index && (
                      <div className="px-5 pb-5 pt-0 text-muted-foreground border-t border-border/50">
                        <p className="pt-4">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full py-16 bg-muted/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold">{t('bottomCta.title')}</h2>
              <p className="text-muted-foreground">{t('bottomCta.subtitle')}</p>
              <Link href="/demo">
                <Button
                  size="lg"
                  className="px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 rounded-full"
                >
                  {t('bottomCta.button')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default DemoPage;
