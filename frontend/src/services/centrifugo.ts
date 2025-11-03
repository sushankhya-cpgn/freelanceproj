import { Centrifuge } from 'centrifuge';
import axiosInstance from '../api/axios';

class CentrifugoService {
  private centrifuge: Centrifuge | null = null;

  // Expose Centrifuge instance for event listening (read-only)
  getCentrifuge(): Centrifuge | null {
    return this.centrifuge;
  }
  private subscriptions: Map<string, any> = new Map();
  private desiredSubscriptions: Map<string, { kind: 'user'|'conversation'; handler: (data:any)=>void; currentUserId?: string; otherUserId?: string } > = new Map();
  private isConnecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private disabledForSession: boolean = false;
  private lastAttemptAt: number = 0;
  private minAttemptIntervalMs: number = 5000;

  private markSessionDisabled() {
    this.disabledForSession = true;
    try {
      (window as any).__CENTRIFUGO_SESSION_DISABLED__ = true;
    } catch {}
  }

  private isEnabled(): boolean {
    const ENV: any = (import.meta as any).env || {};
    const enabled = ENV.VITE_CENTRIFUGO_ENABLED === 'true';
    const url = ENV.VITE_CENTRIFUGO_URL as string | undefined;
    // Require explicit URL to avoid defaulting to a non-running localhost WS
    return enabled && !!url;
  }

  // Public status helpers for UI components
  isRealtimeEnabled(): boolean { return this.isEnabled(); }
  isSessionDisabled(): boolean {
    try {
      if ((window as any).__CENTRIFUGO_SESSION_DISABLED__) return true;
    } catch {}
    return this.disabledForSession;
  }

