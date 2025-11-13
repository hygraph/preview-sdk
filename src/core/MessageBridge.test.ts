import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MessageBridge } from './MessageBridge';
import { createMockMessageBridge } from '../test-utils';

const allowedOrigins = ['https://app.hygraph.com', 'http://localhost:3000'];

describe('MessageBridge', () => {
  let bridge: MessageBridge | null;
  let mockBridge: ReturnType<typeof createMockMessageBridge>;
  let onMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockBridge = createMockMessageBridge();
    onMessage = vi.fn();
    bridge = null;
  });

  afterEach(() => {
    bridge?.destroy();
    mockBridge.restore();
    vi.restoreAllMocks();
  });

  it('queues messages until a Studio connection is established', () => {
    bridge = new MessageBridge({
      debug: false,
      allowedOrigins,
      onMessage,
    });

    const message = {
      type: 'field-click' as const,
      entryId: 'entry-1',
      timestamp: Date.now(),
    };

    const result = bridge.sendMessage(message);

    expect(result).toBe(false);
    expect(mockBridge.postMessage).not.toHaveBeenCalled();

    mockBridge.dispatch(
      {
        type: 'init',
        studioOrigin: allowedOrigins[0],
        timestamp: Date.now(),
      },
      allowedOrigins[0]
    );

    expect(mockBridge.postMessage).toHaveBeenCalledTimes(1);
    expect(mockBridge.postMessage).toHaveBeenCalledWith(message, allowedOrigins[0]);
    expect(bridge.isConnectedToStudio()).toBe(true);
  });

  it('broadcasts ready message to all allowed origins', () => {
    bridge = new MessageBridge({
      allowedOrigins,
      debug: false,
      onMessage,
    });

    const readyMessage = {
      type: 'ready' as const,
      sdkVersion: 'test-suite',
      timestamp: Date.now(),
      capabilities: { fieldFocusSync: true },
    };

    bridge.sendReadyMessage(readyMessage);

    expect(mockBridge.postMessage).toHaveBeenCalledTimes(allowedOrigins.length);
    const targets = mockBridge.messages.map(({ targetOrigin }) => targetOrigin);
    expect(targets).toEqual(expect.arrayContaining(allowedOrigins));
  });

  it('ignores messages from disallowed origins', () => {
    bridge = new MessageBridge({
      allowedOrigins,
      debug: true,
      onMessage,
    });

    mockBridge.dispatch(
      {
        type: 'init',
        studioOrigin: 'https://malicious.example',
        timestamp: Date.now(),
      },
      'https://malicious.example'
    );

    expect(onMessage).not.toHaveBeenCalled();
    expect(bridge.isConnectedToStudio()).toBe(false);
  });

  it('forwards valid Studio messages to the handler', () => {
    bridge = new MessageBridge({
      allowedOrigins,
      debug: false,
      onMessage,
    });

    const validMessage = {
      type: 'content-saved' as const,
      entryId: 'entry-2',
      timestamp: Date.now(),
    };

    mockBridge.dispatch(
      {
        type: 'init',
        studioOrigin: allowedOrigins[0],
        timestamp: Date.now(),
      },
      allowedOrigins[0]
    );

    mockBridge.dispatch(validMessage, allowedOrigins[0]);

    expect(onMessage).toHaveBeenCalledWith(validMessage);
  });
});

