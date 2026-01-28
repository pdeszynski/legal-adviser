import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatDataCleanupService } from './chat-data-cleanup.service';
import { CleanupEmptyMessagesInput } from '../dto/chat-data-cleanup.dto';

describe('ChatDataCleanupService', () => {
  let service: ChatDataCleanupService;
  let chatMessageRepository: Repository<ChatMessage>;
  let chatSessionRepository: Repository<ChatSession>;

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  const mockChatMessage: ChatMessage = {
    messageId: 'msg-1',
    sessionId: 'session-1',
    role: MessageRole.ASSISTANT,
    content: '',
    rawContent: 'This is the actual response content',
    citations: null,
    metadata: null,
    sequenceOrder: 1,
    createdAt: new Date('2024-01-01'),
    session: null,
  };

  const mockChatMessageWithClarification: ChatMessage = {
    messageId: 'msg-2',
    sessionId: 'session-1',
    role: MessageRole.ASSISTANT,
    content: '',
    rawContent: null,
    citations: null,
    metadata: {
      clarification: {
        needs_clarification: true,
        questions: [
          {
            question: 'When did this happen?',
            question_type: 'timeline',
          },
        ],
        context_summary: 'Need more details',
        next_steps: 'Please answer',
      },
    },
    sequenceOrder: 2,
    createdAt: new Date('2024-01-01'),
    session: null,
  };

  const mockChatSession: ChatSession = {
    id: 'session-1',
    userId: 'user-1',
    title: 'Test Session',
    mode: 'LAWYER' as any,
    lastMessageAt: new Date(),
    messageCount: 2,
    isPinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    user: null,
    messages: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatDataCleanupService,
        {
          provide: getRepositoryToken(ChatMessage),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ChatSession),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ChatDataCleanupService>(ChatDataCleanupService);
    chatMessageRepository = module.get<Repository<ChatMessage>>(
      getRepositoryToken(ChatMessage),
    );
    chatSessionRepository = module.get<Repository<ChatSession>>(
      getRepositoryToken(ChatSession),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findEmptyAssistantMessages', () => {
    it('should find messages with empty content', async () => {
      const createQueryBuilder = jest.spyOn(
        chatMessageRepository,
        'createQueryBuilder',
      );

      const queryBuilder: any = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockChatMessage]),
      };

      createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findEmptyAssistantMessages();

      expect(result).toHaveLength(1);
      expect(result[0].messageId).toBe('msg-1');
      expect(result[0].hasRecoverableRawContent).toBe(true);
    });

    it('should identify messages with clarification metadata', async () => {
      const createQueryBuilder = jest.spyOn(
        chatMessageRepository,
        'createQueryBuilder',
      );

      const queryBuilder: any = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockChatMessageWithClarification]),
      };

      createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findEmptyAssistantMessages();

      expect(result).toHaveLength(1);
      expect(result[0].hasClarificationMetadata).toBe(true);
    });
  });

  describe('analyzeMessage', () => {
    it('should correctly identify recoverable raw content', () => {
      const result = (service as any).analyzeMessage(mockChatMessage);

      expect(result.hasRecoverableRawContent).toBe(true);
      expect(result.hasClarificationMetadata).toBe(false);
    });

    it('should correctly identify clarification metadata', () => {
      const result = (service as any).analyzeMessage(
        mockChatMessageWithClarification,
      );

      expect(result.hasRecoverableRawContent).toBe(false);
      expect(result.hasClarificationMetadata).toBe(true);
    });
  });

  describe('analyzeEmptyMessages', () => {
    it('should generate summary statistics', async () => {
      const createQueryBuilder = jest.spyOn(
        chatMessageRepository,
        'createQueryBuilder',
      );

      const queryBuilder: any = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          mockChatMessage,
          mockChatMessageWithClarification,
        ]),
      };

      createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.analyzeEmptyMessages();

      expect(result.totalEmptyMessages).toBe(2);
      expect(result.recoverableFromRawContent).toBe(1);
      expect(result.withClarificationMetadata).toBe(1);
      expect(result.affectedSessions).toBe(1);
      expect(result.affectedUsers).toBe(1);
    });
  });

  describe('recoverFromRawContent', () => {
    it('should recover content from rawContent field', () => {
      const message = { ...mockChatMessage };
      const result = (service as any).recoverFromRawContent(message);

      expect(result).toBe(true);
      expect(message.content).toBe('This is the actual response content');
    });

    it('should return false if rawContent is empty', () => {
      const message = { ...mockChatMessage, rawContent: null };
      const result = (service as any).recoverFromRawContent(message);

      expect(result).toBe(false);
      expect(message.content).toBe('');
    });
  });

  describe('recoverFromClarificationMetadata', () => {
    it('should serialize clarification metadata to JSON', () => {
      const message = { ...mockChatMessageWithClarification };
      const result = (service as any).recoverFromClarificationMetadata(message);

      expect(result).toBe(true);
      const parsed = JSON.parse(message.content as string);
      expect(parsed.type).toBe('clarification');
      expect(parsed.questions).toHaveLength(1);
      expect(parsed.questions[0].question).toBe('When did this happen?');
    });

    it('should return false if no clarification metadata', () => {
      const message = { ...mockChatMessage, metadata: null };
      const result = (service as any).recoverFromClarificationMetadata(
        message,
      );

      expect(result).toBe(false);
    });
  });

  describe('cleanupEmptyMessages', () => {
    it('should perform dry run without executing', async () => {
      const input: CleanupEmptyMessagesInput = {
        execute: false,
        recoverFromRawContent: true,
        recoverFromClarification: true,
        markForDeletion: false,
      };

      const findEmptySpy = jest
        .spyOn(service, 'findEmptyAssistantMessages')
        .mockResolvedValue([
          {
            messageId: 'msg-1',
            sessionId: 'session-1',
            userId: 'user-1',
            role: MessageRole.ASSISTANT,
            content: '',
            rawContent: 'Recovered content',
            hasRecoverableRawContent: true,
            hasClarificationMetadata: false,
            sequenceOrder: 1,
            createdAt: new Date(),
          },
        ]);

      const findOneSpy = jest
        .spyOn(chatMessageRepository, 'findOne')
        .mockResolvedValue(mockChatMessage);

      const saveSpy = jest
        .spyOn(chatMessageRepository, 'save')
        .mockResolvedValue(mockChatMessage);

      const result = await service.cleanupEmptyMessages(input);

      expect(result.recoveredFromRawContent).toBe(1);
      expect(saveSpy).not.toHaveBeenCalled(); // Dry run should not save
    });

    it('should execute cleanup when execute is true', async () => {
      const input: CleanupEmptyMessagesInput = {
        execute: true,
        recoverFromRawContent: true,
        recoverFromClarification: true,
        markForDeletion: false,
      };

      const findEmptySpy = jest
        .spyOn(service, 'findEmptyAssistantMessages')
        .mockResolvedValue([
          {
            messageId: 'msg-1',
            sessionId: 'session-1',
            userId: 'user-1',
            role: MessageRole.ASSISTANT,
            content: '',
            rawContent: 'Recovered content',
            hasRecoverableRawContent: true,
            hasClarificationMetadata: false,
            sequenceOrder: 1,
            createdAt: new Date(),
          },
        ]);

      const recoveredMessage = { ...mockChatMessage };
      const findOneSpy = jest
        .spyOn(chatMessageRepository, 'findOne')
        .mockResolvedValue(recoveredMessage);

      const saveSpy = jest
        .spyOn(chatMessageRepository, 'save')
        .mockResolvedValue(recoveredMessage);

      const result = await service.cleanupEmptyMessages(input);

      expect(result.recoveredFromRawContent).toBe(1);
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('generateAffectedUsersReport', () => {
    it('should group messages by user', async () => {
      const findEmptySpy = jest
        .spyOn(service, 'findEmptyAssistantMessages')
        .mockResolvedValue([
          {
            messageId: 'msg-1',
            sessionId: 'session-1',
            userId: 'user-1',
            role: MessageRole.ASSISTANT,
            content: '',
            rawContent: 'content',
            hasRecoverableRawContent: true,
            hasClarificationMetadata: false,
            sequenceOrder: 1,
            createdAt: new Date(),
          },
          {
            messageId: 'msg-2',
            sessionId: 'session-1',
            userId: 'user-1',
            role: MessageRole.ASSISTANT,
            content: '',
            rawContent: 'content',
            hasRecoverableRawContent: true,
            hasClarificationMetadata: false,
            sequenceOrder: 2,
            createdAt: new Date(),
          },
          {
            messageId: 'msg-3',
            sessionId: 'session-2',
            userId: 'user-2',
            role: MessageRole.ASSISTANT,
            content: '',
            rawContent: null,
            hasRecoverableRawContent: false,
            hasClarificationMetadata: true,
            sequenceOrder: 1,
            createdAt: new Date(),
          },
        ]);

      const result = await service.generateAffectedUsersReport();

      expect(result.totalAffectedUsers).toBe(2);
      expect(result.totalEmptyMessages).toBe(3);
      expect(result.users).toHaveLength(2);
      expect(result.users[0].emptyMessageCount).toBe(2);
      expect(result.users[1].emptyMessageCount).toBe(1);
    });
  });

  describe('getEmptyMessagesForSession', () => {
    it('should return empty messages for specific session', async () => {
      const createQueryBuilder = jest.spyOn(
        chatMessageRepository,
        'createQueryBuilder',
      );

      const queryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockChatMessage]),
      };

      createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getEmptyMessagesForSession('session-1');

      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe('session-1');
    });
  });

  describe('getEmptyMessagesForUser', () => {
    it('should return empty messages for specific user', async () => {
      const createQueryBuilder = jest.spyOn(
        chatMessageRepository,
        'createQueryBuilder',
      );

      const messageWithSession = {
        ...mockChatMessage,
        session: { userId: 'user-1' } as any,
      };

      const queryBuilder: any = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([messageWithSession]),
      };

      createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getEmptyMessagesForUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
    });
  });

  describe('getUserEmptyMessageSummary', () => {
    it('should return summary for specific user', async () => {
      const getEmptySpy = jest
        .spyOn(service, 'getEmptyMessagesForUser')
        .mockResolvedValue([
          {
            messageId: 'msg-1',
            sessionId: 'session-1',
            userId: 'user-1',
            role: MessageRole.ASSISTANT,
            content: '',
            rawContent: 'content',
            hasRecoverableRawContent: true,
            hasClarificationMetadata: false,
            sequenceOrder: 1,
            createdAt: new Date(),
          },
          {
            messageId: 'msg-2',
            sessionId: 'session-2',
            userId: 'user-1',
            role: MessageRole.ASSISTANT,
            content: '',
            rawContent: null,
            hasRecoverableRawContent: false,
            hasClarificationMetadata: true,
            sequenceOrder: 1,
            createdAt: new Date(),
          },
        ]);

      const result = await service.getUserEmptyMessageSummary('user-1');

      expect(result.totalEmptyMessages).toBe(2);
      expect(result.withRecoverableRawContent).toBe(1);
      expect(result.withClarificationMetadata).toBe(1);
      expect(result.affectedSessions).toContain('session-1');
      expect(result.affectedSessions).toContain('session-2');
    });
  });
});
