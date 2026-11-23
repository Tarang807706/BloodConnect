import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/index';
import { dbStore, UserRecord } from '../../data/dbStore';
import { AppError } from '../../common/errors/AppError';
import { mapProvider } from '../maps/map.provider';
import { AuditService } from '../audit/audit.service';
import {
  UserRole,
  RegisterDonorInput,
  LoginInput,
  AuthTokens,
  JwtUserPayload,
} from '@bloodconnect/shared';

export class AuthService {
  static async registerDonor(input: RegisterDonorInput): Promise<AuthTokens> {
    const existing = await dbStore.users.findUnique({ where: { email: input.email } });
    if (existing) {
      throw AppError.conflict('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const approx = mapProvider.toApproximateCoordinates({
      lat: input.approxLat,
      lng: input.approxLng,
    });
    const gridCell = mapProvider.toGridCell(approx);

    const user = await dbStore.users.create({
      email: input.email.toLowerCase(),
      passwordHash,
      fullName: input.fullName,
      role: UserRole.DONOR,
      isActive: true,
      organizationId: null,
    });

    const donorProfile = await dbStore.donorProfiles.create({
      userId: user.id,
      bloodGroup: input.bloodGroup,
      phone: input.phone,
      city: input.city,
      area: input.area,
      approxLat: approx.lat,
      approxLng: approx.lng,
      gridCell,
      isAvailable: true,
      maxTravelKm: 15,
      preferredComponents: 'WHOLE_BLOOD',
      allowedChannels: 'IN_APP,EMAIL',
    });

    await AuditService.log({
      actorUserId: user.id,
      actorRole: UserRole.DONOR,
      action: 'DONOR_REGISTERED',
      targetEntity: 'users',
      targetId: user.id,
      details: { email: user.email, bloodGroup: input.bloodGroup },
    });

    return AuthService.generateAuthTokens(user, donorProfile.id);
  }

  static async login(input: LoginInput): Promise<AuthTokens> {
    const user = await dbStore.users.findUnique({ where: { email: input.email } });
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw AppError.forbidden('This account has been deactivated. Please contact an administrator.');
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    let donorProfileId: string | null = null;
    let organizationName: string | null = null;

    if (user.role === UserRole.DONOR) {
      const donor = await dbStore.donorProfiles.findUniqueByUserId(user.id);
      donorProfileId = donor ? donor.id : null;
    } else if (user.organizationId) {
      const org = await dbStore.organizations.findUnique(user.organizationId);
      if (org) {
        organizationName = org.name;
      }
    }

    await AuditService.log({
      actorUserId: user.id,
      actorRole: user.role,
      action: 'USER_LOGIN',
      targetEntity: 'users',
      targetId: user.id,
    });

    return AuthService.generateAuthTokens(user, donorProfileId, organizationName);
  }

  static async refreshTokens(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const existingToken = await dbStore.refreshTokens.findUnique(tokenHash);

    if (!existingToken) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    // Family-based reuse detection
    if (existingToken.isRevoked) {
      await dbStore.refreshTokens.revokeFamily(existingToken.tokenFamily);
      throw AppError.forbidden('Suspicious token reuse detected. All sessions in this family revoked.');
    }

    if (new Date(existingToken.expiresAt) < new Date()) {
      throw AppError.unauthorized('Refresh token expired. Please log in again.');
    }

    // Revoke old token
    await dbStore.refreshTokens.revokeToken(existingToken.id);

    const user = await dbStore.users.findUnique({ where: { id: existingToken.userId } });
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User not found or inactive');
    }

    let donorProfileId: string | null = null;
    if (user.role === UserRole.DONOR) {
      const donor = await dbStore.donorProfiles.findUniqueByUserId(user.id);
      donorProfileId = donor ? donor.id : null;
    }

    return AuthService.generateAuthTokens(user, donorProfileId, null, existingToken.tokenFamily);
  }

  static async logout(rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      const existing = await dbStore.refreshTokens.findUnique(tokenHash);
      if (existing) {
        await dbStore.refreshTokens.revokeToken(existing.id);
      }
    }
  }

  static async getCurrentUser(userId: string) {
    const user = await dbStore.users.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');

    let donorProfile: any = null;
    let organization: any = null;

    if (user.role === UserRole.DONOR) {
      donorProfile = await dbStore.donorProfiles.findUniqueByUserId(user.id);
    } else if (user.organizationId) {
      organization = await dbStore.organizations.findUnique(user.organizationId);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      organizationId: user.organizationId,
      organization,
      donorProfile,
    };
  }

  private static async generateAuthTokens(
    user: UserRecord,
    donorProfileId: string | null = null,
    organizationName: string | null = null,
    existingFamily?: string
  ): Promise<AuthTokens> {
    const tokenFamily = existingFamily || uuidv4();

    const payload: JwtUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      donorProfileId,
      tokenFamily,
    };

    const accessToken = jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const rawRefreshToken = `${uuidv4()}-${uuidv4()}`;
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await dbStore.refreshTokens.create({
      userId: user.id,
      tokenHash,
      tokenFamily,
      isRevoked: false,
      expiresAt: expiresAt.toISOString(),
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        organizationId: user.organizationId,
        organizationName,
        donorProfileId,
      },
    };
  }
}
