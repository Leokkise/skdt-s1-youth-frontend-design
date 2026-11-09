import { client } from './AuthProvider';
import { youthReviewV2 } from './youth-review-v2';
import { businessActivityV2 } from './business-activity-v2';
import { businessActivityV1 } from './business-activity';
import { youthWorkflowV1 } from './youth-workflow';
import { youthCorrectionsV1 } from './youth-corrections';
import { youthFamilyExportV1 } from './youth-family-export';
export const reviewService = client ? youthReviewV2(client) : null;
export const activityService = client ? businessActivityV2(client) : null;
export const legacyActivityService = client ? businessActivityV1(client) : null;
// S1-028 candidate; server policy gates still decide whether writes are available.
export const workflowService = client ? youthWorkflowV1(client) : null;
export const correctionService = client ? youthCorrectionsV1(client) : null;
export const familyService = client ? youthFamilyExportV1(client) : null;

import { youthAcknowledgmentsV1 } from './youth-acknowledgments';
export const acknowledgmentService = client ? youthAcknowledgmentsV1(client) : null;
