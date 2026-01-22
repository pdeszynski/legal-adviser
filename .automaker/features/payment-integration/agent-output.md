I'll implement the payment integration feature by first exploring the codebase to understand the existing structure, then plan and implement the integration.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore codebase structure and existing payment/billing modules",
      "status": "in_progress",
      "activeForm": "Exploring codebase structure"
    },
    {
      "content": "Review existing subscription and user entities",
      "status": "pending",
      "activeForm": "Reviewing subscription entities"
    },
    {
      "content": "Plan Stripe integration architecture",
      "status": "pending",
      "activeForm": "Planning Stripe integration"
    },
    {
      "content": "Implement Stripe service and configuration",
      "status": "pending",
      "activeForm": "Implementing Stripe service"
    },
    {
      "content": "Create payment webhooks handler",
      "status": "pending",
      "activeForm": "Creating webhooks handler"
    },
    {
      "content": "Implement subscription management logic",
      "status": "pending",
      "activeForm": "Implementing subscription logic"
    },
    {
      "content": "Create GraphQL resolvers for payment operations",
      "status": "pending",
      "activeForm": "Creating payment resolvers"
    },
    {
      "content": "Update environment variables and configuration",
      "status": "pending",
      "activeForm": "Updating configuration"
    },
    {
      "content": "Create Playwright verification test",
      "status": "pending",
      "activeForm": "Creating verification test"
    },
    {
      "content": "Run verification and cleanup test files",
      "status": "pending",
      "activeForm": "Running verification"
    }
  ]
}

🔧 Tool: Glob
Input: {
  "pattern": "**/billing/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/subscriptions/**/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/payment*/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/.env.example"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/users/**/*.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/entities/user-subscription.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/entities/subscription-plan.entity.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/billing/billing.module.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.module.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/services/subscriptions.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/package.json"
}

🔧 Tool: Glob
Input: {
  "pattern": "**/backend/src/app.module.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/app.module.ts"
}

🔧 Tool: Grep
Input: {
  "pattern": "stripe",
  "-i": true
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure",
      "content": "Explore codebase structure and existing payment/billing modules",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing subscription entities",
      "content": "Review existing subscription and user entities",
      "status": "completed"
    },
    {
      "activeForm": "Planning Stripe integration",
      "content": "Plan Stripe integration architecture",
      "status": "in_progress"
    },
    {
      "activeForm": "Implementing Stripe service",
      "content": "Implement Stripe service and configuration",
      "status": "pending"
    },
    {
      "activeForm": "Creating webhooks handler",
      "content": "Create payment webhooks handler",
      "status": "pending"
    },
    {
      "activeForm": "Implementing subscription logic",
      "content": "Implement subscription management logic",
      "status": "pending"
    },
    {
      "activeForm": "Creating payment resolvers",
      "content": "Create GraphQL resolvers for payment operations",
      "status": "pending"
    },
    {
      "activeForm": "Updating configuration",
      "content": "Update environment variables and configuration",
      "status": "pending"
    },
    {
      "activeForm": "Creating verification test",
      "content": "Create Playwright verification test",
      "status": "pending"
    },
    {
      "activeForm": "Running verification",
      "content": "Run verification and cleanup test files",
      "status": "pending"
    }
  ]
}
Now I have a good understanding of the codebase. Let me plan the Stripe integration architecture:

**Key Findings:**
1. Existing entities `UserSubscription` and `SubscriptionPlan` already have Stripe fields (`stripeSubscriptionId`, `stripeCustomerId`, `stripePriceId`)
2. There's already a `SubscriptionsModule` with service and resolvers
3. There's a `BillingModule` for domain events and quota enforcement
4. No actual Stripe integration exists yet - the fields are null

