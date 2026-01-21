import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { AiClientService } from '../../shared/ai-client/ai-client.service';
import { LegalAnalysis, AnalysisStatus } from './entities/legal-analysis.entity';
import { ClassifyCaseInput } from './dto/classify-case.dto';
import { StrictThrottle } from '../../shared/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * Custom GraphQL Resolver for Legal Analysis
 *
 * Provides custom business logic mutations for case classification.
 * Complements the auto-generated CRUD resolvers from nestjs-query.
 *
 * Auto-generated operations (via nestjs-query):
 * - legalAnalyses: Query all analyses with filtering, sorting, paging
 * - legalAnalysis: Query single analysis by ID
 * - createOneLegalAnalysis: Create a new analysis (manual entry)
 * - updateOneLegalAnalysis: Update an analysis
 * - deleteOneLegalAnalysis: Delete an analysis
 *
 * Custom operations (this resolver):
 * - classifyCase: Analyze a case using AI Engine and store results
 */
@Resolver(() => LegalAnalysis)
export class LegalAnalysisResolver {
  private readonly logger = new Logger(LegalAnalysisResolver.name);

  constructor(
    private readonly aiClientService: AiClientService,
    @InjectRepository(LegalAnalysis)
    private readonly legalAnalysisRepository: Repository<LegalAnalysis>,
  ) {}

  /**
   * Mutation: Classify a legal case
   *
   * This mutation:
   * 1. Creates a LegalAnalysis entity with PENDING status
   * 2. Calls the AI Engine to classify the case
   * 3. Updates the entity with the classification results
   * 4. Returns the completed analysis
   *
   * The AI Engine identifies:
   * - Applicable legal grounds with confidence scores
   * - Legal basis (articles, statutes)
   * - Summary and recommendations
   *
   * @param input - Case classification input with description
   * @returns LegalAnalysis with AI-generated classification results
   */
  @StrictThrottle()
  @Mutation(() => LegalAnalysis, {
    name: 'classifyCase',
    description: 'Analyze a case description using AI and identify applicable legal grounds',
  })
  async classifyCase(
    @Args('input') input: ClassifyCaseInput,
  ): Promise<LegalAnalysis> {
    this.logger.log(
      `Classifying case for session ${input.sessionId}: ${input.title}`,
    );

    // Step 1: Create LegalAnalysis entity with PENDING status
    const analysis = this.legalAnalysisRepository.create({
      sessionId: input.sessionId,
      title: input.title,
      inputDescription: input.caseDescription,
      status: AnalysisStatus.PENDING,
    });

    // Save to get the ID
    const savedAnalysis = await this.legalAnalysisRepository.save(analysis);

    // Step 2: Mark as PROCESSING
    savedAnalysis.markProcessing();
    await this.legalAnalysisRepository.save(savedAnalysis);

    try {
      // Step 3: Call AI Engine for classification
      const classificationResult =
        await this.aiClientService.classifyCase({
          case_description: input.caseDescription,
          session_id: input.sessionId,
          context: input.context ? { notes: input.context } : undefined,
        });

      this.logger.log(
        `AI classification completed for analysis ${savedAnalysis.id}`,
      );

      // Step 4: Update entity with classification results
      savedAnalysis.identifiedGrounds = classificationResult.identified_grounds.map(
        (ground) => ({
          name: ground.name,
          description: ground.description,
          confidenceScore: ground.confidence_score,
          legalBasis: ground.legal_basis,
          notes: ground.notes,
        }),
      );

      savedAnalysis.overallConfidenceScore =
        classificationResult.overall_confidence;
      savedAnalysis.summary = classificationResult.summary;
      savedAnalysis.recommendations = classificationResult.recommendations;
      savedAnalysis.metadata = {
        modelUsed: 'classifier-agent-v1',
        processingTimeMs: classificationResult.processing_time_ms,
        analysisVersion: '1.0',
      };

      // Mark as COMPLETED
      savedAnalysis.markCompleted();

      // Step 5: Save and return the completed analysis
      const completedAnalysis =
        await this.legalAnalysisRepository.save(savedAnalysis);

      this.logger.log(
        `Analysis ${completedAnalysis.id} completed with ${completedAnalysis.identifiedGrounds?.length ?? 0} identified grounds`,
      );

      return completedAnalysis;
    } catch (error) {
      // Handle classification failure
      this.logger.error(
        `Classification failed for analysis ${savedAnalysis.id}`,
        error,
      );

      savedAnalysis.markFailed(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );

      await this.legalAnalysisRepository.save(savedAnalysis);

      throw new Error(
        `Case classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