  async connect(userId: string) {
    if (this.isSessionDisabled()) {
      console.log('⚠️ Centrifugo disabled for this session due to previous transport failure');
      return;
    }
    const now = Date.now();
    if (now - this.lastAttemptAt < this.minAttemptIntervalMs) {
      // Too soon since last attempt; skip to avoid hammering
      return;
    }
    this.lastAttemptAt = now;
    // If already connected, return
    if (this.isConnected()) {
      console.log('✅ Centrifugo already connected');
      return;
    }

    // If currently connecting, wait for the connection
    if (this.isConnecting && this.connectionPromise) {
      console.log('🔄 Already connecting, waiting...');
      return this.connectionPromise;
    }

    // Start new connection
    this.isConnecting = true;
    this.connectionPromise = this._connect(userId);
    
    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async _connect(userId: string) {
    try {
      if (!this.isEnabled()) {
        console.log('⚠️ Centrifugo disabled via VITE_CENTRIFUGO_ENABLED');
        return;
      }
      // Disconnect existing connection if any
      if (this.centrifuge) {
        this.centrifuge.disconnect();
        this.centrifuge = null;
      }

      // Get connection token from backend
      const response = await axiosInstance.post('/centrifugo/token', {
        userId,
        userInfo: { userId }
      });

      const { token } = response.data.data || {};
      
      console.log('🔑 Token received:', token ? 'Yes' : 'No');
      console.log('🔑 Token length:', token?.length || 0);

      // Only use explicit env URL to connect. Skip if not provided.
      const resolvedUrl = (import.meta as any).env?.VITE_CENTRIFUGO_URL as string | undefined;
      if (!resolvedUrl) {
        console.log('⚠️ VITE_CENTRIFUGO_URL not set; skipping Centrifugo connection');
        return;
      }
      console.log('🔧 Using Centrifugo URL:', resolvedUrl);

      // Skip health check - Centrifugo doesn't have a /health endpoint by default
      // We'll handle connection errors in the connection handlers instead
      console.log('⏭️ Skipping health check, proceeding directly to WebSocket connection');
      // Optional: Preflight health check (disabled by default to avoid CORS noise in browser)
      try {
        const ENV: any = (import.meta as any).env || {};
        const healthCheckEnabled = ENV.VITE_CENTRIFUGO_HEALTHCHECK_ENABLED === 'true';
        if (healthCheckEnabled) {
          const u = new URL(resolvedUrl);
          const healthUrl = `${u.protocol.replace('ws', 'http')}//${u.host}/health`;
          const ctl = new AbortController();
          const t = setTimeout(() => ctl.abort(), 1500);
          // Use no-cors to avoid CORS errors in dev; result will be opaque
          await fetch(healthUrl, { signal: ctl.signal, mode: 'no-cors' as RequestMode });
          clearTimeout(t);
        }
      } catch (e) {
        // Ignore health errors; proceed to WS connect regardless
        console.warn('⚠️ Health check failed; proceeding to WebSocket connection:', e);
      }

      // Create Centrifuge client
      this.centrifuge = new Centrifuge(resolvedUrl, {
        token,
      });

      console.log('🚀 Creating Centrifuge client with token:', token ? 'provided' : 'none');

      // Setup connection handlers
      this.centrifuge.on('connecting', (ctx) => {
        console.log('🔄 Connecting to Centrifugo...', ctx);
      });

      this.centrifuge.on('connected', (ctx) => {
        console.log('✅ Connected to Centrifugo', ctx);
        console.log('🔄 Re-subscribing to', this.desiredSubscriptions.size, 'channels');
        // Re-subscribe all desired subscriptions on fresh connection
        try {
          this.desiredSubscriptions.forEach((meta, channelName) => {
            console.log('🔄 Re-subscribing to:', channelName);
            if (meta.kind === 'user' && meta.currentUserId) {
              this._subscribeUser(meta.currentUserId, meta.handler);
            } else if (meta.kind === 'conversation' && meta.currentUserId && meta.otherUserId) {
              this._subscribeConversation(meta.currentUserId, meta.otherUserId, meta.handler);
            }
          });
        } catch (e) {
          console.error('❌ Failed to re-subscribe desired channels:', e);
        }
      });

      this.centrifuge.on('disconnected', (ctx: any) => {
        console.log('⚠️ Disconnected from Centrifugo:', ctx?.reason || 'unknown');
        // Centrifuge will automatically attempt to reconnect
      });

      this.centrifuge.on('error', (ctx: any) => {
        const t = ctx?.type || 'unknown';
        const msg = ctx?.message || 'unknown';
        console.error('❌ Centrifugo error:', t, msg);
        // Don't disable session - let Centrifuge handle auto-reconnect
      });

      // Connect
      this.centrifuge.connect();

      console.log('🚀 Centrifugo service initialized for user:', userId);
    } catch (error) {
      console.error('❌ Failed to connect to Centrifugo:', error);
      // Don't disable session on connection failure - let it retry automatically
      // This allows the connection to be re-attempted on subsequent calls
      throw error;
    }
  }

  subscribeToUserNotifications(
    userId: string,
    onNotification: (notification: any) => void
  ) {
    if (!this.isEnabled() || this.disabledForSession) return null;
    const channelName = `user:${userId}`;
    // record desired subscription so it auto-subscribes on connect
    this.desiredSubscriptions.set(channelName, { kind: 'user', handler: onNotification, currentUserId: userId });

    if (!this.centrifuge) {
      this.connect(userId).catch(() => {});
      return null;
    }
    
    return this._subscribeUser(userId, onNotification);
  }

  private _subscribeUser(userId: string, onNotification: (notification: any)=>void) {
    if (!this.centrifuge) return null;
    const channelName = `user:${userId}`;
    console.log('🔔 Subscribing to user notifications:', channelName);

    // Check if subscription already exists in Centrifuge client
    let subscription = this.centrifuge.getSubscription(channelName);
    
    if (subscription) {
      console.log('🔄 User notification subscription already exists, re-attaching handlers');
      // Remove all old listeners but keep the subscription
      subscription.removeAllListeners('publication');
      subscription.removeAllListeners('subscribed');
      subscription.removeAllListeners('error');
      subscription.removeAllListeners('unsubscribed');
      
      // Add new handlers
      subscription.on('publication', (_ctx) => {
        console.log('🔔 Notification received:', _ctx.data);
        onNotification(_ctx.data);
      });

      subscription.on('subscribed', (_ctx) => {
        console.log('✅ Subscription re-activated for user notifications:', channelName);
      });

      subscription.on('error', (_ctx) => {
        console.error('❌ User notification subscription error:', _ctx);
      });

      subscription.on('unsubscribed', (_ctx) => {
        console.warn('⚠️ Unsubscribed from user notifications:', channelName, ':', _ctx);
      });

      this.subscriptions.set(channelName, subscription);
      
      // Ensure subscription is active
      if (subscription.state !== 'subscribed' && subscription.state !== 'subscribing') {
        console.log('🔄 Re-subscribing to user channel (state:', subscription.state, ')');
        subscription.subscribe();
      }
      return subscription;
    }

    // Create new subscription
    console.log('✨ Creating new subscription for user notifications:', channelName);
    subscription = this.centrifuge.newSubscription(channelName);

    subscription.on('publication', (_ctx) => {
      console.log('🔔 Notification received:', _ctx.data);
      onNotification(_ctx.data);
    });

    subscription.on('subscribed', (_ctx) => {
      console.log('✅ Subscribed to user notifications:', channelName);
    });

    subscription.on('error', (_ctx) => {
      console.error('❌ User notification subscription error:', _ctx);
    });

    subscription.on('unsubscribed', (_ctx) => {
      console.warn('⚠️ Unsubscribed from user notifications:', channelName, ':', _ctx);
    });

    subscription.subscribe();
    this.subscriptions.set(channelName, subscription);

    return subscription;
  }

  subscribeToConversation(
    currentUserId: string,
    otherUserId: string,
    onMessage: (message: any) => void
  ) {
    console.log('🔔 subscribeToConversation called for users:', currentUserId, otherUserId);
    console.log('🔔 isEnabled:', this.isEnabled(), 'disabledForSession:', this.disabledForSession);
    
    if (!this.isEnabled() || this.disabledForSession) {
      console.warn('⚠️ Centrifugo is disabled, cannot subscribe');
      return null;
    }
    
    // record desired subscription so it auto-subscribes on connect
    const channelName = this.getConversationChannel(currentUserId, otherUserId);
    console.log('📡 Channel name:', channelName);
    this.desiredSubscriptions.set(channelName, { kind: 'conversation', handler: onMessage, currentUserId, otherUserId });

    if (!this.centrifuge) {
      console.warn('⚠️ No centrifuge client, attempting to connect...');
      // try to connect once lazily; fire and forget
      this.connect(currentUserId).catch(() => {});
      return null;
    }

    console.log('✅ Centrifuge client exists, subscribing...');
    return this._subscribeConversation(currentUserId, otherUserId, onMessage);
  }

  private _subscribeConversation(
    currentUserId: string,
    otherUserId: string,
    onMessage: (message:any)=>void
  ) {
    if (!this.centrifuge) {
      console.log('❌ No centrifuge client available');
      return null;
    }

    const channelName = this.getConversationChannel(currentUserId, otherUserId);
    console.log('📡 Subscribing to channel:', channelName);

    // Check if subscription already exists in Centrifuge client
    let subscription = this.centrifuge.getSubscription(channelName);

    if (subscription) {
      console.log('🔄 Subscription already exists, re-attaching handlers');
      // Remove old publication listeners but keep the subscription
      subscription.removeAllListeners('publication');
      subscription.removeAllListeners('subscribed');
      subscription.removeAllListeners('error');
      subscription.removeAllListeners('unsubscribed');
      
      // Add new handlers
      subscription.on('publication', (ctx: any) => {
        console.log('📨 Message received on existing subscription:', channelName, ctx.data);
        onMessage(ctx.data);
      });

      subscription.on('subscribed', (_ctx) => {
        console.log('✅ Subscription re-activated for channel:', channelName);
      });

      subscription.on('error', (_ctx) => {
        console.error('❌ Subscription error for', channelName, ':', _ctx);
      });

      subscription.on('unsubscribed', (_ctx) => {
        console.warn('⚠️ Unsubscribed from', channelName, ':', _ctx);
      });

      this.subscriptions.set(channelName, subscription);
      
      // Ensure subscription is active
      if (subscription.state !== 'subscribed' && subscription.state !== 'subscribing') {
        console.log('🔄 Re-subscribing to channel (state:', subscription.state, ')');
        subscription.subscribe();
      }
      return subscription;
    }

    // Create new subscription
    console.log('✨ Creating new subscription for', channelName);
    subscription = this.centrifuge.newSubscription(channelName);

    // Set up event handlers
    subscription.on('publication', (ctx: any) => {
      console.log('📨 Message received on subscription:', channelName, ctx.data);
      onMessage(ctx.data);
    });

    subscription.on('subscribed', (_ctx) => {
      console.log('✅ Successfully subscribed to channel:', channelName);
    });

    subscription.on('error', (_ctx) => {
      console.error('❌ Subscription error for', channelName, ':', _ctx);
    });

    subscription.on('unsubscribed', (_ctx) => {
      console.warn('⚠️ Unsubscribed from', channelName, ':', _ctx);
    });

    // Subscribe and store
    subscription.subscribe();
    this.subscriptions.set(channelName, subscription);

    return subscription;
  }

  unsubscribeFromUserNotifications(userId: string) {
    const channelName = `user:${userId}`;

    if (this.subscriptions.has(channelName)) {
      const subscription = this.subscriptions.get(channelName);
      try {
        subscription.unsubscribe();
        subscription.removeAllListeners();
        if (this.centrifuge && (this.centrifuge as any).subscriptions) {
          delete (this.centrifuge as any).subscriptions[channelName];
        }
      } catch (e) {
        console.warn('Warning while unsubscribing from user notifications:', e);
      }
      this.subscriptions.delete(channelName);
      console.log('🔔 Unsubscribed from user notifications:', channelName);
    }
    // Also remove from desired subscriptions
    if (this.desiredSubscriptions.has(channelName)) this.desiredSubscriptions.delete(channelName);
  }

  unsubscribeFromConversation(currentUserId: string, otherUserId: string) {
    const channelName = this.getConversationChannel(currentUserId, otherUserId);

    if (this.subscriptions.has(channelName)) {
      const subscription = this.subscriptions.get(channelName);
      try {
        subscription.unsubscribe();
        subscription.removeAllListeners();
        // Important: Remove the subscription completely from Centrifuge client
        if (this.centrifuge && (this.centrifuge as any).subscriptions) {
          delete (this.centrifuge as any).subscriptions[channelName];
        }
      } catch (e) {
        console.warn('Warning while unsubscribing:', e);
      }
      this.subscriptions.delete(channelName);
      console.log('🔕 Unsubscribed from:', channelName);
    }
    // Also remove from desired subscriptions
    if (this.desiredSubscriptions.has(channelName)) this.desiredSubscriptions.delete(channelName);
  }

  /**
   * Send a message via API. Supports text, file, and video_call messages.
   * @param receiverId - ID of the receiver
   * @param content - Message content (string or object)
   * @param messageType - Type of message ('text', 'file', 'video_call', etc.)
   * @param attachments - Optional array of File objects for file messages
   */
  async sendMessage(receiverId: string, content: string | object, messageType: string = 'text', attachments?: File[]) {
    try {
      const token = localStorage.getItem('token');
      let response;
      if (attachments && attachments.length > 0) {
        // File message: use FormData
        const formData = new FormData();
        formData.append('receiverId', receiverId.toString());
        formData.append('content', typeof content === 'string' ? content : JSON.stringify(content));
        formData.append('messageType', messageType);
        attachments.forEach(file => {
          formData.append('files', file);
        });
        response = await axiosInstance.post('/messages', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Text or video_call message: send JSON
        response = await axiosInstance.post('/messages', {
          receiverId,
          content: typeof content === 'string' ? content : JSON.stringify(content),
          messageType
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      console.log('✅ Message sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  getConversationChannel(userId1: string, userId2: string): string {
    // Sort IDs to ensure consistent channel name regardless of order (match backend)
    const sortedIds = [parseInt(userId1), parseInt(userId2)].sort((a, b) => a - b);
    return `conversation:${sortedIds[0]}:${sortedIds[1]}`;
  }

  disconnect() {
    if (this.centrifuge) {
      // Unsubscribe from all channels
      this.subscriptions.forEach((subscription, channel) => {
        try {
          subscription.unsubscribe();
          subscription.removeAllListeners();
          console.log('🔕 Unsubscribed from:', channel);
        } catch (e) {
          console.warn('Warning while unsubscribing:', e);
        }
      });
      this.subscriptions.clear();
      this.desiredSubscriptions.clear();

      // Disconnect
      this.centrifuge.disconnect();
      this.centrifuge = null;
      console.log('🔌 Centrifugo disconnected');
    }
    
    // Reset connection state
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  isConnected(): boolean {
    return this.centrifuge !== null && this.centrifuge.state === 'connected';
  }
}

// Export singleton instance
const centrifugoService = new CentrifugoService();
export default centrifugoService;

