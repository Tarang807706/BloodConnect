import { InAppChannel } from './channels/inApp.channel';
import { EmailChannel } from './channels/email.channel';
import { dbStore } from '../../data/dbStore';
import { BloodGroup, BloodComponent, CaseStatus } from '@bloodconnect/shared';
import { config } from '../../config/index';

export class NotificationService {
  /**
   * Template 1: Emergency Alert to Potential Donor
   * Safety Note: Strictly states "potential donor", no medical eligibility implied.
   */
  static async sendDonorEmergencyAlert(params: {
    userId: string;
    email: string;
    bloodGroup: BloodGroup;
    component: BloodComponent;
    distanceKm: number;
    caseId: string;
  }): Promise<void> {
    const title = `URGENT: Blood Coordination Request (${params.bloodGroup} ${params.component})`;
    const body = `An authorized blood centre has activated an emergency request approx ${params.distanceKm.toFixed(1)} km from your area. Please open BloodConnect to indicate if you can help.`;

    await InAppChannel.send({
      userId: params.userId,
      title,
      body,
      data: {
        type: 'EMERGENCY_ALERT',
        caseId: params.caseId,
        bloodGroup: params.bloodGroup,
        distanceKm: params.distanceKm,
      },
    });

    const emailSubject = `[BloodConnect] Urgent Blood Mobilization Request - ${params.bloodGroup}`;
    const emailBody = `Hello,\n\nA nearby authorized blood centre urgently requires voluntary donors for ${params.bloodGroup} (${params.component}).\n\nYour response only shows willingness to donate. The authorized blood centre performs all clinical testing and decides final eligibility.\n\nLog in to respond: ${config.WEB_URL}/donor/requests/${params.caseId}\n\nThank you,\nBloodConnect Emergency Network`;

    await EmailChannel.send({
      toEmail: params.email,
      userId: params.userId,
      subject: emailSubject,
      textBody: emailBody,
      htmlBody: `<p>${emailBody.replace(/\n/g, '<br/>')}</p>`,
    });
  }

  /**
   * Template 2: Response Acknowledgement to Donor
   */
  static async sendResponseAcknowledgement(params: {
    userId: string;
    email: string;
    caseId: string;
    canHelp: boolean;
  }): Promise<void> {
    const title = params.canHelp
      ? 'Willingness Recorded: Thank You!'
      : 'Response Recorded';

    const body = params.canHelp
      ? 'Your willingness to help has been relayed to the blood centre. Please report only if contacted or instructed. The centre determines clinical eligibility.'
      : 'Thank you for updating your availability. We will not disturb you further for this request.';

    await InAppChannel.send({
      userId: params.userId,
      title,
      body,
      data: {
        type: 'RESPONSE_ACK',
        caseId: params.caseId,
      },
    });
  }

  /**
   * Template 3: Escalation Alert to Blood Centre Staff
   */
  static async sendCentreEscalationAlert(params: {
    userId: string;
    caseId: string;
    fromStage: number;
    toStage: number;
    newStatus: CaseStatus;
  }): Promise<void> {
    const title = `Case Escalation: Advanced to Stage ${params.toStage}`;
    const body = `Emergency case has advanced to Stage ${params.toStage} (${params.newStatus}) due to timeout or response threshold. Review command center.`;

    await InAppChannel.send({
      userId: params.userId,
      title,
      body,
      data: {
        type: 'STAGE_ESCALATION',
        caseId: params.caseId,
        stage: params.toStage,
      },
    });
  }

  /**
   * Template 4: NGO Mobilization Activation
   */
  static async sendNgoActivationAlert(params: {
    userId: string;
    caseId: string;
    bloodGroup: BloodGroup;
    shortageUnits: number;
  }): Promise<void> {
    const title = `NGO Mobilization Activated: ${params.bloodGroup}`;
    const body = `Emergency Case requires community volunteer mobilization for ${params.shortageUnits} units of ${params.bloodGroup}. Please coordinate with local volunteers.`;

    await InAppChannel.send({
      userId: params.userId,
      title,
      body,
      data: {
        type: 'NGO_ACTIVATION',
        caseId: params.caseId,
      },
    });
  }

  /**
   * Template 5: Case Closed
   */
  static async sendCaseClosedAlert(params: {
    userId: string;
    caseId: string;
    status: CaseStatus;
    notes?: string;
  }): Promise<void> {
    const title = `Emergency Case Closed (${params.status})`;
    const body = `Case coordination has concluded. Status: ${params.status}. ${params.notes || ''}`;

    await InAppChannel.send({
      userId: params.userId,
      title,
      body,
      data: {
        type: 'CASE_CLOSED',
        caseId: params.caseId,
        status: params.status,
      },
    });
  }
}