**Implementation Plan:**
1. Install Stripe dependencies
2. Create Stripe service for payment operations
3. Create Stripe webhook handler
4. Update subscription service with Stripe integration
5. Add payment-related GraphQL mutations
6. Update environment configuration
7. Create verification tests

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure",
      "content": "Explore codebase structure and existing payment/billing modules",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing subscription entities",
      "content": "Review existing subscription and user entities",
      "status": "completed"
    },
    {
      "activeForm": "Planning Stripe integration",
      "content": "Plan Stripe integration architecture",
      "status": "completed"
    },
    {
      "activeForm": "Installing Stripe dependencies",
      "content": "Install Stripe SDK package",
      "status": "in_progress"
    },
    {
      "activeForm": "Implementing Stripe service",
      "content": "Implement Stripe service and configuration",
      "status": "pending"
    },
    {
      "activeForm": "Creating webhooks handler",
      "content": "Create payment webhooks handler",
      "status": "pending"
    },
    {
      "activeForm": "Implementing subscription logic",
      "content": "Implement subscription management logic",
      "status": "pending"
    },
    {
      "activeForm": "Creating payment resolvers",
      "content": "Create GraphQL resolvers for payment operations",
      "status": "pending"
    },
    {
      "activeForm": "Updating configuration",
      "content": "Update environment variables and configuration",
      "status": "pending"
    },
    {
      "activeForm": "Creating verification test",
      "content": "Create Playwright verification test",
      "status": "pending"
    },
    {
      "activeForm": "Running verification",
      "content": "Run verification and cleanup test files",
      "status": "pending"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "cd /Users/piteer/workspace/radca-prawny/legal/apps/backend && pnpm add stripe",
  "description": "Install Stripe SDK package"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure",
      "content": "Explore codebase structure and existing payment/billing modules",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing subscription entities",
      "content": "Review existing subscription and user entities",
      "status": "completed"
    },
    {
      "activeForm": "Planning Stripe integration",
      "content": "Plan Stripe integration architecture",
      "status": "completed"
    },
    {
      "activeForm": "Installing Stripe dependencies",
      "content": "Install Stripe SDK package",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Stripe service",
      "content": "Implement Stripe service and configuration",
      "status": "in_progress"
    },
    {
      "activeForm": "Creating webhooks handler",
      "content": "Create payment webhooks handler",
      "status": "pending"
    },
    {
      "activeForm": "Implementing subscription logic",
      "content": "Implement subscription management logic",
      "status": "pending"
    },
    {
      "activeForm": "Creating payment resolvers",
      "content": "Create GraphQL resolvers for payment operations",
      "status": "pending"
    },
    {
      "activeForm": "Updating configuration",
      "content": "Update environment variables and configuration",
      "status": "pending"
    },
    {
      "activeForm": "Creating verification test",
      "content": "Create Playwright verification test",
      "status": "pending"
    },
    {
      "activeForm": "Running verification",
      "content": "Run verification and cleanup test files",
      "status": "pending"
    }
  ]
}
Now let me create the Stripe service:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/services/stripe.service.ts",
  "content": "import { Injectable, Logger, NotFoundException } from '@nestjs/common';\nimport { ConfigService } from '@nestjs/config';\nimport Stripe from 'stripe';\nimport { Repository } from 'typeorm';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { UserSubscription } from '../entities/user-subscription.entity';\nimport { SubscriptionPlan } from '../entities/subscription-plan.entity';\nimport { User } from '../../users/entities/user.entity';\nimport { SubscriptionStatus } from '../entities/user-subscription.entity';\n\n/**\n * Stripe Service\n *\n * Handles all Stripe payment operations including:\n * - Customer management\n * - Subscription lifecycle\n * - Payment intents\n * - Webhook signature verification\n *\n * Follows Domain-Driven Design principles:\n * - Business logic stays in domain layer\n * - This service is an anti-corruption layer for Stripe API\n */\n@Injectable()\nexport class StripeService {\n  private readonly logger = new Logger(StripeService.name);\n  private readonly stripe: Stripe;\n\n  constructor(\n    private configService: ConfigService,\n    @InjectRepository(UserSubscription)\n    private subscriptionRepository: Repository<UserSubscription>,\n    @InjectRepository(SubscriptionPlan)\n    private planRepository: Repository<SubscriptionPlan>,\n    @InjectRepository(User)\n    private userRepository: Repository<User>,\n  ) {\n    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');\n    if (!secretKey) {\n      this.logger.warn('STRIPE_SECRET_KEY not configured - Stripe features will be disabled');\n    }\n    this.stripe = new Stripe(secretKey || '', {\n      apiVersion: '2025-01-27.acacia',\n      typescript: true,\n    });\n  }\n\n  /**\n   * Check if Stripe is properly configured\n   */\n  isConfigured(): boolean {\n    return !!this.configService.get<string>('STRIPE_SECRET_KEY');\n  }\n\n  /**\n   * Create or retrieve a Stripe customer for a user\n   */\n  async createOrGetCustomer(userId: string, email: string, name?: string): Promise<string | null> {\n    if (!this.isConfigured()) {\n      return null;\n    }\n\n    try {\n      const user = await this.userRepository.findOne({ where: { id: userId } });\n      if (!user) {\n        throw new NotFoundException('User not found');\n      }\n\n      // Return existing customer ID if already set\n      if (user.stripeCustomerId) {\n        return user.stripeCustomerId;\n      }\n\n      // Create new Stripe customer\n      const customer = await this.stripe.customers.create({\n        email,\n        name: name || email,\n        metadata: {\n          userId,\n        },\n      });\n\n      // Save customer ID to user\n      user.stripeCustomerId = customer.id;\n      await this.userRepository.save(user);\n\n      this.logger.log(`Created Stripe customer ${customer.id} for user ${userId}`);\n      return customer.id;\n    } catch (error) {\n      this.logger.error(`Failed to create Stripe customer: ${error.message}`);\n      return null;\n    }\n  }\n\n  /**\n   * Create a Stripe checkout session for subscription\n   */\n  async createCheckoutSession(\n    userId: string,\n    planId: string,\n    successUrl: string,\n    cancelUrl: string,\n  ): Promise<{ sessionId: string; url: string } | null> {\n    if (!this.isConfigured()) {\n      return null;\n    }\n\n    try {\n      const user = await this.userRepository.findOne({ where: { id: userId } });\n      if (!user) {\n        throw new NotFoundException('User not found');\n      }\n\n      const plan = await this.planRepository.findOne({ where: { id: planId } });\n      if (!plan) {\n        throw new NotFoundException('Plan not found');\n      }\n\n      if (!plan.stripePriceId) {\n        throw new Error('Plan does not have a Stripe price ID configured');\n      }\n\n      // Get or create Stripe customer\n      const customerId = await this.createOrGetCustomer(userId, user.email, user.name);\n      if (!customerId) {\n        throw new Error('Failed to create Stripe customer');\n      }\n\n      // Create checkout session\n      const session = await this.stripe.checkout.sessions.create({\n        customer: customerId,\n        payment_method_types: ['card'],\n        line_items: [\n          {\n            price: plan.stripePriceId,\n            quantity: 1,\n          },\n        ],\n        mode: 'subscription',\n        success_url: successUrl,\n        cancel_url: cancelUrl,\n        metadata: {\n          userId,\n          planId,\n        },\n      });\n\n      this.logger.log(`Created checkout session ${session.id} for user ${userId}`);\n      return { sessionId: session.id, url: session.url };\n    } catch (error) {\n      this.logger.error(`Failed to create checkout session: ${error.message}`);\n      return null;\n    }\n  }\n\n  /**\n   * Create a subscription directly (for admin or programmatic use)\n   */\n  async createSubscription(\n    customerId: string,\n    priceId: string,\n    metadata?: Record<string, string>,\n  ): Promise<Stripe.Subscription | null> {\n    if (!this.isConfigured()) {\n      return null;\n    }\n\n    try {\n      const subscription = await this.stripe.subscriptions.create({\n        customer: customerId,\n        items: [{ price: priceId }],\n        payment_behavior: 'default_incomplete',\n        payment_settings: { save_default_payment_method: 'on_subscription' },\n        expand: ['latest_invoice.payment_intent'],\n        metadata,\n      });\n\n      this.logger.log(`Created Stripe subscription ${subscription.id}`);\n      return subscription;\n    } catch (error) {\n      this.logger.error(`Failed to create subscription: ${error.message}`);\n      return null;\n    }\n  }\n\n  /**\n   * Cancel a subscription at period end\n   */\n  async cancelSubscriptionAtPeriodEnd(stripeSubscriptionId: string): Promise<boolean> {\n    if (!this.isConfigured()) {\n      return false;\n    }\n\n    try {\n      const subscription = await this.stripe.subscriptions.update(stripeSubscriptionId, {\n        cancel_at_period_end: true,\n      });\n\n      this.logger.log(`Subscription ${stripeSubscriptionId} will cancel at period end`);\n      return subscription.cancel_at_period_end;\n    } catch (error) {\n      this.logger.error(`Failed to cancel subscription: ${error.message}`);\n      return false;\n    }\n  }\n\n  /**\n   * Cancel a subscription immediately\n   */\n  async cancelSubscriptionImmediately(stripeSubscriptionId: string): Promise<boolean> {\n    if (!this.isConfigured()) {\n      return false;\n    }\n\n    try {\n      await this.stripe.subscriptions.cancel(stripeSubscriptionId);\n      this.logger.log(`Subscription ${stripeSubscriptionId} canceled immediately`);\n      return true;\n    } catch (error) {\n      this.logger.error(`Failed to cancel subscription: ${error.message}`);\n      return false;\n    }\n  }\n\n  /**\n   * Resume a subscription scheduled for cancellation\n   */\n  async resumeSubscription(stripeSubscriptionId: string): Promise<boolean> {\n    if (!this.isConfigured()) {\n      return false;\n    }\n\n    try {\n      const subscription = await this.stripe.subscriptions.update(stripeSubscriptionId, {\n        cancel_at_period_end: false,\n      });\n\n      this.logger.log(`Subscription ${stripeSubscriptionId} resumed`);\n      return !subscription.cancel_at_period_end;\n    } catch (error) {\n      this.logger.error(`Failed to resume subscription: ${error.message}`);\n      return false;\n    }\n  }\n\n  /**\n   * Update subscription to a new price plan\n   */\n  async updateSubscription(\n    stripeSubscriptionId: string,\n    newPriceId: string,\n  ): Promise<Stripe.Subscription | null> {\n    if (!this.isConfigured()) {\n      return null;\n    }\n\n    try {\n      const subscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);\n\n      const updatedSubscription = await this.stripe.subscriptions.update(stripeSubscriptionId, {\n        items: [\n          {\n            id: subscription.items.data[0].id,\n            price: newPriceId,\n          },\n        ],\n        proration_behavior: 'create_prorations',\n      });\n\n      this.logger.log(`Subscription ${stripeSubscriptionId} updated to price ${newPriceId}`);\n      return updatedSubscription;\n    } catch (error) {\n      this.logger.error(`Failed to update subscription: ${error.message}`);\n      return null;\n    }\n  }\n\n  /**\n   * Retrieve a subscription from Stripe\n   */\n  async getSubscription(stripeSubscriptionId: string): Promise<Stripe.Subscription | null> {\n    if (!this.isConfigured()) {\n      return null;\n    }\n\n    try {\n      return await this.stripe.subscriptions.retrieve(stripeSubscriptionId);\n    } catch (error) {\n      this.logger.error(`Failed to retrieve subscription: ${error.message}`);\n      return null;\n    }\n  }\n\n  /**\n   * Create a portal session for customers to manage their subscription\n   */\n  async createPortalSession(\n    customerId: string,\n    returnUrl: string,\n  ): Promise<{ url: string } | null> {\n    if (!this.isConfigured()) {\n      return null;\n    }\n\n    try {\n      const session = await this.stripe.billingPortal.sessions.create({\n        customer: customerId,\n        return_url: returnUrl,\n      });\n\n      this.logger.log(`Created portal session for customer ${customerId}`);\n      return { url: session.url };\n    } catch (error) {\n      this.logger.error(`Failed to create portal session: ${error.message}`);\n      return null;\n    }\n  }\n\n  /**\n   * Construct an event from a webhook payload\n   */\n  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {\n    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');\n    if (!webhookSecret) {\n      throw new Error('STRIPE_WEBHOOK_SECRET not configured');\n    }\n\n    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);\n  }\n\n  /**\n   * Handle a Stripe webhook event\n   */\n  async handleWebhookEvent(event: Stripe.Event): Promise<void> {\n    this.logger.log(`Handling webhook event: ${event.type}`);\n\n    switch (event.type) {\n      case 'checkout.session.completed':\n        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);\n        break;\n      case 'customer.subscription.created':\n        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);\n        break;\n      case 'customer.subscription.updated':\n        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);\n        break;\n      case 'customer.subscription.deleted':\n        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);\n        break;\n      case 'invoice.paid':\n        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);\n        break;\n      case 'invoice.payment_failed':\n        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);\n        break;\n      default:\n        this.logger.log(`Unhandled event type: ${event.type}`);\n    }\n  }\n\n  /**\n   * Handle checkout.session.completed event\n   */\n  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {\n    const { userId, planId } = session.metadata as { userId: string; planId: string };\n    const subscriptionId = session.subscription as string;\n\n    this.logger.log(`Checkout completed for user ${userId}, subscription ${subscriptionId}`);\n\n    // Find or create subscription in database\n    let subscription = await this.subscriptionRepository.findOne({\n      where: { userId },\n    });\n\n    const plan = await this.planRepository.findOne({ where: { id: planId } });\n\n    if (subscription && plan) {\n      subscription.stripeSubscriptionId = subscriptionId;\n      subscription.stripeCustomerId = session.customer as string;\n      subscription.status = SubscriptionStatus.ACTIVE;\n      subscription.currentPeriodStart = new Date();\n      subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);\n      subscription.lastPaymentAt = new Date();\n      subscription.lastPaymentAmount = Number(session.amount_total) / 100;\n      await this.subscriptionRepository.save(subscription);\n    }\n  }\n\n  /**\n   * Handle customer.subscription.created event\n   */\n  private async handleSubscriptionCreated(stripeSubscription: Stripe.Subscription): Promise<void> {\n    this.logger.log(`Subscription created: ${stripeSubscription.id}`);\n  }\n\n  /**\n   * Handle customer.subscription.updated event\n   */\n  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {\n    const subscription = await this.subscriptionRepository.findOne({\n      where: { stripeSubscriptionId: stripeSubscription.id },\n    });\n\n    if (subscription) {\n      // Update status based on Stripe status\n      const statusMap: Record<string, SubscriptionStatus> = {\n        active: SubscriptionStatus.ACTIVE,\n        trialing: SubscriptionStatus.TRIALING,\n        past_due: SubscriptionStatus.PAST_DUE,\n        canceled: SubscriptionStatus.CANCELED,\n        incomplete: SubscriptionStatus.EXPIRED,\n      };\n\n      subscription.status = statusMap[stripeSubscription.status] || subscription.status;\n      subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;\n\n      if (stripeSubscription.current_period_start) {\n        subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);\n      }\n      if (stripeSubscription.current_period_end) {\n        subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);\n      }\n\n      await this.subscriptionRepository.save(subscription);\n      this.logger.log(`Subscription updated: ${stripeSubscription.id}`);\n    }\n  }\n\n  /**\n   * Handle customer.subscription.deleted event\n   */\n  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {\n    const subscription = await this.subscriptionRepository.findOne({\n      where: { stripeSubscriptionId: stripeSubscription.id },\n    });\n\n    if (subscription) {\n      subscription.status = SubscriptionStatus.CANCELED;\n      subscription.canceledAt = new Date();\n      await this.subscriptionRepository.save(subscription);\n      this.logger.log(`Subscription deleted: ${stripeSubscription.id}`);\n    }\n  }\n\n  /**\n   * Handle invoice.paid event\n   */\n  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {\n    if (invoice.subscription) {\n      const subscription = await this.subscriptionRepository.findOne({\n        where: { stripeSubscriptionId: invoice.subscription as string },\n      });\n\n      if (subscription) {\n        subscription.lastPaymentAt = new Date();\n        subscription.lastPaymentAmount = Number(invoice.amount_paid) / 100;\n        await this.subscriptionRepository.save(subscription);\n        this.logger.log(`Invoice paid for subscription ${invoice.subscription}`);\n      }\n    }\n  }\n\n  /**\n   * Handle invoice.payment_failed event\n   */\n  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {\n    if (invoice.subscription) {\n      const subscription = await this.subscriptionRepository.findOne({\n        where: { stripeSubscriptionId: invoice.subscription as string },\n      });\n\n      if (subscription) {\n        subscription.status = SubscriptionStatus.PAST_DUE;\n        await this.subscriptionRepository.save(subscription);\n        this.logger.log(`Invoice payment failed for subscription ${invoice.subscription}`);\n      }\n    }\n  }\n}\n"
}
Now let's update the User entity to include the stripeCustomerId field:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/users/entities/user.entity.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/users/entities/user.entity.ts",
  "old_string": "  /**\n   * Hashed password using bcrypt\n   * This field is not exposed via GraphQL for security reasons\n   */\n  @Column({ type: 'varchar', length: 255, nullable: true, select: false })\n  passwordHash: string | null;\n\n  @OneToMany(() => UserSession, (session) => session.user, { cascade: true })\n  sessions: UserSession[];",
  "new_string": "  /**\n   * Hashed password using bcrypt\n   * This field is not exposed via GraphQL for security reasons\n   */\n  @Column({ type: 'varchar', length: 255, nullable: true, select: false })\n  passwordHash: string | null;\n\n  /**\n   * Stripe customer ID for payment processing\n   */\n  @Column({ type: 'varchar', length: 255, nullable: true })\n  @Field(() => String, { nullable: true })\n  stripeCustomerId: string | null;\n\n  /**\n   * Computed name property for convenience\n   */\n  get name(): string {\n    if (this.firstName && this.lastName) {\n      return `${this.firstName} ${this.lastName}`;\n    }\n    return this.username || this.email;\n  }\n\n  @OneToMany(() => UserSession, (session) => session.user, { cascade: true })\n  sessions: UserSession[];"
}
Now let's update the subscriptions module to include the Stripe service:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.module.ts"
}

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.module.ts",
  "content": "import { Module } from '@nestjs/common';\nimport { TypeOrmModule } from '@nestjs/typeorm';\nimport { SubscriptionsService } from './services/subscriptions.service';\nimport { StripeService } from './services/stripe.service';\nimport { SubscriptionsResolver } from './subscriptions.resolver';\nimport { StripeWebhooksController } from './controllers/stripe-webhooks.controller';\nimport { SubscriptionPlan } from './entities/subscription-plan.entity';\nimport { UserSubscription } from './entities/user-subscription.entity';\nimport { User } from '../users/entities/user.entity';\nimport { FeatureAccessGuard } from './guards/feature-access.guard';\n\n/**\n * Subscriptions Module\n *\n * Manages subscription plans, user subscriptions, and feature access control.\n * Integrates with Stripe for payment processing.\n *\n * Exports:\n * - SubscriptionsService: For managing subscriptions\n * - StripeService: For Stripe payment operations\n * - FeatureAccessGuard: For protecting features based on subscription plan\n */\n@Module({\n  imports: [\n    TypeOrmModule.forFeature([SubscriptionPlan, UserSubscription, User]),\n  ],\n  providers: [\n    SubscriptionsService,\n    StripeService,\n    SubscriptionsResolver,\n    FeatureAccessGuard,\n  ],\n  controllers: [StripeWebhooksController],\n  exports: [SubscriptionsService, StripeService, FeatureAccessGuard],\n})\nexport class SubscriptionsModule {}\n"
}
Now let's create the webhooks controller:

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/controllers/stripe-webhooks.controller.ts",
  "content": "import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger, RawBodyRequest, Req } from '@nestjs/common';\nimport { Request } from 'express';\nimport { StripeService } from '../services/stripe.service';\n\n/**\n * Stripe Webhooks Controller\n *\n * Handles incoming webhook events from Stripe.\n * Verifies webhook signatures and dispatches events to the Stripe service.\n *\n * Endpoint: POST /webhooks/stripe\n */\n@Controller('webhooks')\nexport class StripeWebhooksController {\n  private readonly logger = new Logger(StripeWebhooksController.name);\n\n  constructor(private readonly stripeService: StripeService) {}\n\n  @Post('stripe')\n  @HttpCode(HttpStatus.OK)\n  async handleStripeWebhook(\n    @Req() req: RawBodyRequest<Request>,\n    @Headers('stripe-signature') signature: string,\n  ): Promise<{ received: boolean }> {\n    try {\n      if (!req.rawBody) {\n        throw new Error('Request body is empty');\n      }\n\n      // Verify webhook signature and construct event\n      const event = this.stripeService.constructWebhookEvent(req.rawBody, signature);\n\n      this.logger.log(`Received Stripe webhook: ${event.type} (ID: ${event.id})`);\n\n      // Handle the event\n      await this.stripeService.handleWebhookEvent(event);\n\n      return { received: true };\n    } catch (error) {\n      this.logger.error(`Failed to process webhook: ${error.message}`, error.stack);\n\n      // Return 400 for signature verification failures\n      if (error.type === 'StripeSignatureVerificationError') {\n        throw error;\n      }\n\n      // Return 200 for other errors to avoid retry loops\n      return { received: false };\n    }\n  }\n}\n"
}
Now let's update the todo list and add payment-related DTOs and resolvers:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring codebase structure",
      "content": "Explore codebase structure and existing payment/billing modules",
      "status": "completed"
    },
    {
      "activeForm": "Reviewing subscription entities",
      "content": "Review existing subscription and user entities",
      "status": "completed"
    },
    {
      "activeForm": "Planning Stripe integration",
      "content": "Plan Stripe integration architecture",
      "status": "completed"
    },
    {
      "activeForm": "Installing Stripe dependencies",
      "content": "Install Stripe SDK package",
      "status": "completed"
    },
    {
      "activeForm": "Implementing Stripe service",
      "content": "Implement Stripe service and configuration",
      "status": "completed"
    },
    {
      "activeForm": "Creating webhooks handler",
      "content": "Create payment webhooks handler",
      "status": "completed"
    },
    {
      "activeForm": "Updating subscription DTOs",
      "content": "Update DTOs for payment operations",
      "status": "in_progress"
    },
    {
      "activeForm": "Updating subscription resolver",
      "content": "Update subscription resolver with payment mutations",
      "status": "pending"
    },
    {
      "activeForm": "Updating configuration",
      "content": "Update environment variables and configuration",
      "status": "pending"
    },
    {
      "activeForm": "Creating verification test",
      "content": "Create Playwright verification test",
      "status": "pending"
    },
    {
      "activeForm": "Running verification",
      "content": "Run verification and cleanup test files",
      "status": "pending"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/dto/subscription.dto.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/dto/subscription.dto.ts",
  "old_string": "/**\n * Subscription usage stats\n */\n@ObjectType('SubscriptionUsageStats')\nexport class SubscriptionUsageStats {\n  @Field(() => ID)\n  subscriptionId: string;\n\n  @Field(() => PlanTier)\n  planTier: string;\n\n  @Field(() => String)\n  usage: string;\n\n  @Field(() => String)\n  periodStart: Date;\n\n  @Field(() => String)\n  periodEnd: Date;\n\n  @Field(() => Int)\n  daysRemaining: number;\n}",
  "new_string": "/**\n * Subscription usage stats\n */\n@ObjectType('SubscriptionUsageStats')\nexport class SubscriptionUsageStats {\n  @Field(() => ID)\n  subscriptionId: string;\n\n  @Field(() => PlanTier)\n  planTier: string;\n\n  @Field(() => String)\n  usage: string;\n\n  @Field(() => String)\n  periodStart: Date;\n\n  @Field(() => String)\n  periodEnd: Date;\n\n  @Field(() => Int)\n  daysRemaining: number;\n}\n\n/**\n * Input for creating Stripe checkout session\n */\n@InputType('CreateCheckoutSessionInput')\nexport class CreateCheckoutSessionInput {\n  @Field(() => ID)\n  planId: string;\n\n  @Field(() => String)\n  successUrl: string;\n\n  @Field(() => String)\n  cancelUrl: string;\n}\n\n/**\n * Response for checkout session creation\n */\n@ObjectType('CheckoutSessionResponse')\nexport class CheckoutSessionResponse {\n  @Field(() => String)\n  sessionId: string;\n\n  @Field(() => String)\n  url: string;\n}\n\n/**\n * Response for portal session creation\n */\n@ObjectType('PortalSessionResponse')\nexport class PortalSessionResponse {\n  @Field(() => String)\n  url: string;\n}\n\n/**\n * Input for updating subscription via Stripe\n */\n@InputType('UpdateStripeSubscriptionInput')\nexport class UpdateStripeSubscriptionInput {\n  @Field(() => ID)\n  newPlanId: string;\n}"
}
Now let's update the subscription resolver to include payment mutations:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.resolver.ts",
  "old_string": "import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\nimport { SubscriptionsService } from './services/subscriptions.service';\nimport { SubscriptionPlan } from './entities/subscription-plan.entity';\nimport { UserSubscription } from './entities/user-subscription.entity';\nimport {\n  CreateSubscriptionPlanInput,\n  UpdateSubscriptionPlanInput,\n  CreateUserSubscriptionInput,\n  UpdateUserSubscriptionInput,\n  CancelSubscriptionInput,\n  CheckQuotaInput,\n  CheckQuotaResponse,\n  SubscriptionUsageStats,\n} from './dto/subscription.dto';",
  "new_string": "import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\nimport { SubscriptionsService } from './services/subscriptions.service';\nimport { StripeService } from './services/stripe.service';\nimport { SubscriptionPlan } from './entities/subscription-plan.entity';\nimport { UserSubscription } from './entities/user-subscription.entity';\nimport {\n  CreateSubscriptionPlanInput,\n  UpdateSubscriptionPlanInput,\n  CreateUserSubscriptionInput,\n  UpdateUserSubscriptionInput,\n  CancelSubscriptionInput,\n  CheckQuotaInput,\n  CheckQuotaResponse,\n  SubscriptionUsageStats,\n  CreateCheckoutSessionInput,\n  CheckoutSessionResponse,\n  PortalSessionResponse,\n  UpdateStripeSubscriptionInput,\n} from './dto/subscription.dto';"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.resolver.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.resolver.ts",
  "old_string": "import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\nimport { SubscriptionsService } from './services/subscriptions.service';\nimport { SubscriptionPlan } from './entities/subscription-plan.entity';\nimport { UserSubscription } from './entities/user-subscription.entity';\nimport {\n  CreateSubscriptionPlanInput,\n  UpdateSubscriptionPlanInput,\n  CreateUserSubscriptionInput,\n  UpdateUserSubscriptionInput,\n  CancelSubscriptionInput,\n  CheckQuotaInput,\n  CheckQuotaResponse,\n  SubscriptionUsageStats,\n} from './dto/subscription.dto';\n\n/**\n * GraphQL Resolver for Subscription Management\n *\n * Handles operations for:\n * - Managing subscription plans (admin only)\n * - User subscription lifecycle\n * - Feature access control\n * - Usage quota management\n */\n@Resolver()\nexport class SubscriptionsResolver {\n  constructor(private readonly service: SubscriptionsService) {}",
  "new_string": "import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\nimport { SubscriptionsService } from './services/subscriptions.service';\nimport { StripeService } from './services/stripe.service';\nimport { SubscriptionPlan } from './entities/subscription-plan.entity';\nimport { UserSubscription } from './entities/user-subscription.entity';\nimport {\n  CreateSubscriptionPlanInput,\n  UpdateSubscriptionPlanInput,\n  CreateUserSubscriptionInput,\n  UpdateUserSubscriptionInput,\n  CancelSubscriptionInput,\n  CheckQuotaInput,\n  CheckQuotaResponse,\n  SubscriptionUsageStats,\n  CreateCheckoutSessionInput,\n  CheckoutSessionResponse,\n  PortalSessionResponse,\n  UpdateStripeSubscriptionInput,\n} from './dto/subscription.dto';\n\n/**\n * GraphQL Resolver for Subscription Management\n *\n * Handles operations for:\n * - Managing subscription plans (admin only)\n * - User subscription lifecycle\n * - Feature access control\n * - Usage quota management\n * - Stripe payment integration\n */\n@Resolver()\nexport class SubscriptionsResolver {\n  constructor(\n    private readonly service: SubscriptionsService,\n    private readonly stripeService: StripeService,\n  ) {}"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.resolver.ts"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.resolver.ts",
  "old_string": "import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\nimport { SubscriptionsService } from './subscriptions.service';\nimport { SubscriptionPlan } from './entities/subscription-plan.entity';\nimport { UserSubscription } from './entities/user-subscription.entity';\nimport {\n  CreateSubscriptionPlanInput,\n  UpdateSubscriptionPlanInput,\n  CreateUserSubscriptionInput,\n  UpdateUserSubscriptionInput,\n  CancelSubscriptionInput,\n  CheckQuotaInput,\n  CheckQuotaResponse,\n  SubscriptionUsageStats,\n} from './dto/subscription.dto';",
  "new_string": "import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';\nimport { UseGuards } from '@nestjs/common';\nimport { GqlAuthGuard } from '../auth/guards/gql-auth.guard';\nimport { SubscriptionsService } from './subscriptions.service';\nimport { StripeService } from './services/stripe.service';\nimport { SubscriptionPlan } from './entities/subscription-plan.entity';\nimport { UserSubscription } from './entities/user-subscription.entity';\nimport {\n  CreateSubscriptionPlanInput,\n  UpdateSubscriptionPlanInput,\n  CreateUserSubscriptionInput,\n  UpdateUserSubscriptionInput,\n  CancelSubscriptionInput,\n  CheckQuotaInput,\n  CheckQuotaResponse,\n  SubscriptionUsageStats,\n  CreateCheckoutSessionInput,\n  CheckoutSessionResponse,\n  PortalSessionResponse,\n} from './dto/subscription.dto';"
}

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.resolver.ts",
  "old_string": "/**\n * GraphQL Resolver for Subscription Management\n *\n * Handles operations for:\n * - Managing subscription plans (admin only)\n * - User subscription lifecycle\n * - Feature access control\n * - Usage quota management\n */\n@Resolver()\nexport class SubscriptionsResolver {\n  constructor(private readonly service: SubscriptionsService) {}",
  "new_string": "/**\n * GraphQL Resolver for Subscription Management\n *\n * Handles operations for:\n * - Managing subscription plans (admin only)\n * - User subscription lifecycle\n * - Feature access control\n * - Usage quota management\n * - Stripe payment integration\n */\n@Resolver()\nexport class SubscriptionsResolver {\n  constructor(\n    private readonly service: SubscriptionsService,\n    private readonly stripeService: StripeService,\n  ) {}"
}
Now let's add the new payment mutations at the end of the resolver:

