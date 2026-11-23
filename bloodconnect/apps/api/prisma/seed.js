"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dbStore_1 = require("../src/data/dbStore");
const pino_1 = require("../src/common/logger/pino");
const shared_1 = require("@bloodconnect/shared");
async function seedDatabase(reset = false) {
    if (reset) {
        dbStore_1.dbStore.clear();
    }
    const passwordHash = await bcryptjs_1.default.hash('Password@123', 10);
    const adminPasswordHash = await bcryptjs_1.default.hash('Admin@12345', 10);
    // 1. Seed Case Stage Rules
    await dbStore_1.dbStore.caseStageRules.upsert({
        stageNumber: 1,
        actionType: shared_1.StageActionType.NOTIFY_DONORS,
        radiusKm: 5,
        timeoutMinutes: 10,
        minResponsesFactor: 1.5,
        autoAdvanceOnTimeout: true,
    });
    await dbStore_1.dbStore.caseStageRules.upsert({
        stageNumber: 2,
        actionType: shared_1.StageActionType.NOTIFY_DONORS,
        radiusKm: 15,
        timeoutMinutes: 10,
        minResponsesFactor: 1.5,
        autoAdvanceOnTimeout: true,
    });
    await dbStore_1.dbStore.caseStageRules.upsert({
        stageNumber: 3,
        actionType: shared_1.StageActionType.ACTIVATE_NGO,
        radiusKm: 30,
        timeoutMinutes: 15,
        minResponsesFactor: 2.0,
        autoAdvanceOnTimeout: true,
    });
    await dbStore_1.dbStore.caseStageRules.upsert({
        stageNumber: 4,
        actionType: shared_1.StageActionType.ESCALATE_CENTRES,
        radiusKm: 50,
        timeoutMinutes: 20,
        minResponsesFactor: 2.0,
        autoAdvanceOnTimeout: false,
    });
    // 2. Seed Relevant Group Mappings (Standard 1:1 default)
    const bloodGroups = Object.values(shared_1.BloodGroup);
    for (const bg of bloodGroups) {
        await dbStore_1.dbStore.relevantGroupMappings.setMapping(bg, bg, 'Default administrative same-group notification');
    }
    // 3. Seed System Config
    await dbStore_1.dbStore.systemConfigs.upsert('EMERGENCY_OVERRIDE_QUIET_HOURS', 'true', 'Allows CRITICAL urgency alerts during quiet hours');
    await dbStore_1.dbStore.systemConfigs.upsert('MAX_STAGE_HOURS', '4', 'Maximum allowed active coordination window before audit review');
    // 4. Seed Admin
    const adminUser = await dbStore_1.dbStore.users.create({
        id: 'user-admin-01',
        email: 'admin@bloodconnect.org',
        passwordHash: adminPasswordHash,
        fullName: 'Chief Medical Administrator',
        role: shared_1.UserRole.ADMIN,
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
        const org = await dbStore_1.dbStore.organizations.create({
            id: h.id,
            name: h.name,
            type: shared_1.OrganizationType.HOSPITAL,
            status: shared_1.OrganizationStatus.ACTIVE,
            licenseNumber: h.license,
            contactEmail: h.email,
            contactPhone: '+91 80 2670 1150',
            city: h.city,
            area: h.area,
            approxLat: h.lat,
            approxLng: h.lng,
            gridCell: `GRID_${h.lat}_${h.lng}`,
        });
        await dbStore_1.dbStore.hospitalProfiles.create({
            organizationId: org.id,
            emergencyHelpline: '108',
            bedCapacity: 500,
        });
        await dbStore_1.dbStore.users.create({
            email: h.email,
            passwordHash,
            fullName: `${h.name} Coordinator`,
            role: shared_1.UserRole.HOSPITAL,
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
        const org = await dbStore_1.dbStore.organizations.create({
            id: c.id,
            name: c.name,
            type: shared_1.OrganizationType.BLOOD_CENTRE,
            status: shared_1.OrganizationStatus.ACTIVE,
            licenseNumber: c.license,
            contactEmail: c.email,
            contactPhone: '+91 80 2226 4422',
            city: c.city,
            area: c.area,
            approxLat: c.lat,
            approxLng: c.lng,
            gridCell: `GRID_${c.lat}_${c.lng}`,
        });
        await dbStore_1.dbStore.bloodCentreProfiles.create({
            organizationId: org.id,
            storageCapacityUnits: 800,
            operatingHours: '24x7',
        });
        await dbStore_1.dbStore.users.create({
            email: c.email,
            passwordHash,
            fullName: `${c.name} Officer`,
            role: shared_1.UserRole.BLOOD_CENTRE,
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
        const org = await dbStore_1.dbStore.organizations.create({
            id: n.id,
            name: n.name,
            type: shared_1.OrganizationType.NGO,
            status: shared_1.OrganizationStatus.ACTIVE,
            licenseNumber: n.license,
            contactEmail: n.email,
            contactPhone: '+91 80 2656 7799',
            city: n.city,
            area: n.area,
            approxLat: n.lat,
            approxLng: n.lng,
            gridCell: `GRID_${n.lat}_${n.lng}`,
        });
        const profile = await dbStore_1.dbStore.ngoProfiles.create({
            organizationId: org.id,
            volunteerCountEstimate: 25,
            primaryContactName: 'Community Mobilization Lead',
        });
        await dbStore_1.dbStore.users.create({
            email: n.email,
            passwordHash,
            fullName: `${n.name} Coordinator`,
            role: shared_1.UserRole.NGO,
            isActive: true,
            organizationId: org.id,
        });
        // Seed 5 volunteers per NGO
        for (let v = 1; v <= 5; v++) {
            await dbStore_1.dbStore.volunteers.create({
                ngoProfileId: profile.id,
                fullName: `${n.name} Volunteer #${v}`,
                phone: `+91 98450 ${10000 + v}`,
                email: `volunteer${v}.${n.id}@bloodconnect.org`,
                city: 'Bengaluru',
                area: n.area,
                approxLat: n.lat,
                approxLng: n.lng,
                gridCell: `GRID_${n.lat}_${n.lng}`,
                bloodGroup: shared_1.BloodGroup.O_POS,
                specialSkills: v === 1 ? 'Emergency Ambulance Driver' : 'Community Mobilizer',
                isActive: true,
            });
        }
    }
    // 8. Seed Standard Showcase Donor
    const showcaseDonorUser = await dbStore_1.dbStore.users.create({
        id: 'user-donor-showcase',
        email: 'donor@bloodconnect.org',
        passwordHash,
        fullName: 'Rahul Sharma (Showcase Voluntary Donor)',
        role: shared_1.UserRole.DONOR,
        isActive: true,
        organizationId: null,
    });
    const showcaseDonor = await dbStore_1.dbStore.donorProfiles.create({
        id: 'profile-donor-showcase',
        userId: showcaseDonorUser.id,
        bloodGroup: shared_1.BloodGroup.O_POS,
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
        // Jitter coordinates slightly within ~1-2 km
        const jitterLat = Math.round((loc.lat + (Math.random() - 0.5) * 0.04) * 100) / 100;
        const jitterLng = Math.round((loc.lng + (Math.random() - 0.5) * 0.04) * 100) / 100;
        const u = await dbStore_1.dbStore.users.create({
            id: `user-donor-${i}`,
            email: `donor${i}@bengaluru-blood.org`,
            passwordHash,
            fullName: `${fn} ${ln}`,
            role: shared_1.UserRole.DONOR,
            isActive: true,
            organizationId: null,
        });
        await dbStore_1.dbStore.donorProfiles.create({
            id: `profile-donor-${i}`,
            userId: u.id,
            bloodGroup: bg,
            phone: `+91 98440 ${10000 + i}`,
            city: 'Bengaluru',
            area: loc.name,
            approxLat: jitterLat,
            approxLng: jitterLng,
            gridCell: `GRID_${jitterLat}_${jitterLng}`,
            isAvailable: i % 10 !== 0, // 90% available
            maxTravelKm: 15 + (i % 15),
            preferredComponents: 'WHOLE_BLOOD',
            allowedChannels: 'IN_APP,EMAIL',
        });
    }
    // 10. Seed Cases Across Different Stages
    const now = new Date();
    // Case 1: ACTIVE STAGE 1 (Targeting showcase donor!)
    const req1 = await dbStore_1.dbStore.emergencyRequests.create({
        id: 'req-emergency-001',
        hospitalId: 'org-hosp-01',
        bloodCentreId: 'org-centre-01',
        bloodGroup: shared_1.BloodGroup.O_POS,
        component: shared_1.BloodComponent.WHOLE_BLOOD,
        unitsNeeded: 3,
        urgency: shared_1.Urgency.CRITICAL,
        requiredBy: new Date(now.getTime() + 4 * 3600 * 1000).toISOString(),
        status: shared_1.RequestStatus.VERIFIED,
        clinicalNotes: 'Urgent emergency surgery - cardiac trauma ward. Shelf inventory depleted.',
        approxLat: 12.96,
        approxLng: 77.58,
    });
    await dbStore_1.dbStore.requestVerifications.create({
        requestId: req1.id,
        verifiedByUserId: 'centre-officer-01',
        unitsAvailableAtCentre: 1,
        shortageUnits: 2,
        status: shared_1.RequestStatus.VERIFIED,
        notes: 'Confirmed stock shortage: Only 1 unit in cold storage; remaining 2 units required.',
    });
    const case1 = await dbStore_1.dbStore.emergencyCases.create({
        id: 'case-stage-1-live',
        requestId: req1.id,
        bloodCentreId: 'org-centre-01',
        shortageUnits: 2,
        unitsFulfilled: 0,
        status: shared_1.CaseStatus.ACTIVE_STAGE_1,
        currentStageNumber: 1,
        nextStageDueAt: new Date(now.getTime() + 8 * 60 * 1000).toISOString(),
    });
    await dbStore_1.dbStore.caseStages.create({
        caseId: case1.id,
        stageNumber: 1,
        actionType: shared_1.StageActionType.NOTIFY_DONORS,
        radiusKm: 5,
        timeoutMinutes: 10,
        minResponsesFactor: 1.5,
        startedAt: now.toISOString(),
        dueAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
        isCurrent: true,
    });
    // Notify showcase donor for Case 1
    await dbStore_1.dbStore.donorNotifications.createBatch([
        {
            caseId: case1.id,
            stageNumber: 1,
            donorProfileId: showcaseDonor.id,
            distanceKm: 2.4,
        },
    ]);
    // Case 2: ACTIVE STAGE 2 (Expanded radius)
    const req2 = await dbStore_1.dbStore.emergencyRequests.create({
        id: 'req-emergency-002',
        hospitalId: 'org-hosp-02',
        bloodCentreId: 'org-centre-02',
        bloodGroup: shared_1.BloodGroup.B_POS,
        component: shared_1.BloodComponent.PLATELETS,
        unitsNeeded: 4,
        urgency: shared_1.Urgency.HIGH,
        requiredBy: new Date(now.getTime() + 6 * 3600 * 1000).toISOString(),
        status: shared_1.RequestStatus.VERIFIED,
        clinicalNotes: 'ICU Oncology patient with critical thrombocytopenia.',
        approxLat: 12.96,
        approxLng: 77.65,
    });
    await dbStore_1.dbStore.requestVerifications.create({
        requestId: req2.id,
        verifiedByUserId: 'centre-officer-02',
        unitsAvailableAtCentre: 0,
        shortageUnits: 4,
        status: shared_1.RequestStatus.VERIFIED,
    });
    const case2 = await dbStore_1.dbStore.emergencyCases.create({
        id: 'case-stage-2-live',
        requestId: req2.id,
        bloodCentreId: 'org-centre-02',
        shortageUnits: 4,
        unitsFulfilled: 0,
        status: shared_1.CaseStatus.ACTIVE_STAGE_2,
        currentStageNumber: 2,
        nextStageDueAt: new Date(now.getTime() + 6 * 60 * 1000).toISOString(),
    });
    await dbStore_1.dbStore.caseStages.create({
        caseId: case2.id,
        stageNumber: 2,
        actionType: shared_1.StageActionType.NOTIFY_DONORS,
        radiusKm: 15,
        timeoutMinutes: 10,
        minResponsesFactor: 1.5,
        startedAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        dueAt: new Date(now.getTime() + 6 * 60 * 1000).toISOString(),
        isCurrent: true,
    });
    // Case 3: NGO ACTIVATED (Stage 3)
    const req3 = await dbStore_1.dbStore.emergencyRequests.create({
        id: 'req-emergency-003',
        hospitalId: 'org-hosp-03',
        bloodCentreId: 'org-centre-03',
        bloodGroup: shared_1.BloodGroup.AB_NEG,
        component: shared_1.BloodComponent.RED_BLOOD_CELLS,
        unitsNeeded: 2,
        urgency: shared_1.Urgency.CRITICAL,
        requiredBy: new Date(now.getTime() + 3 * 3600 * 1000).toISOString(),
        status: shared_1.RequestStatus.VERIFIED,
        clinicalNotes: 'Rare blood group emergency delivery case.',
        approxLat: 12.85,
        approxLng: 77.66,
    });
    await dbStore_1.dbStore.requestVerifications.create({
        requestId: req3.id,
        verifiedByUserId: 'centre-officer-03',
        unitsAvailableAtCentre: 0,
        shortageUnits: 2,
        status: shared_1.RequestStatus.VERIFIED,
    });
    const case3 = await dbStore_1.dbStore.emergencyCases.create({
        id: 'case-stage-3-ngo',
        requestId: req3.id,
        bloodCentreId: 'org-centre-03',
        shortageUnits: 2,
        unitsFulfilled: 0,
        status: shared_1.CaseStatus.NGO_ACTIVATED,
        currentStageNumber: 3,
        nextStageDueAt: new Date(now.getTime() + 12 * 60 * 1000).toISOString(),
    });
    await dbStore_1.dbStore.ngoActivations.create({
        caseId: case3.id,
        ngoOrganizationId: 'org-ngo-01',
        broadcastMessage: 'Urgent rare AB_NEG blood required for emergency maternal delivery case.',
    });
    // Case 4: FULFILLED CASE WITH RECORDED OUTCOMES
    const req4 = await dbStore_1.dbStore.emergencyRequests.create({
        id: 'req-emergency-004',
        hospitalId: 'org-hosp-01',
        bloodCentreId: 'org-centre-01',
        bloodGroup: shared_1.BloodGroup.A_POS,
        component: shared_1.BloodComponent.WHOLE_BLOOD,
        unitsNeeded: 2,
        urgency: shared_1.Urgency.HIGH,
        requiredBy: new Date(now.getTime() + 12 * 3600 * 1000).toISOString(),
        status: shared_1.RequestStatus.VERIFIED,
        approxLat: 12.96,
        approxLng: 77.58,
    });
    const case4 = await dbStore_1.dbStore.emergencyCases.create({
        id: 'case-fulfilled-004',
        requestId: req4.id,
        bloodCentreId: 'org-centre-01',
        shortageUnits: 2,
        unitsFulfilled: 2,
        status: shared_1.CaseStatus.FULFILLED,
        currentStageNumber: 1,
    });
    await dbStore_1.dbStore.donationOutcomes.create({
        caseId: case4.id,
        donorProfileId: 'profile-donor-1',
        recordedByUserId: 'centre-officer-01',
        outcome: shared_1.DonationOutcomeType.DONATED,
        unitsCollected: 1,
        clinicalNotes: 'Screening passed, voluntary donation completed.',
    });
    await dbStore_1.dbStore.donationOutcomes.create({
        caseId: case4.id,
        donorProfileId: 'profile-donor-2',
        recordedByUserId: 'centre-officer-01',
        outcome: shared_1.DonationOutcomeType.DONATED,
        unitsCollected: 1,
        clinicalNotes: 'Screening passed, voluntary donation completed.',
    });
    pino_1.logger.info('Database seeded successfully with 1 Admin, 3 Hospitals, 3 Blood Centres, 2 NGOs, 96 Donors, and 4 sample cases.');
}
if (process.argv[1]?.includes('seed.ts')) {
    seedDatabase(true).then(() => {
        console.log('Seed command completed.');
        process.exit(0);
    });
}
