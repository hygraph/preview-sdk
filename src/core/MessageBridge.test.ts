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

  it('sends ready message to any parent window using wildcard origin', () => {
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

    // Should send once with wildcard origin to reach any parent
    expect(mockBridge.postMessage).toHaveBeenCalledTimes(1);
    expect(mockBridge.postMessage).toHaveBeenCalledWith(readyMessage, '*');
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

  it('accepts messages from origins matching wildcard patterns', () => {
    bridge = new MessageBridge({
      allowedOrigins: ['https://*.hygraph.com', 'http://localhost:*'],
      debug: false,
      onMessage,
    });

    // Test wildcard domain pattern
    mockBridge.dispatch(
      {
        type: 'init',
        studioOrigin: 'https://app.hygraph.com',
        timestamp: Date.now(),
      },
      'https://app.hygraph.com'
    );

    expect(onMessage).toHaveBeenCalled();
    expect(bridge.isConnectedToStudio()).toBe(true);
    onMessage.mockClear();

    // Test wildcard port pattern
    const bridge2 = new MessageBridge({
      allowedOrigins: ['http://localhost:*'],
      debug: false,
      onMessage,
    });

    mockBridge.dispatch(
      {
        type: 'init',
        studioOrigin: 'http://localhost:3000',
        timestamp: Date.now(),
      },
      'http://localhost:3000'
    );

    expect(onMessage).toHaveBeenCalled();
    expect(bridge2.isConnectedToStudio()).toBe(true);

    bridge2.destroy();
  });

  it('rejects messages from origins not matching wildcard patterns', () => {
    bridge = new MessageBridge({
      allowedOrigins: ['https://*.hygraph.com'],
      debug: false,
      onMessage,
    });

    mockBridge.dispatch(
      {
        type: 'init',
        studioOrigin: 'https://malicious.example.com',
        timestamp: Date.now(),
      },
      'https://malicious.example.com'
    );

    expect(onMessage).not.toHaveBeenCalled();
    expect(bridge.isConnectedToStudio()).toBe(false);
  });
});

