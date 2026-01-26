'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, FileText, Shield, Zap } from 'lucide-react';
import { Button } from '@legal/ui';
import { DemoRequestForm } from '@components/demo-request';
import { PublicLayout } from '@components/layout/public-layout';
import { useAnalytics } from '@/hooks/use-analytics';
import { initAnalytics } from '@/lib/analytics';

const WaitlistContent = () => {
  const analytics = useAnalytics();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  const handleOpenForm = useCallback(
    (location: string) => {
      analytics.trackCtaClick(location, 'Schedule a Demo', 'demo-form');
      analytics.trackDemoFormOpen(location);
      setIsFormOpen(true);
    },
    [analytics],
  );

  const handleCloseForm = () => setIsFormOpen(false);

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Header with back button */}
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              Join the Waitlist
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Experience the Future of{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Legal AI
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Be among the first to access our AI-powered legal platform. Schedule a personalized
              demo to see how we can transform your legal workflows.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => handleOpenForm('waitlist-hero')}
                className="px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 rounded-full text-lg"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Schedule a Demo
              </Button>
              <Link href="/">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 h-12 border-muted-foreground/20 hover:bg-muted/50 rounded-full text-lg"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What You'll See in Your Demo</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div className="bg-card border rounded-xl p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold">AI-Powered Drafting</h3>
                <p className="text-sm text-muted-foreground">
                  Watch our AI draft legal documents in seconds, not hours
                </p>
              </div>

              <div className="bg-card border rounded-xl p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold">Smart Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  See how we analyze contracts and identify risks instantly
                </p>
              </div>

              <div className="bg-card border rounded-xl p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold">Enterprise Security</h3>
                <p className="text-sm text-muted-foreground">
                  Learn about our SOC2-compliant security infrastructure
                </p>
              </div>

              <div className="bg-card border rounded-xl p-6 text-center space-y-4 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                  <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold">Custom Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Explore how we integrate with your existing workflows
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">What to Expect</h2>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Submit Your Request</h3>
                    <p className="text-muted-foreground">
                      Fill out our short form to help us understand your needs and prepare a
                      tailored demo experience.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Receive Confirmation</h3>
                    <p className="text-muted-foreground">
                      We'll send you a calendar invitation within 24 hours along with a pre-demo
                      questionnaire.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Attend Your Personalized Demo</h3>
                    <p className="text-muted-foreground">
                      Join a 30-minute session with our legal experts to see the platform in action
                      and get all your questions answered.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Get Your Custom Proposal</h3>
                    <p className="text-muted-foreground">
                      Receive a customized proposal with pricing and implementation timeline
                      tailored to your needs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600 dark:bg-blue-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Legal Work?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Join leading legal teams who are already using AI to work smarter and faster.
            </p>
            <Button
              size="lg"
              onClick={() => handleOpenForm('waitlist-bottom-cta')}
              className="px-8 h-12 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg"
            >
              Schedule Your Demo Now
            </Button>
          </div>
        </section>
      </div>

      {/* Demo Request Form Modal */}
      <DemoRequestForm isOpen={isFormOpen} onClose={handleCloseForm} />
    </PublicLayout>
  );
};

export default function WaitlistPage() {
  return <WaitlistContent />;
}
