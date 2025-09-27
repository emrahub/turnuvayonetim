import { EventStore, BaseEvent } from './event-store';
import {
  SecurityEvent,
  SecurityEventType,
  AuthErrorCode,
  UserInfo,
  OrganizationInfo,
  SessionInfo
} from '../types/auth-types';

// ================================================================
// AUTHENTICATION AUDIT SERVICE
// ================================================================

export class AuthAuditService {
  constructor(private eventStore: EventStore) {}

  // ================================================================
  // AUTHENTICATION EVENTS
  // ================================================================

  async logSuccessfulLogin(
    userId: string,
    organizationId: string,
    details: {
      email: string;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      loginMethod?: 'password' | 'two_factor' | 'refresh_token';
      registrationFlow?: boolean;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.LOGIN_SUCCESS,
      userId,
      organizationId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  async logFailedLogin(
    organizationId: string,
    details: {
      email: string;
      reason: string;
      ipAddress?: string;
      userAgent?: string;
      userId?: string;
      errorCode?: AuthErrorCode;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.LOGIN_FAILED,
      userId: details.userId,
      organizationId,
      details: {
        email: details.email,
        reason: details.reason,
        errorCode: details.errorCode
      },
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  async logAccountLocked(
    userId: string,
    organizationId: string,
    details: {
      email: string;
      lockoutUntil: Date;
      failedAttempts: number;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.ACCOUNT_LOCKED,
      userId,
      organizationId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  async logLogout(
    userId: string,
    organizationId: string,
    details: {
      sessionId?: string;
      logoutType: 'single' | 'all';
      revokedByUser?: boolean;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.LOGOUT,
      userId,
      organizationId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  // ================================================================
  // PASSWORD EVENTS
  // ================================================================

  async logPasswordChanged(
    userId: string,
    organizationId: string,
    details: {
      triggeredBy: 'user' | 'admin' | 'password_reset';
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.PASSWORD_CHANGED,
      userId,
      organizationId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  async logPasswordResetRequested(
    userId: string,
    organizationId: string,
    details: {
      email: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.PASSWORD_RESET_REQUESTED,
      userId,
      organizationId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  async logPasswordResetCompleted(
    userId: string,
    organizationId: string,
    details: {
      token: string; // Hashed token for audit trail
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.PASSWORD_RESET_COMPLETED,
      userId,
      organizationId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  // ================================================================
  // EMAIL VERIFICATION EVENTS
  // ================================================================

  async logEmailVerified(
    userId: string,
    organizationId: string,
    details: {
      email: string;
      verificationMethod: 'email_link' | 'admin_action';
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.EMAIL_VERIFIED,
      userId,
      organizationId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  // ================================================================
  // TWO-FACTOR AUTHENTICATION EVENTS
  // ================================================================

  async logTwoFactorEnabled(
    userId: string,
    organizationId: string,
    details: {
      method: 'totp' | 'sms' | 'backup_codes';
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.TWO_FACTOR_ENABLED,
      userId,
      organizationId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  async logTwoFactorDisabled(
    userId: string,
    organizationId: string,
    details: {
      method: 'password' | 'backup_code' | 'admin_action';
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.TWO_FACTOR_DISABLED,
      userId,
      organizationId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  async logTwoFactorFailed(
    userId: string,
    organizationId: string,
    details: {
      method: 'totp' | 'backup_code';
      remainingAttempts?: number;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.TWO_FACTOR_FAILED,
      userId,
      organizationId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  // ================================================================
  // TOKEN EVENTS
  // ================================================================

  async logTokenBlacklisted(
    userId: string,
    organizationId: string,
    details: {
      jti: string;
      tokenType: 'access' | 'refresh';
      reason: string;
      blacklistedBy?: 'user' | 'admin' | 'system';
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.TOKEN_BLACKLISTED,
      userId,
      organizationId,
      details
    });
  }

  // ================================================================
  // ORGANIZATION EVENTS
  // ================================================================

  async logOrganizationSwitched(
    userId: string,
    details: {
      fromOrganizationId: string;
      toOrganizationId: string;
      organizationSlug: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.ORGANIZATION_SWITCHED,
      userId,
      organizationId: details.toOrganizationId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  // ================================================================
  // SUSPICIOUS ACTIVITY EVENTS
  // ================================================================

  async logSuspiciousActivity(
    organizationId: string,
    details: {
      activityType: 'multiple_failed_logins' | 'unusual_location' | 'token_theft_detected' | 'brute_force_attack';
      userId?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      userId: details.userId,
      organizationId,
      details: {
        activityType: details.activityType,
        metadata: details.metadata
      },
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    });
  }

  // ================================================================
  // QUERY METHODS
  // ================================================================

  async getUserSecurityEvents(
    userId: string,
    organizationId: string,
    options?: {
      eventTypes?: SecurityEventType[];
      limit?: number;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<BaseEvent[]> {
    const eventTypes = options?.eventTypes?.map(type => type.toString()) || [];

    return this.eventStore.getOrganizationEvents(
      organizationId,
      eventTypes.length > 0 ? eventTypes : undefined,
      options?.limit || 100
    );
  }

  async getOrganizationSecurityEvents(
    organizationId: string,
    options?: {
      eventTypes?: SecurityEventType[];
      limit?: number;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<BaseEvent[]> {
    const eventTypes = options?.eventTypes?.map(type => type.toString()) || [];

    return this.eventStore.getOrganizationEvents(
      organizationId,
      eventTypes.length > 0 ? eventTypes : undefined,
      options?.limit || 100
    );
  }

  async getFailedLoginAttempts(
    organizationId: string,
    userId?: string,
    timeWindow: number = 3600000 // 1 hour in milliseconds
  ): Promise<BaseEvent[]> {
    const events = await this.eventStore.getOrganizationEvents(
      organizationId,
      [SecurityEventType.LOGIN_FAILED],
      100
    );

    const cutoffTime = new Date(Date.now() - timeWindow);

    return events.filter(event => {
      const eventTime = new Date(event.timestamp);
      const matchesUser = !userId || event.metadata?.userId === userId;
      const isRecent = eventTime >= cutoffTime;

      return matchesUser && isRecent;
    });
  }

  async getSuspiciousActivitySummary(
    organizationId: string,
    timeWindow: number = 86400000 // 24 hours in milliseconds
  ): Promise<{
    totalSuspiciousEvents: number;
    failedLogins: number;
    accountLockouts: number;
    twoFactorFailures: number;
    tokenViolations: number;
    uniqueIpAddresses: Set<string>;
    affectedUsers: Set<string>;
  }> {
    const suspiciousEventTypes = [
      SecurityEventType.LOGIN_FAILED,
      SecurityEventType.ACCOUNT_LOCKED,
      SecurityEventType.TWO_FACTOR_FAILED,
      SecurityEventType.TOKEN_BLACKLISTED,
      SecurityEventType.SUSPICIOUS_ACTIVITY
    ];

    const events = await this.eventStore.getOrganizationEvents(
      organizationId,
      suspiciousEventTypes.map(t => t.toString()),
      1000
    );

    const cutoffTime = new Date(Date.now() - timeWindow);
    const recentEvents = events.filter(event => new Date(event.timestamp) >= cutoffTime);

    const summary = {
      totalSuspiciousEvents: recentEvents.length,
      failedLogins: 0,
      accountLockouts: 0,
      twoFactorFailures: 0,
      tokenViolations: 0,
      uniqueIpAddresses: new Set<string>(),
      affectedUsers: new Set<string>()
    };

    recentEvents.forEach(event => {
      // Count by event type
      switch (event.eventType) {
        case SecurityEventType.LOGIN_FAILED:
          summary.failedLogins++;
          break;
        case SecurityEventType.ACCOUNT_LOCKED:
          summary.accountLockouts++;
          break;
        case SecurityEventType.TWO_FACTOR_FAILED:
          summary.twoFactorFailures++;
          break;
        case SecurityEventType.TOKEN_BLACKLISTED:
          summary.tokenViolations++;
          break;
      }

      // Collect IP addresses and user IDs
      if (event.eventData?.ipAddress) {
        summary.uniqueIpAddresses.add(event.eventData.ipAddress);
      }
      if (event.metadata?.userId) {
        summary.affectedUsers.add(event.metadata.userId);
      }
    });

    return summary;
  }

  // ================================================================
  // STREAM SECURITY EVENTS
  // ================================================================

  async *streamSecurityEvents(
    organizationId: string,
    options?: {
      eventTypes?: SecurityEventType[];
      fromEventId?: string;
    }
  ): AsyncGenerator<BaseEvent> {
    const eventTypes = options?.eventTypes?.map(type => type.toString()) || [];

    for await (const event of this.eventStore.streamEvents(
      organizationId,
      options?.fromEventId,
      eventTypes.length > 0 ? eventTypes : undefined
    )) {
      // Only yield security events
      if (event.aggregateType === 'SecurityEvent') {
        yield event;
      }
    }
  }

  // ================================================================
  // COMPLIANCE AND REPORTING
  // ================================================================

  async generateSecurityReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: {
      totalLogins: number;
      failedLogins: number;
      accountLockouts: number;
      passwordResets: number;
      twoFactorEvents: number;
    };
    topFailureReasons: Array<{ reason: string; count: number }>;
    ipAddressActivity: Array<{ ip: string; events: number; suspicious: boolean }>;
    userActivity: Array<{ userId: string; logins: number; failures: number }>;
    timelineData: Array<{ date: string; logins: number; failures: number }>;
  }> {
    // This would be implemented to generate comprehensive security reports
    // For now, return a basic structure
    return {
      summary: {
        totalLogins: 0,
        failedLogins: 0,
        accountLockouts: 0,
        passwordResets: 0,
        twoFactorEvents: 0
      },
      topFailureReasons: [],
      ipAddressActivity: [],
      userActivity: [],
      timelineData: []
    };
  }

  // ================================================================
  // PRIVATE HELPERS
  // ================================================================

  private async logSecurityEvent(event: {
    type: SecurityEventType;
    userId?: string;
    organizationId: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.eventStore.append(
        event.organizationId,
        event.userId || 'anonymous',
        'SecurityEvent',
        event.type,
        {
          ...event.details,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          timestamp: new Date().toISOString()
        },
        {
          userId: event.userId,
          timestamp: new Date(),
          sourceId: 'auth-audit-service'
        }
      );
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw here to avoid breaking auth flows
    }
  }
}

// ================================================================
// FACTORY FUNCTION
// ================================================================

export function createAuthAuditService(eventStore: EventStore): AuthAuditService {
  return new AuthAuditService(eventStore);
}

export default AuthAuditService;