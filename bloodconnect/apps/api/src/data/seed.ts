import bcrypt from 'bcryptjs';
import { dbStore } from './dbStore';
import { mapProvider } from '../modules/maps/map.provider';
import { logger } from '../common/logger/pino';
import {
  UserRole,
  OrganizationType,
  OrganizationStatus,
  BloodGroup,
  BloodComponent,
  Urgency,
  RequestStatus,
  CaseStatus,
  StageActionType,
  ResponseType,
  DonationOutcomeType,
} from '@bloodconnect/shared';

export async function seedDatabase(reset = false) {
  if (reset) {
    dbStore.clear();
  }

  const passwordHash = await bcrypt.hash('Password@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);

  // 1. Seed Case Stage Rules
  await dbStore.caseStageRules.upsert({
    stageNumber: 1,
    actionType: StageActionType.NOTIFY_DONORS,
    radiusKm: 5,
    timeoutMinutes: 10,
    minResponsesFactor: 1.5,
    autoAdvanceOnTimeout: true,
  });
  await dbStore.caseStageRules.upsert({
    stageNumber: 2,
    actionType: StageActionType.NOTIFY_DONORS,
    radiusKm: 15,
    timeoutMinutes: 10,
    minResponsesFactor: 1.5,
    autoAdvanceOnTimeout: true,
  });
  await dbStore.caseStageRules.upsert({
    stageNumber: 3,
    actionType: StageActionType.ACTIVATE_NGO,
    radiusKm: 30,
    timeoutMinutes: 15,
    minResponsesFactor: 2.0,
    autoAdvanceOnTimeout: true,
  });
  await dbStore.caseStageRules.upsert({
    stageNumber: 4,
    actionType: StageActionType.ESCALATE_CENTRES,
    radiusKm: 50,
    timeoutMinutes: 20,
    minResponsesFactor: 2.0,
    autoAdvanceOnTimeout: false,
  });

  // 2. Seed Relevant Group Mappings (Standard 1:1 default)
  const bloodGroups = Object.values(BloodGroup);
  for (const bg of bloodGroups) {
    await dbStore.relevantGroupMappings.setMapping(bg, bg, 'Default administrative same-group notification');
  }

  // 3. Seed System Config
  await dbStore.systemConfigs.upsert('EMERGENCY_OVERRIDE_QUIET_HOURS', 'true', 'Allows CRITICAL urgency alerts during quiet hours');
  await dbStore.systemConfigs.upsert('MAX_STAGE_HOURS', '4', 'Maximum allowed active coordination window before audit review');

  // 4. Seed Admin
  const adminUser = await dbStore.users.create({
    id: 'user-admin-01',
    email: 'admin@bloodconnect.org',
    passwordHash: adminPasswordHash,
    fullName: 'Chief Medical Administrator',
    role: UserRole.ADMIN,
    isActive: true,
    organizationId: null,
  });

  // 5. Seed 3 Hospitals
  const hospitals = [
    {
      id: 'org-hosp-01',
      name: 'Victoria Hospital & Trauma Centre',
      email: 'hospital.victoria@bloodconnect.org',
      license: 'KA-HOSP-2021-001',
      city: 'Bengaluru',
      area: 'Kalasipalya / Fort',
      lat: 12.96,
      lng: 77.58,
    },
    {
      id: 'org-hosp-02',
      name: 'Manipal Hospital Speciality Centre',
      email: 'hospital.manipal@bloodconnect.org',
      license: 'KA-HOSP-2022-045',
      city: 'Bengaluru',
      area: 'Old Airport Road',
      lat: 12.96,
      lng: 77.65,
    },
    {
      id: 'org-hosp-03',
      name: 'Narayana Multispeciality Hospital',
      email: 'hospital.narayana@bloodconnect.org',
      license: 'KA-HOSP-2023-112',
      city: 'Bengaluru',
      area: 'Electronic City',
      lat: 12.85,
      lng: 77.66,
    },
  ];

  for (const h of hospitals) {
    const org = await dbStore.organizations.create({
      id: h.id,
      name: h.name,
      type: OrganizationType.HOSPITAL,
      status: OrganizationStatus.ACTIVE,
      licenseNumber: h.license,
      contactEmail: h.email,
      contactPhone: '+91 80 2670 1150',
      city: h.city,
      area: h.area,
      approxLat: h.lat,
      approxLng: h.lng,
      gridCell: `GRID_${h.lat}_${h.lng}`,
    });
    await dbStore.hospitalProfiles.create({
      organizationId: org.id,
      emergencyHelpline: '108',
      bedCapacity: 500,
    });
    await dbStore.users.create({
      email: h.email,
      passwordHash,
      fullName: `${h.name} Coordinator`,
      role: UserRole.HOSPITAL,
      isActive: true,
      organizationId: org.id,
    });
  }

  // 6. Seed 3 Blood Centres
  const centres = [
    {
      id: 'org-centre-01',
      name: 'Indian Red Cross Society Blood Centre',
      email: 'centre.redcross@bloodconnect.org',
      license: 'KA-BC-2018-009',
      city: 'Bengaluru',
      area: 'Race Course Road',
      lat: 12.98,
      lng: 77.58,
    },
    {
      id: 'org-centre-02',
      name: 'Rotary Bangalore Blood Centre',
      email: 'centre.rotary@bloodconnect.org',
      license: 'KA-BC-2019-033',
      city: 'Bengaluru',
      area: 'Ulsoor / Halasuru',
      lat: 12.98,
      lng: 77.62,
    },
    {
      id: 'org-centre-03',
      name: 'Bowring Regional Transfusion Centre',
      email: 'centre.bowring@bloodconnect.org',
      license: 'KA-BC-2020-051',
      city: 'Bengaluru',
      area: 'Shivajinagar',
      lat: 12.98,
      lng: 77.60,
    },
  ];

  for (const c of centres) {
    const org = await dbStore.organizations.create({
      id: c.id,
      name: c.name,
      type: OrganizationType.BLOOD_CENTRE,
      status: OrganizationStatus.ACTIVE,
      licenseNumber: c.license,
      contactEmail: c.email,
      contactPhone: '+91 80 2226 4422',
      city: c.city,
      area: c.area,
      approxLat: c.lat,
      approxLng: c.lng,
      gridCell: `GRID_${c.lat}_${c.lng}`,
    });
    await dbStore.bloodCentreProfiles.create({
      organizationId: org.id,
      storageCapacityUnits: 800,
      operatingHours: '24x7',
    });
    await dbStore.users.create({
      email: c.email,
      passwordHash,
      fullName: `${c.name} Officer`,
      role: UserRole.BLOOD_CENTRE,
      isActive: true,
      organizationId: org.id,
    });
  }

  // 7. Seed 2 NGOs
  const ngos = [
    {
      id: 'org-ngo-01',
      name: 'Lions Blood Mobilization Foundation',
      email: 'ngo.lions@bloodconnect.org',
      license: 'KA-NGO-2019-881',
      city: 'Bengaluru',
      area: 'Jayanagar',
      lat: 12.93,
      lng: 77.58,
    },
    {
      id: 'org-ngo-02',
      name: 'Sankalp Emergency Blood Volunteers',
      email: 'ngo.sankalp@bloodconnect.org',
      license: 'KA-NGO-2020-412',
      city: 'Bengaluru',
      area: 'Indiranagar',
      lat: 12.97,
      lng: 77.64,
    },
  ];

  for (const n of ngos) {
    const org = await dbStore.organizations.create({
      id: n.id,
      name: n.name,
      type: OrganizationType.NGO,
      status: OrganizationStatus.ACTIVE,
      licenseNumber: n.license,
      contactEmail: n.email,
      contactPhone: '+91 80 2656 7799',
      city: n.city,
      area: n.area,
      approxLat: n.lat,
      approxLng: n.lng,
      gridCell: `GRID_${n.lat}_${n.lng}`,
    });
    const profile = await dbStore.ngoProfiles.create({
      organizationId: org.id,
      volunteerCountEstimate: 25,
      primaryContactName: 'Community Mobilization Lead',
    });
    await dbStore.users.create({
      email: n.email,
      passwordHash,
      fullName: `${n.name} Coordinator`,
      role: UserRole.NGO,
      isActive: true,
      organizationId: org.id,
    });

    // Seed 5 volunteers per NGO
    for (let v = 1; v <= 5; v++) {
      await dbStore.volunteers.create({
        ngoProfileId: profile.id,
        fullName: `${n.name} Volunteer #${v}`,
        phone: `+91 98450 ${10000 + v}`,
        email: `volunteer${v}.${n.id}@bloodconnect.org`,
        city: 'Bengaluru',
        area: n.area,
        approxLat: n.lat,
        approxLng: n.lng,
        gridCell: `GRID_${n.lat}_${n.lng}`,
        bloodGroup: BloodGroup.O_POS,
        specialSkills: v === 1 ? 'Emergency Ambulance Driver' : 'Community Mobilizer',
        isActive: true,
      });
    }
  }

  // 8. Seed Standard Showcase Donor
  const showcaseDonorUser = await dbStore.users.create({
    id: 'user-donor-showcase',
    email: 'donor@bloodconnect.org',
    passwordHash,
    fullName: 'Rahul Sharma (Showcase Voluntary Donor)',
    role: UserRole.DONOR,
    isActive: true,
    organizationId: null,
  });

  const showcaseDonor = await dbStore.donorProfiles.create({
    id: 'profile-donor-showcase',
    userId: showcaseDonorUser.id,
    bloodGroup: BloodGroup.O_POS,
    phone: '+91 98860 12345',
    city: 'Bengaluru',
    area: 'Shivajinagar / Central',
    approxLat: 12.98,
    approxLng: 77.60,
    gridCell: 'GRID_12.98_77.60',
    isAvailable: true,
    maxTravelKm: 20,
    preferredComponents: 'WHOLE_BLOOD,PLATELETS',
    allowedChannels: 'IN_APP,EMAIL',
  });

  // 9. Seed ~100 realistic voluntary potential donors across Bengaluru
  const bengaluruneighborhoods = [
    { name: 'Koramangala', lat: 12.93, lng: 77.62 },
    { name: 'Indiranagar', lat: 12.97, lng: 77.64 },
    { name: 'Jayanagar', lat: 12.92, lng: 77.58 },
    { name: 'Malleshwaram', lat: 13.00, lng: 77.57 },
    { name: 'Whitefield', lat: 12.96, lng: 77.74 },
    { name: 'HSR Layout', lat: 12.91, lng: 77.64 },
    { name: 'Hebbal', lat: 13.03, lng: 77.59 },
    { name: 'BTM Layout', lat: 12.91, lng: 77.60 },
    { name: 'Rajajinagar', lat: 12.99, lng: 77.55 },
    { name: 'Electronic City', lat: 12.84, lng: 77.66 },
  ];

  const firstNames = ['Arjun', 'Priya', 'Karthik', 'Sneha', 'Ananya', 'Rohan', 'Vikram', 'Deepa', 'Suresh', 'Meera', 'Aditya', 'Pooja', 'Varun', 'Divya', 'Naveen'];
  const lastNames = ['Kumar', 'Reddy', 'Rao', 'Iyer', 'Patil', 'Nair', 'Sharma', 'Gowda', 'Menon', 'Shetty', 'Verma', 'Deshmukh'];

  for (let i = 1; i <= 95; i++) {
    const loc = bengaluruneighborhoods[i % bengaluruneighborhoods.length];
    const bg = bloodGroups[i % bloodGroups.length];
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];

    const jitterLat = Math.round((loc.lat + (Math.random() - 0.5) * 0.04) * 100) / 100;
    const jitterLng = Math.round((loc.lng + (Math.random() - 0.5) * 0.04) * 100) / 100;

    const u = await dbStore.users.create({
      id: `user-donor-${i}`,
      email: `donor${i}@bengaluru-blood.org`,
      passwordHash,
      fullName: `${fn} ${ln}`,
      role: UserRole.DONOR,
      isActive: true,
      organizationId: null,
    });

    await dbStore.donorProfiles.create({
      id: `profile-donor-${i}`,
      userId: u.id,
      bloodGroup: bg,
      phone: `+91 98440 ${10000 + i}`,
      city: 'Bengaluru',
      area: loc.name,
      approxLat: jitterLat,
      approxLng: jitterLng,
      gridCell: `GRID_${jitterLat}_${jitterLng}`,
      isAvailable: i % 10 !== 0,
      maxTravelKm: 15 + (i % 15),
      preferredComponents: 'WHOLE_BLOOD',
      allowedChannels: 'IN_APP,EMAIL',
    });
  }

  // 10. Seed Sample Cases Across Stages
  const now = new Date();

  const req1 = await dbStore.emergencyRequests.create({
    id: 'req-emergency-001',
    hospitalId: 'org-hosp-01',
    bloodCentreId: 'org-centre-01',
    bloodGroup: BloodGroup.O_POS,
    component: BloodComponent.WHOLE_BLOOD,
    unitsNeeded: 3,
    urgency: Urgency.CRITICAL,
    requiredBy: new Date(now.getTime() + 4 * 3600 * 1000).toISOString(),
    status: RequestStatus.VERIFIED,
    clinicalNotes: 'Urgent emergency surgery - cardiac trauma ward. Shelf inventory depleted.',
    approxLat: 12.96,
    approxLng: 77.58,
  });

  await dbStore.requestVerifications.create({
    requestId: req1.id,
    verifiedByUserId: 'centre-officer-01',
    unitsAvailableAtCentre: 1,
    shortageUnits: 2,
    status: RequestStatus.VERIFIED,
    notes: 'Confirmed stock shortage: Only 1 unit in cold storage; remaining 2 units required.',
  });

  const case1 = await dbStore.emergencyCases.create({
    id: 'case-stage-1-live',
    requestId: req1.id,
    bloodCentreId: 'org-centre-01',
    shortageUnits: 2,
    unitsFulfilled: 0,
    status: CaseStatus.ACTIVE_STAGE_1,
    currentStageNumber: 1,
    nextStageDueAt: new Date(now.getTime() + 8 * 60 * 1000).toISOString(),
  });

  await dbStore.caseStages.create({
    caseId: case1.id,
    stageNumber: 1,
    actionType: StageActionType.NOTIFY_DONORS,
    radiusKm: 5,
    timeoutMinutes: 10,
    minResponsesFactor: 1.5,
    startedAt: now.toISOString(),
    dueAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
    isCurrent: true,
  });

  await dbStore.donorNotifications.createBatch([
    {
      caseId: case1.id,
      stageNumber: 1,
      donorProfileId: showcaseDonor.id,
      distanceKm: 2.4,
    },
  ]);

  logger.info('Database seed executed successfully.');
}
