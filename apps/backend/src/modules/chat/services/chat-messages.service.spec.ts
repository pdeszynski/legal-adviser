import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { ChatSession } from '../entities/chat-session.entity';
import { ChatMessagesService } from './chat-messages.service';
import { ChatSessionsService } from './chat-sessions.service';

describe('ChatMessagesService', () => {
  let service: ChatMessagesService;
  let chatMessageRepository: Repository<ChatMessage>;
  let chatSessionRepository: Repository<ChatSession>;
  let chatSessionsService: ChatSessionsService;

  const mockUserId = 'user-uuid-123';
  const mockSessionId = 'session-uuid-456';

  const mockChatSession: ChatSession = {
    id: mockSessionId,
    userId: mockUserId,
    title: 'Test Session',
    mode: 'LAWYER' as any,
    messageCount: 0,
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    updateLastMessage: jest.fn(),
  } as any;

  const mockChatMessage: ChatMessage = {
    messageId: 'message-uuid-789',
    sessionId: mockSessionId,
    role: MessageRole.USER,
    content: 'Test message content',
    rawContent: 'Test message content',
    sequenceOrder: 0,
    citations: null,
    metadata: null,
    createdAt: new Date(),
    session: mockChatSession,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatMessagesService,
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: {
            create: jest.fn().mockReturnValue(mockChatMessage),
            save: jest.fn().mockResolvedValue(mockChatMessage),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ChatSession),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockChatSession),
            save: jest.fn().mockResolvedValue(mockChatSession),
          },
        },
        {
          provide: ChatSessionsService,
          useValue: {
            verifyOwnership: jest.fn().mockResolvedValue(true),
            generateTitleFromFirstMessage: jest.fn().mockResolvedValue({} as any),
          },
        },
      ],
    }).compile();

    service = module.get<ChatMessagesService>(ChatMessagesService);
    chatMessageRepository = module.get<Repository<ChatMessage>>(
      getRepositoryToken(ChatMessage),
    );
    chatSessionRepository = module.get<Repository<ChatSession>>(
      getRepositoryToken(ChatSession),
    );
    chatSessionsService = module.get<ChatSessionsService>(ChatSessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUserMessage', () => {
    it('should successfully create a user message with valid content', async () => {
      const createQueryBuilderSpy = jest.spyOn(chatMessageRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxOrder: null }),
      } as any);

      const result = await service.createUserMessage(mockSessionId, mockUserId, {
        content: 'Test user message',
      });

      expect(result).toBeDefined();
      expect(chatSessionsService.verifyOwnership).toHaveBeenCalledWith(
        mockSessionId,
        mockUserId,
      );
      createQueryBuilderSpy.mockRestore();
    });

    it('should throw BadRequestException when content is empty', async () => {
      await expect(
        service.createUserMessage(mockSessionId, mockUserId, {
          content: '',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createUserMessage(mockSessionId, mockUserId, {
          content: '',
        }),
      ).rejects.toThrow('Message content cannot be empty');
    });

    it('should throw BadRequestException when content is only whitespace', async () => {
      await expect(
        service.createUserMessage(mockSessionId, mockUserId, {
          content: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when content is null', async () => {
      await expect(
        service.createUserMessage(mockSessionId, mockUserId, {
          content: null as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set rawContent to the same value as content for user messages', async () => {
      jest.spyOn(chatMessageRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxOrder: null }),
      } as any);

      const content = 'Test user message';
      const createSpy = jest.spyOn(chatMessageRepository, 'create').mockReturnValue({
        ...mockChatMessage,
        content,
        rawContent: content,
      } as any);

      await service.createUserMessage(mockSessionId, mockUserId, { content });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          content,
          rawContent: content,
        }),
      );
    });
  });

  describe('createAssistantMessage', () => {
    it('should successfully create an assistant message with valid content', async () => {
      jest.spyOn(chatMessageRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxOrder: 0 }),
      } as any);

      const content = 'This is an AI response';
      const citations = [
        { source: 'Civil Code', article: 'Art. 123', url: 'https://example.com' },
      ];

      const result = await service.createAssistantMessage(
        mockSessionId,
        mockUserId,
        {
          content,
          citations,
          metadata: { confidence: 0.9, queryType: 'contract_law' },
        },
      );

      expect(result).toBeDefined();
      expect(chatSessionsService.verifyOwnership).toHaveBeenCalledWith(
        mockSessionId,
        mockUserId,
      );
    });

    it('should throw BadRequestException when content is empty', async () => {
      await expect(
        service.createAssistantMessage(mockSessionId, mockUserId, {
          content: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when content is null or undefined', async () => {
      await expect(
        service.createAssistantMessage(mockSessionId, mockUserId, {
          content: null as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set rawContent to the AI response for audit purposes', async () => {
      jest.spyOn(chatMessageRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxOrder: 0 }),
      } as any);

      const content = 'AI response content';
      const createSpy = jest.spyOn(chatMessageRepository, 'create').mockReturnValue({
        ...mockChatMessage,
        role: MessageRole.ASSISTANT,
        content,
        rawContent: content,
      } as any);

      await service.createAssistantMessage(mockSessionId, mockUserId, {
        content,
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          content,
          rawContent: content,
        }),
      );
    });

    it('should parse clarification JSON from content and store in metadata', async () => {
      jest.spyOn(chatMessageRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxOrder: 0 }),
      } as any);

      const clarificationJson = JSON.stringify({
        type: 'clarification',
        questions: [
          {
            question: 'When did this happen?',
            question_type: 'timeline',
          },
        ],
        context_summary: 'More details needed',
        next_steps: 'Please answer',
      });

      const createSpy = jest.spyOn(chatMessageRepository, 'create').mockReturnValue({
        ...mockChatMessage,
        role: MessageRole.ASSISTANT,
        content: clarificationJson,
      } as any);

      await service.createAssistantMessage(mockSessionId, mockUserId, {
        content: clarificationJson,
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            clarification: expect.objectContaining({
              needs_clarification: true,
              questions: expect.arrayContaining([
                expect.objectContaining({
                  question: 'When did this happen?',
                  question_type: 'timeline',
                }),
              ]),
            }),
          }),
        }),
      );
    });

    it('should store citations when provided', async () => {
      jest.spyOn(chatMessageRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxOrder: 0 }),
      } as any);

      const citations = [
        { source: 'Labour Code', article: 'Art. 94 § 1', url: 'https://isap.sejm.gov.pl/' },
      ];

      const createSpy = jest.spyOn(chatMessageRepository, 'create').mockReturnValue({
        ...mockChatMessage,
        role: MessageRole.ASSISTANT,
        citations,
      } as any);

      await service.createAssistantMessage(mockSessionId, mockUserId, {
        content: 'Legal advice with citations',
        citations,
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          citations,
        }),
      );
    });
  });

  describe('getConversationHistory', () => {
    it('should return messages in AI Engine format', async () => {
      const mockMessages = [
        {
          ...mockChatMessage,
          role: MessageRole.USER,
          content: 'User question',
          sequenceOrder: 0,
        },
        {
          ...mockChatMessage,
          messageId: 'message-uuid-790',
          role: MessageRole.ASSISTANT,
          content: 'AI response',
          sequenceOrder: 1,
        },
      ];

      jest.spyOn(chatMessageRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockMessages.reverse()),
      } as any);

      const history = await service.getConversationHistory(
        mockSessionId,
        mockUserId,
      );

      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        role: 'user',
        content: 'User question',
      });
      expect(history[1]).toEqual({
        role: 'assistant',
        content: 'AI response',
      });
    });

    it('should filter out SYSTEM messages', async () => {
      const mockMessages = [
        {
          ...mockChatMessage,
          role: MessageRole.USER,
          content: 'User question',
          sequenceOrder: 0,
        },
        {
          ...mockChatMessage,
          messageId: 'message-790',
          role: MessageRole.SYSTEM,
          content: 'System message',
          sequenceOrder: 1,
        },
        {
          ...mockChatMessage,
          messageId: 'message-791',
          role: MessageRole.ASSISTANT,
          content: 'AI response',
          sequenceOrder: 2,
        },
      ];

      jest.spyOn(chatMessageRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockMessages.reverse()),
      } as any);

      const history = await service.getConversationHistory(
        mockSessionId,
        mockUserId,
      );

      // Should not include the SYSTEM message
      expect(history).toHaveLength(2);
      expect(history.every((msg) => msg.role !== 'system')).toBe(true);
    });
  });

  describe('getMessageById', () => {
    it('should return message if found and ownership verified', async () => {
      jest.spyOn(chatMessageRepository, 'findOne').mockResolvedValue(
        mockChatMessage,
      );

      const result = await service.getMessageById(
        mockChatMessage.messageId,
        mockUserId,
      );

      expect(result).toBeDefined();
      expect(result?.messageId).toBe(mockChatMessage.messageId);
    });

    it('should return null if message not found', async () => {
      jest.spyOn(chatMessageRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getMessageById('non-existent-id', mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      jest.spyOn(chatMessageRepository, 'findOne').mockResolvedValue(
        mockChatMessage,
      );
      jest.spyOn(chatMessageRepository, 'remove').mockResolvedValue(undefined);

      await expect(
        service.deleteMessage(mockChatMessage.messageId, mockUserId),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException if message does not exist', async () => {
      jest.spyOn(chatMessageRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.deleteMessage('non-existent-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('countMessages', () => {
    it('should return the count of messages in a session', async () => {
      jest.spyOn(chatMessageRepository, 'count').mockResolvedValue(5);

      const count = await service.countMessages(mockSessionId);

      expect(count).toBe(5);
    });
  });

  describe('updateClarificationStatus', () => {
    it('should update clarification status to answered', async () => {
      const messageWithClarification = {
        ...mockChatMessage,
        role: MessageRole.ASSISTANT,
        metadata: {
          clarification: {
            needs_clarification: true,
            questions: [{ question: 'When?', question_type: 'timeline' }],
            context_summary: 'Need details',
            next_steps: 'Answer',
          },
        },
      };

      jest
        .spyOn(service, 'getMessageById')
        .mockResolvedValue(messageWithClarification);
      jest
        .spyOn(chatMessageRepository, 'save')
        .mockResolvedValue(messageWithClarification);

      const result = await service.updateClarificationStatus(
        mockChatMessage.messageId,
        mockUserId,
        true,
        JSON.stringify({ 'When?': '2024-01-01' }),
      );

      expect(result.metadata?.clarification?.answered).toBe(true);
    });

    it('should throw NotFoundException if message has no clarification', async () => {
      jest.spyOn(service, 'getMessageById').mockResolvedValue(mockChatMessage);

      await expect(
        service.updateClarificationStatus(
          mockChatMessage.messageId,
          mockUserId,
          true,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPendingClarification', () => {
    it('should return the most recent pending clarification', async () => {
      const pendingMessage = {
        ...mockChatMessage,
        role: MessageRole.ASSISTANT,
        sequenceOrder: 5,
        metadata: {
          clarification: {
            needs_clarification: true,
            questions: [{ question: 'When?', question_type: 'timeline' }],
            context_summary: 'Need details',
            next_steps: 'Answer',
            answered: false,
          },
        },
      };

      jest.spyOn(chatMessageRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([pendingMessage]),
      } as any);

      const result = await service.findPendingClarification(
        mockSessionId,
        mockUserId,
      );

      expect(result).toBeDefined();
      expect(result?.metadata?.clarification?.needs_clarification).toBe(true);
      expect(result?.metadata?.clarification?.answered).toBe(false);
    });

    it('should return null if no pending clarification exists', async () => {
      jest.spyOn(chatMessageRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await service.findPendingClarification(
        mockSessionId,
        mockUserId,
      );

      expect(result).toBeNull();
    });
  });
});
