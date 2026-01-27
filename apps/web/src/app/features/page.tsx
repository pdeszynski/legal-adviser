'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PublicLayout } from '@components/layout/public-layout';
import {
  FeatureCard,
  FeatureCategorySection,
  FeatureFilterControls,
  FeatureCategorySectionSkeleton,
  type FeatureFilterValue,
  type FeatureCategory,
} from '@components/features';
import {
  FileText,
  MessageSquare,
  Search,
  Users,
  Sparkles,
  Shield,
  Clock,
  CheckCircle,
  Settings,
  Zap,
  BookOpen,
  GitBranch,
  Target,
  Globe,
  Lock,
  Bell,
} from 'lucide-react';
import { useAnalytics } from '@/hooks/use-analytics';
import { initAnalytics } from '@/lib/analytics';

const featuresPage = () => {
  const t = useTranslations('features');
  const analytics = useAnalytics();
  const [filter, setFilter] = useState<FeatureFilterValue>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics();
  }, []);

  // Simulate initial page load - in production this would be actual data fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200); // Show skeleton for 1.2 seconds
    return () => clearTimeout(timer);
  }, []);

  // Track CTA clicks
  const handleCtaClick = useCallback(
    (location: string, destination: string) => {
      analytics.trackCtaClick(location, 'Get Started', destination);
    },
    [analytics],
  );

  // Define all features data
  const allCategories: FeatureCategory[] = [
    {
      id: 'ai-tools',
      title: 'AI-Powered Tools',
      description: 'Transform your legal workflow with cutting-edge artificial intelligence.',
      color: 'blue',
      features: [
        {
          id: 'document-drafting',
          icon: FileText,
          title: 'Document Drafting',
          description:
            'Generate professional legal documents in minutes with AI-powered drafting assistance. Customizable templates ensure accuracy and consistency.',
          status: 'stable',
          color: 'blue',
        },
        {
          id: 'legal-analysis',
          icon: Sparkles,
          title: 'Legal Analysis',
          description:
            'Deep analysis of legal documents with instant insights on risks, obligations, and opportunities. Understand complex documents faster.',
          status: 'stable',
          color: 'blue',
        },
        {
          id: 'ai-qa',
          icon: MessageSquare,
          title: 'AI Q&A',
          description:
            'Ask questions about your documents and get instant, accurate answers with source citations. Natural language interface makes legal research intuitive.',
          status: 'new',
          color: 'blue',
        },
      ],
    },
    {
      id: 'research',
      title: 'Research & Discovery',
      description: 'Comprehensive tools for legal research and case analysis.',
      color: 'purple',
      features: [
        {
          id: 'smart-search',
          icon: Search,
          title: 'Smart Search',
          description:
            'Advanced semantic search across all your documents. Find relevant cases, clauses, and precedents instantly.',
          status: 'stable',
          color: 'purple',
        },
        {
          id: 'case-analysis',
          icon: BookOpen,
          title: 'Case Analysis',
          description:
            'Analyze case law and identify relevant precedents. AI-powered summarization and comparison tools.',
          status: 'beta',
          color: 'purple',
        },
        {
          id: 'citation-finder',
          icon: GitBranch,
          title: 'Citation Finder',
          description:
            'Automatically find and validate legal citations. Ensure your references are accurate and up-to-date.',
          status: 'coming-soon',
          ctaAction: 'disabled',
          color: 'purple',
        },
      ],
    },
    {
      id: 'collaboration',
      title: 'Collaboration & Sharing',
      description: 'Work together seamlessly with your team and clients.',
      color: 'emerald',
      features: [
        {
          id: 'real-time-collaboration',
          icon: Users,
          title: 'Real-time Collaboration',
          description:
            'Work on documents simultaneously with your team. See changes in real-time and track contributions.',
          status: 'stable',
          color: 'emerald',
        },
        {
          id: 'document-sharing',
          icon: Globe,
          title: 'Secure Document Sharing',
          description:
            'Share documents securely with clients and colleagues. Granular permissions and access controls.',
          status: 'stable',
          color: 'emerald',
        },
        {
          id: 'comments-annotations',
          icon: MessageSquare,
          title: 'Comments & Annotations',
          description:
            'Add contextual comments and annotations to documents. Threaded discussions keep everything organized.',
          status: 'stable',
          color: 'emerald',
        },
      ],
    },
    {
      id: 'platform',
      title: 'Platform Features',
      description: 'Enterprise-grade infrastructure and security.',
      color: 'amber',
      features: [
        {
          id: 'security',
          icon: Shield,
          title: 'Enterprise Security',
          description:
            'Bank-level encryption, two-factor authentication, and compliance with data protection regulations.',
          status: 'stable',
          color: 'amber',
        },
        {
          id: 'access-control',
          icon: Lock,
          title: 'Access Control',
          description:
            'Granular role-based access control. Manage permissions for team members and external collaborators.',
          status: 'stable',
          color: 'amber',
        },
        {
          id: 'audit-logs',
          icon: CheckCircle,
          title: 'Audit Logs',
          description:
            'Complete audit trail of all document activities. Track changes, accesses, and sharing history.',
          status: 'stable',
          color: 'amber',
        },
        {
          id: 'notifications',
          icon: Bell,
          title: 'Smart Notifications',
          description:
            'Stay informed with customizable notifications. Get alerts for document changes, mentions, and deadlines.',
          status: 'beta',
          color: 'amber',
        },
        {
          id: 'automated-workflows',
          icon: Zap,
          title: 'Automated Workflows',
          description:
            'Create custom workflows for document processing. Automate repetitive tasks and streamline your practice.',
          status: 'coming-soon',
          ctaAction: 'disabled',
          color: 'amber',
        },
      ],
    },
  ];

  // Filter features based on current filter and search
  const filteredCategories = useMemo(() => {
    return allCategories
      .map((category) => ({
        ...category,
        features: category.features.filter((feature) => {
          const matchesFilter = filter === 'all' || category.id === filter;
          const matchesSearch =
            search === '' ||
            feature.title.toLowerCase().includes(search.toLowerCase()) ||
            feature.description.toLowerCase().includes(search.toLowerCase());
          return matchesFilter && matchesSearch;
        }),
      }))
      .filter((category) => category.features.length > 0);
  }, [filter, search, allCategories]);

  // Calculate total results
  const totalResults = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.features.length, 0);
  }, [filteredCategories]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    allCategories.forEach((cat) => {
      counts[cat.id] = cat.features.length;
      counts.all += cat.features.length;
    });
    return counts;
  }, [allCategories]);

  const filterOptions = [
    { value: 'all' as const, label: 'All Features', count: filterCounts.all },
    { value: 'ai-tools' as const, label: 'AI Tools', count: filterCounts['ai-tools'] },
    { value: 'research' as const, label: 'Research', count: filterCounts.research },
    { value: 'collaboration' as const, label: 'Collaboration', count: filterCounts.collaboration },
    { value: 'platform' as const, label: 'Platform', count: filterCounts.platform },
  ];

  return (
    <PublicLayout>
      <div className="flex flex-col items-center bg-background text-foreground overflow-hidden">
        {/* Hero Section */}
        <section className="relative w-full pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-background to-background" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors border-blue-200 bg-blue-50 text-blue-700">
                <Target className="mr-2 h-3 w-3" />
                Powerful Features
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                Everything You Need to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  Practice Law Smarter
                </span>
              </h1>
              <p className="max-w-[700px] text-muted-foreground text-lg sm:text-xl leading-relaxed mx-auto">
                Explore our comprehensive suite of AI-powered legal tools designed to save you time,
                reduce errors, and help you deliver better outcomes for your clients.
              </p>
            </div>
          </div>
        </section>

        {/* Filter Controls */}
        <FeatureFilterControls
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
          filterOptions={filterOptions}
          resultsCount={totalResults}
        />

        {/* Features Categories */}
        {isLoading ? (
          <>
            <FeatureCategorySectionSkeleton cardCount={3} className="" />
            <FeatureCategorySectionSkeleton cardCount={3} className="bg-muted/30" />
            <FeatureCategorySectionSkeleton cardCount={3} className="" />
          </>
        ) : (
          filteredCategories.map((category, index) => (
            <FeatureCategorySection
              key={category.id}
              category={category}
              className={index % 2 === 1 ? 'bg-muted/30' : ''}
            />
          ))
        )}

        {/* Empty State */}
        {totalResults === 0 && (
          <div className="w-full py-24">
            <div className="container mx-auto px-4 md:px-6 text-center">
              <div className="max-w-md mx-auto">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No features found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <button
                  onClick={() => {
                    setFilter('all');
                    setSearch('');
                  }}
                  className="mt-6 text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        {totalResults > 0 && (
          <section className="w-full py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6">
              <div className="max-w-3xl mx-auto text-center space-y-8">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Ready to Transform Your Practice?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Get started today and see how Legal AI can help you work more efficiently.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    type="button"
                    onClick={() => handleCtaClick('features-page-cta', 'login')}
                    className="inline-flex items-center justify-center px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg"
                  >
                    Get Started Free
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCtaClick('features-page-contact', 'contact')}
                    className="inline-flex items-center justify-center px-8 h-12 border rounded-full text-lg hover:bg-muted"
                  >
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
};

export default featuresPage;