🔧 Tool: Edit
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.resolver.ts",
  "old_string": "  /**\n   * Mutation: Record usage for quota tracking\n   * This is typically called internally by other services\n   */\n  @Mutation(() => Boolean, {\n    name: 'recordUsage',\n    description: 'Record usage for quota tracking',\n  })\n  @UseGuards(GqlAuthGuard)\n  async recordUsage(\n    @Context() context: { req: { user: { userId: string } } },\n    @Args('quotaKey') quotaKey: string,\n    @Args('amount', { nullable: true }) amount?: number,\n  ): Promise<boolean> {\n    const userId = context.req.user?.userId;\n    if (!userId) {\n      throw new Error('User not authenticated');\n    }\n    await this.service.recordUsage(userId, quotaKey, amount ?? 1);\n    return true;\n  }\n}",
  "new_string": "  /**\n   * Mutation: Record usage for quota tracking\n   * This is typically called internally by other services\n   */\n  @Mutation(() => Boolean, {\n    name: 'recordUsage',\n    description: 'Record usage for quota tracking',\n  })\n  @UseGuards(GqlAuthGuard)\n  async recordUsage(\n    @Context() context: { req: { user: { userId: string } } },\n    @Args('quotaKey') quotaKey: string,\n    @Args('amount', { nullable: true }) amount?: number,\n  ): Promise<boolean> {\n    const userId = context.req.user?.userId;\n    if (!userId) {\n      throw new Error('User not authenticated');\n    }\n    await this.service.recordUsage(userId, quotaKey, amount ?? 1);\n    return true;\n  }\n\n  /**\n   * Mutation: Create a Stripe checkout session for subscription purchase\n   */\n  @Mutation(() => CheckoutSessionResponse, {\n    name: 'createCheckoutSession',\n    description: 'Create a Stripe checkout session for purchasing a subscription',\n  })\n  @UseGuards(GqlAuthGuard)\n  async createCheckoutSession(\n    @Context() context: { req: { user: { userId: string } } },\n    @Args('input') input: CreateCheckoutSessionInput,\n  ): Promise<CheckoutSessionResponse | null> {\n    const userId = context.req.user?.userId;\n    if (!userId) {\n      throw new Error('User not authenticated');\n    }\n\n    const session = await this.stripeService.createCheckoutSession(\n      userId,\n      input.planId,\n      input.successUrl,\n      input.cancelUrl,\n    );\n\n    if (!session) {\n      throw new Error('Failed to create checkout session. Stripe may not be configured.');\n    }\n\n    return session;\n  }\n\n  /**\n   * Mutation: Create a Stripe billing portal session\n   */\n  @Mutation(() => PortalSessionResponse, {\n    name: 'createBillingPortalSession',\n    description: 'Create a Stripe billing portal session for managing subscriptions',\n  })\n  @UseGuards(GqlAuthGuard)\n  async createBillingPortalSession(\n    @Context() context: { req: { user: { userId: string } } },\n    @Args('returnUrl') returnUrl: string,\n  ): Promise<PortalSessionResponse | null> {\n    const userId = context.req.user?.userId;\n    if (!userId) {\n      throw new Error('User not authenticated');\n    }\n\n    const subscription = await this.service.getUserSubscription(userId);\n    if (!subscription?.stripeCustomerId) {\n      throw new Error('No active subscription found');\n    }\n\n    const portalSession = await this.stripeService.createPortalSession(\n      subscription.stripeCustomerId,\n      returnUrl,\n    );\n\n    if (!portalSession) {\n      throw new Error('Failed to create portal session. Stripe may not be configured.');\n    }\n\n    return portalSession;\n  }\n}"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/subscriptions/subscriptions.resolver.ts",
  "limit": 50
}
